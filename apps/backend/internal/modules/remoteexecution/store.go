package remoteexecution

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"
)

var ErrExecutionNotFound = errors.New("remote execution not found")
var ErrExecutionAuthorityConflict = errors.New("remote execution authority conflict")

type GrantStore interface {
	VerifyWorkspaceOwner(ctx context.Context, ownerID string, workspaceID string) error
	RecordExecution(ctx context.Context, authority ExecutionAuthority) error
	VerifyExecutionOwner(ctx context.Context, ownerID string, sessionID string, executionID string) error
}

type EnvironmentReference struct {
	EnvironmentID string
	Revision      string
	Mode          string
}

type ExecutionAuthority struct {
	ExecutionID string
	WorkspaceID string
	OwnerID     string
	SessionID   string
	Environment *EnvironmentReference
}

type Store struct{ db *sql.DB }

func NewStore(db *sql.DB) *Store { return &Store{db: db} }

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

func (store *Store) VerifyWorkspaceOwner(ctx context.Context, ownerID string, workspaceID string) error {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var marker int
	err := store.db.QueryRowContext(ctx, `SELECT 1 FROM workspaces WHERE id = $1 AND owner_id = $2`, strings.TrimSpace(workspaceID), strings.TrimSpace(ownerID)).Scan(&marker)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrExecutionNotFound
	}
	return err
}

func (store *Store) RecordExecution(ctx context.Context, authority ExecutionAuthority) error {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var environmentID, environmentRevision, environmentMode any
	if authority.Environment != nil {
		environmentID = strings.TrimSpace(authority.Environment.EnvironmentID)
		environmentRevision = strings.TrimSpace(authority.Environment.Revision)
		environmentMode = strings.TrimSpace(authority.Environment.Mode)
	}
	sessionID := strings.TrimSpace(authority.SessionID)
	if authority.Environment == nil {
		sessionID = ""
	}
	result, err := store.db.ExecContext(ctx, `INSERT INTO remote_execution_grants (execution_id, workspace_id, owner_id, session_id, environment_id, environment_revision, environment_mode)
VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7)
ON CONFLICT (execution_id) DO UPDATE SET execution_id = EXCLUDED.execution_id
WHERE remote_execution_grants.workspace_id = EXCLUDED.workspace_id
	AND remote_execution_grants.owner_id = EXCLUDED.owner_id
	AND remote_execution_grants.session_id IS NOT DISTINCT FROM EXCLUDED.session_id
	AND remote_execution_grants.environment_id IS NOT DISTINCT FROM EXCLUDED.environment_id
	AND remote_execution_grants.environment_revision IS NOT DISTINCT FROM EXCLUDED.environment_revision
	AND remote_execution_grants.environment_mode IS NOT DISTINCT FROM EXCLUDED.environment_mode`, strings.TrimSpace(authority.ExecutionID), strings.TrimSpace(authority.WorkspaceID), strings.TrimSpace(authority.OwnerID), sessionID, environmentID, environmentRevision, environmentMode)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows != 1 {
		return ErrExecutionAuthorityConflict
	}
	return nil
}

func (store *Store) VerifyExecutionOwner(ctx context.Context, ownerID string, sessionID string, executionID string) error {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var marker int
	err := store.db.QueryRowContext(ctx, `SELECT 1 FROM remote_execution_grants WHERE execution_id = $1 AND owner_id = $2 AND (session_id IS NULL OR session_id = $3)`, strings.TrimSpace(executionID), strings.TrimSpace(ownerID), strings.TrimSpace(sessionID)).Scan(&marker)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrExecutionNotFound
	}
	return err
}

package remoteexecution

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"
)

var ErrExecutionNotFound = errors.New("remote execution not found")
var ErrExecutionAuthorityConflict = errors.New("remote execution authority conflict")

type GrantStore interface {
	VerifyWorkspaceOwner(ctx context.Context, ownerID string, workspaceID string) error
	RecordExecution(ctx context.Context, authority ExecutionAuthority) error
	VerifyExecutionPrincipalSession(ctx context.Context, principalID string, sessionID string, executionID string) error
	GetExecutionAuthority(ctx context.Context, principalID string, sessionID string, executionID string) (*ExecutionAuthority, error)
	GetDataSourceDocument(ctx context.Context, authority ExecutionAuthority, documentID string) ([]byte, error)
}

type ExecutionGatewayStore interface {
	GrantStore
	ResolveWorkspaceExecutionPermissions(ctx context.Context, principalID string, workspaceID string) ([]string, error)
}

type EnvironmentReference struct {
	EnvironmentID string
	Revision      string
	Mode          string
}

type ExecutionAuthority struct {
	ExecutionID        string
	WorkspaceID        string
	PrincipalID        string
	SessionID          string
	Permissions        []string
	ProviderID         string
	Profile            string
	RuntimeZone        string
	SnapshotID         string
	PartitionRevisions map[string]string
	Environment        *EnvironmentReference
}

type Store struct{ db *sql.DB }

func NewStore(db *sql.DB) *Store { return &Store{db: db} }

func withTimeout(ctx context.Context) (context.Context, context.CancelFunc) {
	return context.WithTimeout(ctx, 5*time.Second)
}

// ResolveWorkspaceExecutionPermissions projects the canonical Workspace owner or
// bounded collaborator role into the exact permissions that may enter a short-
// lived Remote execution authority. The Auth configuration document is not an
// authorization source and is intentionally absent from this lookup.
func (store *Store) ResolveWorkspaceExecutionPermissions(ctx context.Context, principalID string, workspaceID string) ([]string, error) {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var isOwner bool
	var collaboratorRole sql.NullString
	err := store.db.QueryRowContext(ctx, `SELECT w.owner_id = $2, r.role
FROM workspaces w
LEFT JOIN workspace_execution_role_grants r
	ON r.workspace_id = w.id AND r.principal_id = $2
WHERE w.id = $1`, strings.TrimSpace(workspaceID), strings.TrimSpace(principalID)).Scan(&isOwner, &collaboratorRole)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrExecutionNotFound
	}
	if err != nil {
		return nil, err
	}
	if isOwner {
		if collaboratorRole.Valid {
			return nil, ErrExecutionAuthorityConflict
		}
		return cloneExecutionPermissions(workspaceOwnerExecutionPermissions), nil
	}
	if !collaboratorRole.Valid {
		return nil, ErrExecutionNotFound
	}
	if collaboratorRole.String != workspaceExecutionViewerRole {
		return nil, ErrExecutionAuthorityConflict
	}
	return cloneExecutionPermissions(workspaceViewerExecutionPermissions), nil
}

// VerifyWorkspaceOwner remains the stricter authority used by the current
// Remote live Server Function adapters. A viewer execution role does not open
// owner guards, live mutation, Environment material, or Secret adapters.
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

// GrantWorkspaceExecutionViewer is the owner-fenced persistence boundary used
// by a future collaboration surface. A viewer receives only workspace.read;
// this method does not grant Environment/Secret access or mutate Workspace VFS.
func (store *Store) GrantWorkspaceExecutionViewer(ctx context.Context, ownerID string, workspaceID string, principalID string) error {
	ownerID = strings.TrimSpace(ownerID)
	workspaceID = strings.TrimSpace(workspaceID)
	principalID = strings.TrimSpace(principalID)
	if ownerID == "" || workspaceID == "" || principalID == "" || ownerID == principalID {
		return ErrExecutionAuthorityConflict
	}
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	result, err := store.db.ExecContext(ctx, `INSERT INTO workspace_execution_role_grants (workspace_id, principal_id, role, granted_by, granted_at)
SELECT w.id, u.id, $4, w.owner_id, NOW()
FROM workspaces w
JOIN users u ON u.id = $3
WHERE w.id = $1 AND w.owner_id = $2 AND u.id <> w.owner_id
ON CONFLICT (workspace_id, principal_id) DO UPDATE
SET role = EXCLUDED.role,
	granted_by = EXCLUDED.granted_by,
	granted_at = EXCLUDED.granted_at`, workspaceID, ownerID, principalID, workspaceExecutionViewerRole)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows != 1 {
		return ErrExecutionNotFound
	}
	return nil
}

// RevokeWorkspaceExecutionViewer removes the canonical role before any later
// execution authority is issued. Already-issued authority remains bounded by
// its immutable execution/session identity and at-most-five-minute expiry.
func (store *Store) RevokeWorkspaceExecutionViewer(ctx context.Context, ownerID string, workspaceID string, principalID string) error {
	ownerID = strings.TrimSpace(ownerID)
	workspaceID = strings.TrimSpace(workspaceID)
	principalID = strings.TrimSpace(principalID)
	if ownerID == "" || workspaceID == "" || principalID == "" || ownerID == principalID {
		return ErrExecutionAuthorityConflict
	}
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	result, err := store.db.ExecContext(ctx, `DELETE FROM workspace_execution_role_grants r
USING workspaces w
WHERE r.workspace_id = $1
	AND r.principal_id = $3
	AND w.id = r.workspace_id
	AND w.owner_id = $2`, workspaceID, ownerID, principalID)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows != 1 {
		return ErrExecutionNotFound
	}
	return nil
}

func (store *Store) RecordExecution(ctx context.Context, authority ExecutionAuthority) error {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	expectedProviderID, validExecutionClass := expectedRemoteProvider(authority.Profile, authority.RuntimeZone)
	if strings.TrimSpace(authority.ExecutionID) == "" || strings.TrimSpace(authority.WorkspaceID) == "" || strings.TrimSpace(authority.PrincipalID) == "" || strings.TrimSpace(authority.SnapshotID) == "" || authority.ProviderID != expectedProviderID || !validExecutionClass || len(authority.PartitionRevisions) == 0 || len(authority.PartitionRevisions) > 4096 {
		return ErrExecutionAuthorityConflict
	}
	for partition, revision := range authority.PartitionRevisions {
		if partition == "" || partition != strings.TrimSpace(partition) || revision == "" || revision != strings.TrimSpace(revision) {
			return ErrExecutionAuthorityConflict
		}
	}
	var environmentID, environmentRevision, environmentMode any
	if authority.Environment != nil {
		environmentID = strings.TrimSpace(authority.Environment.EnvironmentID)
		environmentRevision = strings.TrimSpace(authority.Environment.Revision)
		environmentMode = strings.TrimSpace(authority.Environment.Mode)
	}
	sessionID := strings.TrimSpace(authority.SessionID)
	if sessionID == "" {
		return ErrExecutionAuthorityConflict
	}
	permissions, validPermissions := canonicalWorkspaceExecutionPermissions(authority.Permissions)
	if !validPermissions {
		return ErrExecutionAuthorityConflict
	}
	partitionRevisions, err := json.Marshal(authority.PartitionRevisions)
	if err != nil {
		return err
	}
	permissionsJSON, err := json.Marshal(permissions)
	if err != nil {
		return err
	}
	result, err := store.db.ExecContext(ctx, `INSERT INTO remote_execution_grants (execution_id, workspace_id, principal_id, session_id, permissions_json, provider_id, profile, runtime_zone, snapshot_id, partition_revisions_json, environment_id, environment_revision, environment_mode)
VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6, $7, $8, $9, $10, $11, $12, $13)
ON CONFLICT (execution_id) DO UPDATE SET execution_id = EXCLUDED.execution_id
WHERE remote_execution_grants.workspace_id = EXCLUDED.workspace_id
	AND remote_execution_grants.principal_id = EXCLUDED.principal_id
	AND remote_execution_grants.session_id IS NOT DISTINCT FROM EXCLUDED.session_id
	AND remote_execution_grants.permissions_json IS NOT DISTINCT FROM EXCLUDED.permissions_json
	AND remote_execution_grants.provider_id IS NOT DISTINCT FROM EXCLUDED.provider_id
	AND remote_execution_grants.profile IS NOT DISTINCT FROM EXCLUDED.profile
	AND remote_execution_grants.runtime_zone IS NOT DISTINCT FROM EXCLUDED.runtime_zone
	AND remote_execution_grants.snapshot_id IS NOT DISTINCT FROM EXCLUDED.snapshot_id
	AND remote_execution_grants.partition_revisions_json IS NOT DISTINCT FROM EXCLUDED.partition_revisions_json
	AND remote_execution_grants.environment_id IS NOT DISTINCT FROM EXCLUDED.environment_id
	AND remote_execution_grants.environment_revision IS NOT DISTINCT FROM EXCLUDED.environment_revision
	AND remote_execution_grants.environment_mode IS NOT DISTINCT FROM EXCLUDED.environment_mode`, strings.TrimSpace(authority.ExecutionID), strings.TrimSpace(authority.WorkspaceID), strings.TrimSpace(authority.PrincipalID), sessionID, permissionsJSON, authority.ProviderID, authority.Profile, authority.RuntimeZone, strings.TrimSpace(authority.SnapshotID), partitionRevisions, environmentID, environmentRevision, environmentMode)
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

func (store *Store) GetExecutionAuthority(ctx context.Context, principalID string, sessionID string, executionID string) (*ExecutionAuthority, error) {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var authority ExecutionAuthority
	var storedSession sql.NullString
	var permissionsJSON, partitionRevisionsJSON []byte
	var providerID, profile, runtimeZone sql.NullString
	var environmentID, environmentRevision, environmentMode sql.NullString
	err := store.db.QueryRowContext(ctx, `SELECT execution_id, workspace_id, principal_id, session_id, permissions_json, provider_id, profile, runtime_zone, snapshot_id, partition_revisions_json, environment_id, environment_revision, environment_mode
FROM remote_execution_grants
WHERE execution_id = $1 AND principal_id = $2 AND (session_id IS NULL OR session_id = $3)`, strings.TrimSpace(executionID), strings.TrimSpace(principalID), strings.TrimSpace(sessionID)).Scan(
		&authority.ExecutionID,
		&authority.WorkspaceID,
		&authority.PrincipalID,
		&storedSession,
		&permissionsJSON,
		&providerID,
		&profile,
		&runtimeZone,
		&authority.SnapshotID,
		&partitionRevisionsJSON,
		&environmentID,
		&environmentRevision,
		&environmentMode,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrExecutionNotFound
	}
	if err != nil {
		return nil, err
	}
	authority.SessionID = storedSession.String
	if err := json.Unmarshal(permissionsJSON, &authority.Permissions); err != nil {
		return nil, ErrExecutionAuthorityConflict
	}
	permissions, validPermissions := canonicalWorkspaceExecutionPermissions(authority.Permissions)
	if !validPermissions {
		return nil, ErrExecutionAuthorityConflict
	}
	authority.Permissions = permissions
	if !providerID.Valid || !profile.Valid || !runtimeZone.Valid {
		return nil, ErrExecutionAuthorityConflict
	}
	expectedProviderID, validExecutionClass := expectedRemoteProvider(profile.String, runtimeZone.String)
	if !validExecutionClass || providerID.String != expectedProviderID {
		return nil, ErrExecutionAuthorityConflict
	}
	authority.ProviderID = providerID.String
	authority.Profile = profile.String
	authority.RuntimeZone = runtimeZone.String
	if err := json.Unmarshal(partitionRevisionsJSON, &authority.PartitionRevisions); err != nil || len(authority.PartitionRevisions) == 0 {
		return nil, ErrExecutionAuthorityConflict
	}
	if environmentID.Valid || environmentRevision.Valid || environmentMode.Valid {
		if !environmentID.Valid || !environmentRevision.Valid || !environmentMode.Valid {
			return nil, ErrExecutionAuthorityConflict
		}
		authority.Environment = &EnvironmentReference{EnvironmentID: environmentID.String, Revision: environmentRevision.String, Mode: environmentMode.String}
	}
	return &authority, nil
}

func (store *Store) GetDataSourceDocument(ctx context.Context, authority ExecutionAuthority, documentID string) ([]byte, error) {
	revision := authority.PartitionRevisions["document:"+strings.TrimSpace(documentID)+":content"]
	if revision == "" {
		return nil, ErrExecutionAuthorityConflict
	}
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var content []byte
	err := store.db.QueryRowContext(ctx, `SELECT content_json
FROM workspace_documents
WHERE workspace_id = $1 AND id = $2 AND doc_type = 'data-source' AND content_rev::text = $3`, authority.WorkspaceID, strings.TrimSpace(documentID), revision).Scan(&content)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrExecutionAuthorityConflict
	}
	return content, err
}

func (store *Store) GetCodeDocument(ctx context.Context, authority ExecutionAuthority, documentID string) ([]byte, error) {
	revision := authority.PartitionRevisions["document:"+strings.TrimSpace(documentID)+":content"]
	if revision == "" {
		return nil, ErrExecutionAuthorityConflict
	}
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var content []byte
	err := store.db.QueryRowContext(ctx, `SELECT content_json
FROM workspace_documents
WHERE workspace_id = $1 AND id = $2 AND doc_type = 'code' AND content_rev::text = $3`, authority.WorkspaceID, strings.TrimSpace(documentID), revision).Scan(&content)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrExecutionAuthorityConflict
	}
	return content, err
}

func (store *Store) VerifyExecutionPrincipalSession(ctx context.Context, principalID string, sessionID string, executionID string) error {
	ctx, cancel := withTimeout(ctx)
	defer cancel()
	var marker int
	err := store.db.QueryRowContext(ctx, `SELECT 1 FROM remote_execution_grants WHERE execution_id = $1 AND principal_id = $2 AND (session_id IS NULL OR session_id = $3)`, strings.TrimSpace(executionID), strings.TrimSpace(principalID), strings.TrimSpace(sessionID)).Scan(&marker)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrExecutionNotFound
	}
	return err
}

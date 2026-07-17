package remoteexecution

import (
	"database/sql"
	"errors"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestRecordExecutionPersistsExactEnvironmentAuthority(t *testing.T) {
	database, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	store := NewStore(database)
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO remote_execution_grants")).WithArgs("execution-1", "workspace-1", "principal-1", "session-1", "environment-1", "revision-7", "live").WillReturnResult(sqlmock.NewResult(1, 1))
	err = store.RecordExecution(t.Context(), ExecutionAuthority{
		ExecutionID: "execution-1", WorkspaceID: "workspace-1", OwnerID: "principal-1", SessionID: "session-1",
		Environment: &EnvironmentReference{EnvironmentID: "environment-1", Revision: "revision-7", Mode: "live"},
	})
	if err != nil {
		t.Fatalf("record authority: %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestRecordExecutionRejectsIdempotencyAuthorityDriftWithoutMutation(t *testing.T) {
	database, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	store := NewStore(database)
	mock.ExpectExec(regexp.QuoteMeta("INSERT INTO remote_execution_grants")).WithArgs("execution-1", "workspace-1", "principal-1", "session-2", "environment-1", "revision-8", "live").WillReturnResult(sqlmock.NewResult(0, 0))
	err = store.RecordExecution(t.Context(), ExecutionAuthority{
		ExecutionID: "execution-1", WorkspaceID: "workspace-1", OwnerID: "principal-1", SessionID: "session-2",
		Environment: &EnvironmentReference{EnvironmentID: "environment-1", Revision: "revision-8", Mode: "live"},
	})
	if !errors.Is(err, ErrExecutionAuthorityConflict) {
		t.Fatalf("expected authority conflict, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestVerifyExecutionOwnerPartitionsEnvironmentExecutionBySession(t *testing.T) {
	database, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer database.Close()
	store := NewStore(database)
	query := regexp.QuoteMeta("SELECT 1 FROM remote_execution_grants WHERE execution_id = $1 AND owner_id = $2 AND (session_id IS NULL OR session_id = $3)")
	mock.ExpectQuery(query).WithArgs("execution-1", "principal-1", "session-1").WillReturnRows(sqlmock.NewRows([]string{"marker"}).AddRow(1))
	if err := store.VerifyExecutionOwner(t.Context(), "principal-1", "session-1", "execution-1"); err != nil {
		t.Fatalf("verify exact session: %v", err)
	}
	mock.ExpectQuery(query).WithArgs("execution-1", "principal-1", "session-2").WillReturnError(sql.ErrNoRows)
	if err := store.VerifyExecutionOwner(t.Context(), "principal-1", "session-2", "execution-1"); !errors.Is(err, ErrExecutionNotFound) {
		t.Fatalf("expected cross-session denial, got %v", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

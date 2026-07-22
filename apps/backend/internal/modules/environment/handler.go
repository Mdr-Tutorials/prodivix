package environment

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	backendauth "github.com/Prodivix/prodivix/apps/backend/internal/modules/auth"
	backendresponse "github.com/Prodivix/prodivix/apps/backend/internal/platform/http/response"
	"github.com/gin-gonic/gin"
)

const maximumEnvironmentRequestBytes = 512 * 1024

type SnapshotStore interface {
	Available() bool
	PutSnapshot(ctx context.Context, input PutSnapshotInput) (*Snapshot, error)
	GetSnapshot(ctx context.Context, principal PrincipalSession, workspaceID string, environmentID string, revision string) (*Snapshot, error)
}

type Handler struct {
	store SnapshotStore
}

func NewHandler(store SnapshotStore) *Handler {
	return &Handler{store: store}
}

func (handler *Handler) Routes(requireAuth gin.HandlerFunc) RouteHandlers {
	return RouteHandlers{RequireAuth: requireAuth, PutSnapshot: handler.HandlePutSnapshot, GetSnapshot: handler.HandleGetSnapshot}
}

func authenticatedPrincipal(c *gin.Context) (PrincipalSession, bool) {
	user, userOK := backendauth.GetAuthUser[backendauth.User](c)
	session, sessionOK := backendauth.GetAuthSession(c)
	if !userOK || !sessionOK || session.UserID != user.ID {
		backendresponse.Error(c, http.StatusUnauthorized, "API-2001", "Authentication required.")
		return PrincipalSession{}, false
	}
	return PrincipalSession{PrincipalID: user.ID, SessionID: session.ID}, true
}

func (handler *Handler) available(c *gin.Context) bool {
	if handler == nil || handler.store == nil || !handler.store.Available() {
		backendresponse.Error(c, http.StatusServiceUnavailable, "ENV-5001", "Environment Secret store is unavailable.", backendresponse.WithRetryable(true))
		return false
	}
	return true
}

func decodeSnapshotRequest(c *gin.Context, target any) error {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maximumEnvironmentRequestBytes)
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		return err
	}
	if err := decoder.Decode(&struct{}{}); !errors.Is(err, io.EOF) {
		return errors.New("request must contain one JSON value")
	}
	return nil
}

func respondStoreError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrUnavailable):
		backendresponse.Error(c, http.StatusServiceUnavailable, "ENV-5001", "Environment Secret store is unavailable.", backendresponse.WithRetryable(true))
	case errors.Is(err, ErrNotFound), errors.Is(err, ErrPermissionDenied):
		backendresponse.Error(c, http.StatusNotFound, "ENV-4004", "Execution environment was not found.")
	case errors.Is(err, ErrRevisionConflict):
		backendresponse.Error(c, http.StatusConflict, "ENV-4009", "Execution environment revision is stale.")
	case errors.Is(err, ErrInvalid):
		backendresponse.Error(c, http.StatusUnprocessableEntity, "ENV-4001", "Execution environment is invalid.")
	default:
		backendresponse.Error(c, http.StatusServiceUnavailable, "ENV-5001", "Environment Secret store is unavailable.", backendresponse.WithRetryable(true))
	}
}

func (handler *Handler) HandlePutSnapshot(c *gin.Context) {
	if !handler.available(c) {
		return
	}
	principal, ok := authenticatedPrincipal(c)
	if !ok {
		return
	}
	var request struct {
		ExpectedRevision string            `json:"expectedRevision"`
		Mode             string            `json:"mode"`
		PublicBindings   map[string]any    `json:"publicBindingsById"`
		Secrets          map[string]string `json:"secretsById"`
	}
	if err := decodeSnapshotRequest(c, &request); err != nil {
		backendresponse.Error(c, http.StatusBadRequest, "ENV-4001", "Execution environment request is invalid.")
		return
	}
	if request.PublicBindings == nil {
		request.PublicBindings = map[string]any{}
	}
	if request.Secrets == nil {
		request.Secrets = map[string]string{}
	}
	snapshot, err := handler.store.PutSnapshot(c.Request.Context(), PutSnapshotInput{
		Principal: principal, WorkspaceID: c.Param("workspaceId"), EnvironmentID: c.Param("environmentId"), ExpectedRevision: request.ExpectedRevision,
		Mode: request.Mode, PublicBindings: request.PublicBindings, Secrets: request.Secrets,
	})
	if err != nil {
		respondStoreError(c, err)
		return
	}
	c.Header("Cache-Control", "private, no-store")
	c.JSON(http.StatusCreated, gin.H{"environment": snapshot})
}

func (handler *Handler) HandleGetSnapshot(c *gin.Context) {
	if !handler.available(c) {
		return
	}
	principal, ok := authenticatedPrincipal(c)
	if !ok {
		return
	}
	snapshot, err := handler.store.GetSnapshot(c.Request.Context(), principal, c.Param("workspaceId"), c.Param("environmentId"), c.Query("revision"))
	if err != nil {
		respondStoreError(c, err)
		return
	}
	c.Header("Cache-Control", "private, no-store")
	c.JSON(http.StatusOK, gin.H{"environment": snapshot})
}

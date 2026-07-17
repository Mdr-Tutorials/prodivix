package environment

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	backendauth "github.com/Prodivix/prodivix/apps/backend/internal/modules/auth"
	"github.com/gin-gonic/gin"
)

type fakeSnapshotStore struct {
	available bool
	putInput  PutSnapshotInput
}

func (store *fakeSnapshotStore) Available() bool { return store.available }

func (store *fakeSnapshotStore) PutSnapshot(_ context.Context, input PutSnapshotInput) (*Snapshot, error) {
	store.putInput = input
	return &Snapshot{EnvironmentID: input.EnvironmentID, WorkspaceID: input.WorkspaceID, Revision: "envrev-1", Mode: input.Mode, PublicBindings: input.PublicBindings, SecretBindingIDs: []string{"access-token"}, CreatedAt: time.Unix(1, 0).UTC()}, nil
}

func (store *fakeSnapshotStore) GetSnapshot(_ context.Context, _ PrincipalSession, workspaceID string, environmentID string, _ string) (*Snapshot, error) {
	return &Snapshot{EnvironmentID: environmentID, WorkspaceID: workspaceID, Revision: "envrev-1", Mode: "live", PublicBindings: map[string]any{"endpoint": "https://api.example.test"}, SecretBindingIDs: []string{"access-token"}, CreatedAt: time.Unix(1, 0).UTC()}, nil
}

func environmentTestRouter(store SnapshotStore) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	authenticate := func(c *gin.Context) {
		c.Set("authUser", &backendauth.User{ID: "principal-1"})
		c.Set("authSession", &backendauth.AuthenticatedSession{ID: "session-1", UserID: "principal-1", ExpiresAt: time.Now().Add(time.Hour).UnixMilli()})
		c.Next()
	}
	api := router.Group("/api")
	RegisterRoutes(api, NewHandler(store).Routes(authenticate))
	return router
}

func TestEnvironmentSnapshotResponseNeverReturnsSecretMaterial(t *testing.T) {
	store := &fakeSnapshotStore{available: true}
	canary := "prodivix-secret-canary"
	body, _ := json.Marshal(map[string]any{
		"mode":               "live",
		"publicBindingsById": map[string]any{"endpoint": "https://api.example.test"},
		"secretsById":        map[string]string{"access-token": canary},
	})
	request := httptest.NewRequest(http.MethodPut, "/api/workspaces/workspace-1/environments/environment-1", bytes.NewReader(body))
	response := httptest.NewRecorder()
	environmentTestRouter(store).ServeHTTP(response, request)
	if response.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", response.Code, response.Body.String())
	}
	if store.putInput.Principal.PrincipalID != "principal-1" || store.putInput.Principal.SessionID != "session-1" {
		t.Fatalf("principal/session partition was not propagated: %#v", store.putInput.Principal)
	}
	if store.putInput.Secrets["access-token"] != canary {
		t.Fatal("handler did not pass Secret to the store boundary")
	}
	if strings.Contains(response.Body.String(), canary) || strings.Contains(response.Body.String(), "secretsById") {
		t.Fatalf("Secret material leaked to response: %s", response.Body.String())
	}
	if response.Header().Get("Cache-Control") != "private, no-store" {
		t.Fatal("environment response is cacheable")
	}
}

func TestEnvironmentSnapshotRequiresMatchingAuthenticatedSession(t *testing.T) {
	gin.SetMode(gin.TestMode)
	store := &fakeSnapshotStore{available: true}
	router := gin.New()
	authenticate := func(c *gin.Context) {
		c.Set("authUser", &backendauth.User{ID: "principal-1"})
		c.Set("authSession", &backendauth.AuthenticatedSession{ID: "session-2", UserID: "principal-2"})
		c.Next()
	}
	api := router.Group("/api")
	RegisterRoutes(api, NewHandler(store).Routes(authenticate))
	request := httptest.NewRequest(http.MethodGet, "/api/workspaces/workspace-1/environments/environment-1", nil)
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)
	if response.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", response.Code)
	}
}

package environment

import (
	"errors"
	"regexp"
	"time"
)

var (
	ErrUnavailable      = errors.New("environment Secret store is unavailable")
	ErrInvalid          = errors.New("execution environment is invalid")
	ErrNotFound         = errors.New("execution environment not found")
	ErrRevisionConflict = errors.New("execution environment revision conflict")
	ErrPermissionDenied = errors.New("environment resolution permission denied")
)

var canonicalIdentifier = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9._:-]{0,255}$`)

type PrincipalSession struct {
	PrincipalID string
	SessionID   string
}

type Snapshot struct {
	EnvironmentID    string         `json:"environmentId"`
	WorkspaceID      string         `json:"workspaceId"`
	Revision         string         `json:"revision"`
	Mode             string         `json:"mode"`
	PublicBindings   map[string]any `json:"publicBindingsById"`
	SecretBindingIDs []string       `json:"secretBindingIds"`
	CreatedAt        time.Time      `json:"createdAt"`
}

type PutSnapshotInput struct {
	Principal        PrincipalSession
	WorkspaceID      string
	EnvironmentID    string
	ExpectedRevision string
	Mode             string
	PublicBindings   map[string]any
	Secrets          map[string]string
}

type SecretBindingGrant struct {
	BindingID string `json:"bindingId"`
	Field     string `json:"field"`
}

type IssueGrantInput struct {
	Principal         PrincipalSession
	WorkspaceID       string
	EnvironmentID     string
	Revision          string
	ProviderID        string
	ProviderIsolation string
	ExecutionClass    string
	RuntimeZone       string
	PurposeKind       string
	ResourceID        string
	SecretBindings    []SecretBindingGrant
	ExpiresAt         time.Time
}

type Grant struct {
	GrantID        string
	EnvironmentID  string
	Revision       string
	WorkspaceID    string
	Principal      PrincipalSession
	ProviderID     string
	PurposeKind    string
	ResourceID     string
	SecretBindings []SecretBindingGrant
	ExpiresAt      time.Time
}

type UseSecretInput struct {
	GrantID       string
	Principal     PrincipalSession
	WorkspaceID   string
	EnvironmentID string
	Revision      string
	ProviderID    string
	PurposeKind   string
	ResourceID    string
	BindingID     string
	Field         string
}

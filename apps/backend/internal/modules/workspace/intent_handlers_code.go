package workspace

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
)

type workspaceCodeDocumentCreateHandler struct{}

func (workspaceCodeDocumentCreateHandler) CanHandle(intent IntentEnvelope) bool {
	return intent.Namespace == "core.workspace" && intent.Type == "code-document.create"
}

func (workspaceCodeDocumentCreateHandler) Handle(
	ctx context.Context,
	store *WorkspaceStore,
	workspaceID string,
	request ApplyIntentRequest,
	_ IntentEnvelope,
	command WorkspaceCommandEnvelope,
) (*WorkspaceMutationResult, *RequestFailure) {
	var payload struct {
		DocumentID   string          `json:"documentId"`
		NodeID       string          `json:"nodeId"`
		ParentNodeID string          `json:"parentNodeId"`
		Path         string          `json:"path"`
		Content      json.RawMessage `json:"content"`
	}
	if len(request.Intent.Payload) == 0 ||
		json.Unmarshal(request.Intent.Payload, &payload) != nil ||
		strings.TrimSpace(payload.DocumentID) == "" ||
		strings.TrimSpace(payload.Path) == "" ||
		len(payload.Content) == 0 {
		return nil, NewRequestFailure(
			http.StatusUnprocessableEntity,
			ErrorInvalidPayload,
			"intent payload.documentId, payload.path and payload.content are required.",
			nil,
		)
	}
	command.Target.DocumentID = strings.TrimSpace(payload.DocumentID)
	result, err := store.CreateCodeDocument(ctx, CreateCodeDocumentMutationParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		DocumentID:           payload.DocumentID,
		NodeID:               payload.NodeID,
		ParentNodeID:         payload.ParentNodeID,
		Path:                 payload.Path,
		Content:              payload.Content,
		Command:              command,
	})
	if err != nil {
		return nil, MapStoreError(err)
	}
	return result, nil
}

type workspaceCodeDocumentRenameHandler struct{}

func (workspaceCodeDocumentRenameHandler) CanHandle(intent IntentEnvelope) bool {
	return intent.Namespace == "core.workspace" && intent.Type == "code-document.rename"
}

func (workspaceCodeDocumentRenameHandler) Handle(
	ctx context.Context,
	store *WorkspaceStore,
	workspaceID string,
	request ApplyIntentRequest,
	_ IntentEnvelope,
	command WorkspaceCommandEnvelope,
) (*WorkspaceMutationResult, *RequestFailure) {
	var payload struct {
		DocumentID string `json:"documentId"`
		Path       string `json:"path"`
	}
	if len(request.Intent.Payload) == 0 ||
		json.Unmarshal(request.Intent.Payload, &payload) != nil ||
		strings.TrimSpace(payload.DocumentID) == "" ||
		strings.TrimSpace(payload.Path) == "" {
		return nil, NewRequestFailure(
			http.StatusUnprocessableEntity,
			ErrorInvalidPayload,
			"intent payload.documentId and payload.path are required.",
			nil,
		)
	}
	command.Target.DocumentID = strings.TrimSpace(payload.DocumentID)
	result, err := store.RenameCodeDocument(ctx, RenameCodeDocumentMutationParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		DocumentID:           payload.DocumentID,
		Path:                 payload.Path,
		Command:              command,
	})
	if err != nil {
		return nil, MapStoreError(err)
	}
	return result, nil
}

type workspaceCodeDocumentDeleteHandler struct{}

func (workspaceCodeDocumentDeleteHandler) CanHandle(intent IntentEnvelope) bool {
	return intent.Namespace == "core.workspace" && intent.Type == "code-document.delete"
}

func (workspaceCodeDocumentDeleteHandler) Handle(
	ctx context.Context,
	store *WorkspaceStore,
	workspaceID string,
	request ApplyIntentRequest,
	_ IntentEnvelope,
	command WorkspaceCommandEnvelope,
) (*WorkspaceMutationResult, *RequestFailure) {
	var payload struct {
		DocumentID string `json:"documentId"`
	}
	if len(request.Intent.Payload) == 0 ||
		json.Unmarshal(request.Intent.Payload, &payload) != nil ||
		strings.TrimSpace(payload.DocumentID) == "" {
		return nil, NewRequestFailure(
			http.StatusUnprocessableEntity,
			ErrorInvalidPayload,
			"intent payload.documentId is required.",
			nil,
		)
	}
	command.Target.DocumentID = strings.TrimSpace(payload.DocumentID)
	result, err := store.DeleteCodeDocument(ctx, DeleteCodeDocumentMutationParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		DocumentID:           payload.DocumentID,
		Command:              command,
	})
	if err != nil {
		return nil, MapStoreError(err)
	}
	return result, nil
}

package workspace

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
)

type workspaceDirectoryCreateHandler struct{}

func (workspaceDirectoryCreateHandler) CanHandle(intent IntentEnvelope) bool {
	return intent.Namespace == "core.workspace" && intent.Type == "directory.create"
}

func (workspaceDirectoryCreateHandler) Handle(
	ctx context.Context,
	store *WorkspaceStore,
	workspaceID string,
	request ApplyIntentRequest,
	_ IntentEnvelope,
	command WorkspaceCommandEnvelope,
) (*WorkspaceMutationResult, *RequestFailure) {
	var payload struct {
		NodeID       string `json:"nodeId"`
		ParentNodeID string `json:"parentNodeId"`
		Name         string `json:"name"`
	}
	if len(request.Intent.Payload) == 0 ||
		json.Unmarshal(request.Intent.Payload, &payload) != nil ||
		strings.TrimSpace(payload.NodeID) == "" ||
		strings.TrimSpace(payload.Name) == "" {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "intent payload.nodeId and payload.name are required.", nil)
	}
	result, err := store.CreateWorkspaceDirectory(ctx, CreateWorkspaceDirectoryMutationParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		NodeID:               payload.NodeID,
		ParentNodeID:         payload.ParentNodeID,
		Name:                 payload.Name,
		Command:              command,
	})
	if err != nil {
		return nil, MapStoreError(err)
	}
	return result, nil
}

type workspaceDirectoryRenameHandler struct{}

func (workspaceDirectoryRenameHandler) CanHandle(intent IntentEnvelope) bool {
	return intent.Namespace == "core.workspace" && intent.Type == "directory.rename"
}

func (workspaceDirectoryRenameHandler) Handle(
	ctx context.Context,
	store *WorkspaceStore,
	workspaceID string,
	request ApplyIntentRequest,
	_ IntentEnvelope,
	command WorkspaceCommandEnvelope,
) (*WorkspaceMutationResult, *RequestFailure) {
	var payload struct {
		NodeID string `json:"nodeId"`
		Name   string `json:"name"`
	}
	if len(request.Intent.Payload) == 0 ||
		json.Unmarshal(request.Intent.Payload, &payload) != nil ||
		strings.TrimSpace(payload.NodeID) == "" ||
		strings.TrimSpace(payload.Name) == "" {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "intent payload.nodeId and payload.name are required.", nil)
	}
	result, err := store.RenameWorkspaceDirectory(ctx, RenameWorkspaceDirectoryMutationParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		NodeID:               payload.NodeID,
		Name:                 payload.Name,
		Command:              command,
	})
	if err != nil {
		return nil, MapStoreError(err)
	}
	return result, nil
}

type workspaceDirectoryDeleteHandler struct{}

func (workspaceDirectoryDeleteHandler) CanHandle(intent IntentEnvelope) bool {
	return intent.Namespace == "core.workspace" && intent.Type == "directory.delete"
}

func (workspaceDirectoryDeleteHandler) Handle(
	ctx context.Context,
	store *WorkspaceStore,
	workspaceID string,
	request ApplyIntentRequest,
	_ IntentEnvelope,
	command WorkspaceCommandEnvelope,
) (*WorkspaceMutationResult, *RequestFailure) {
	var payload struct {
		NodeID string `json:"nodeId"`
	}
	if len(request.Intent.Payload) == 0 ||
		json.Unmarshal(request.Intent.Payload, &payload) != nil ||
		strings.TrimSpace(payload.NodeID) == "" {
		return nil, NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "intent payload.nodeId is required.", nil)
	}
	result, err := store.DeleteWorkspaceDirectory(ctx, DeleteWorkspaceDirectoryMutationParams{
		WorkspaceID:          workspaceID,
		ExpectedWorkspaceRev: request.ExpectedWorkspaceRev,
		NodeID:               payload.NodeID,
		Command:              command,
	})
	if err != nil {
		return nil, MapStoreError(err)
	}
	return result, nil
}

package workspace

import (
	"encoding/json"
	"net/http"
	"strings"

	backendauth "github.com/Prodivix/prodivix/apps/backend/internal/modules/auth"
	backendresponse "github.com/Prodivix/prodivix/apps/backend/internal/platform/http/response"
	"github.com/gin-gonic/gin"
)

func (handler *Handler) HandleApplyWorkspaceBatch(c *gin.Context) {
	workspaceID := strings.TrimSpace(c.Param("workspaceId"))
	user, ok := backendauth.GetAuthUser[backendauth.User](c)
	if !ok {
		backendresponse.Error(c, http.StatusUnauthorized, "API-2001", "Authentication required.")
		return
	}
	var request ApplyBatchRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		failure := NewRequestFailure(http.StatusBadRequest, ErrorInvalidPayload, "Invalid request payload.", nil)
		c.JSON(failure.Status, failure.Payload)
		return
	}
	if request.ExpectedWorkspaceRev <= 0 {
		failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "expectedWorkspaceRev must be positive.", nil)
		c.JSON(failure.Status, failure.Payload)
		return
	}
	if len(request.Operations) == 0 {
		failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "operations must not be empty.", nil)
		c.JSON(failure.Status, failure.Payload)
		return
	}
	currentWorkspaceRev := request.ExpectedWorkspaceRev
	currentRouteRev := request.ExpectedRouteRev
	var latest *WorkspaceMutationResult
	for index, operationRaw := range request.Operations {
		var operationKind batchOperationKind
		if err := json.Unmarshal(operationRaw, &operationKind); err != nil {
			failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "Invalid batch operation payload.", map[string]any{"index": index})
			c.JSON(failure.Status, failure.Payload)
			return
		}
		switch strings.TrimSpace(operationKind.Op) {
		case "patchDocument":
			var operation batchPatchDocumentOperation
			if err := json.Unmarshal(operationRaw, &operation); err != nil {
				failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "Invalid patchDocument operation payload.", map[string]any{"index": index})
				c.JSON(failure.Status, failure.Payload)
				return
			}
			documentID := strings.TrimSpace(operation.DocumentID)
			if documentID == "" {
				failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "patchDocument operation requires documentId.", map[string]any{"index": index})
				c.JSON(failure.Status, failure.Payload)
				return
			}
			if operation.ExpectedContentRev <= 0 {
				failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "patchDocument operation requires expectedContentRev > 0.", map[string]any{"index": index})
				c.JSON(failure.Status, failure.Payload)
				return
			}
			result, err := handler.store.PatchDocumentContent(c.Request.Context(), PatchDocumentContentParams{WorkspaceID: workspaceID, DocumentID: documentID, ExpectedContentRev: operation.ExpectedContentRev, Command: operation.Command})
			if err != nil {
				failure := MapStoreError(err)
				LogWorkspaceConflictFailure("batch.patchDocument", c.Request.Method, c.FullPath(), workspaceID, documentID, currentWorkspaceRev, currentRouteRev, operation.ExpectedContentRev, request.ClientBatchID, failure)
				c.JSON(failure.Status, failure.Payload)
				return
			}
			latest = result
			currentWorkspaceRev = result.WorkspaceRev
			currentRouteRev = result.RouteRev
		case "intent":
			var operation batchIntentOperation
			if err := json.Unmarshal(operationRaw, &operation); err != nil {
				failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "Invalid intent operation payload.", map[string]any{"index": index})
				c.JSON(failure.Status, failure.Payload)
				return
			}
			result, failure := handler.module.ApplyIntentMutation(c.Request.Context(), workspaceID, ApplyIntentRequest{ExpectedWorkspaceRev: currentWorkspaceRev, ExpectedRouteRev: currentRouteRev, Intent: toIntent(operation.Intent)})
			if failure != nil {
				LogWorkspaceConflictFailure("batch.intent", c.Request.Method, c.FullPath(), workspaceID, "", currentWorkspaceRev, currentRouteRev, 0, request.ClientBatchID, failure)
				c.JSON(failure.Status, failure.Payload)
				return
			}
			latest = result
			currentWorkspaceRev = result.WorkspaceRev
			currentRouteRev = result.RouteRev
		default:
			failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "Unsupported batch operation.", map[string]any{"index": index, "op": strings.TrimSpace(operationKind.Op)})
			c.JSON(failure.Status, failure.Payload)
			return
		}
	}
	if latest == nil {
		failure := NewRequestFailure(http.StatusUnprocessableEntity, ErrorInvalidPayload, "Batch did not include executable operations.", nil)
		c.JSON(failure.Status, failure.Payload)
		return
	}
	handler.module.SyncProjectMirrorFromWorkspace(c.Request.Context(), user.ID, workspaceID)
	c.JSON(http.StatusOK, BuildMutationSuccessPayload(latest, strings.TrimSpace(request.ClientBatchID)))
}

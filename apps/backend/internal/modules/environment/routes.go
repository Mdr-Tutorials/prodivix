package environment

import "github.com/gin-gonic/gin"

type RouteHandlers struct {
	RequireAuth gin.HandlerFunc
	PutSnapshot gin.HandlerFunc
	GetSnapshot gin.HandlerFunc
}

func RegisterRoutes(api *gin.RouterGroup, handlers RouteHandlers) {
	api.PUT("/workspaces/:workspaceId/environments/:environmentId", handlers.RequireAuth, handlers.PutSnapshot)
	api.GET("/workspaces/:workspaceId/environments/:environmentId", handlers.RequireAuth, handlers.GetSnapshot)
}

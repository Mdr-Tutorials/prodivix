package workspace

func defaultIntentHandlers() []IntentHandler {
	return []IntentHandler{
		routeManifestUpdateHandler{},
		workspaceSettingsUpdateHandler{},
		workspaceCodeDocumentCreateHandler{},
		workspaceDirectoryCreateHandler{},
		workspaceDirectoryRenameHandler{},
		workspaceDirectoryDeleteHandler{},
		workspaceCodeDocumentRenameHandler{},
		workspaceCodeDocumentDeleteHandler{},
	}
}

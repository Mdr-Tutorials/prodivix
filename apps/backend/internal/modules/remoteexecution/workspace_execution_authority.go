package remoteexecution

const (
	workspaceOwnerPermissionID   = "workspace.owner"
	workspaceReadPermissionID    = "workspace.read"
	workspaceWritePermissionID   = "workspace.write"
	workspaceExecutionViewerRole = "viewer"
)

var workspaceOwnerExecutionPermissions = []string{
	workspaceOwnerPermissionID,
	workspaceReadPermissionID,
	workspaceWritePermissionID,
}

var workspaceViewerExecutionPermissions = []string{workspaceReadPermissionID}

func cloneExecutionPermissions(permissions []string) []string {
	return append([]string(nil), permissions...)
}

// canonicalWorkspaceExecutionPermissions accepts only the two role projections
// that the Backend can currently attest. Ordering is part of the wire and
// persistence identity, so equivalent unsorted or widened sets fail closed.
func canonicalWorkspaceExecutionPermissions(value []string) ([]string, bool) {
	if len(value) == 1 && value[0] == workspaceReadPermissionID {
		return cloneExecutionPermissions(workspaceViewerExecutionPermissions), true
	}
	if len(value) == 3 && value[0] == workspaceOwnerPermissionID && value[1] == workspaceReadPermissionID && value[2] == workspaceWritePermissionID {
		return cloneExecutionPermissions(workspaceOwnerExecutionPermissions), true
	}
	return nil, false
}

func hasWorkspaceExecutionPermission(permissions []string, permissionID string) bool {
	for _, candidate := range permissions {
		if candidate == permissionID {
			return true
		}
	}
	return false
}

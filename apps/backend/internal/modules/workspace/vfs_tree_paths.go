package workspace

import (
	"fmt"
	"path"
	"strings"
)

func (tree workspaceVFSTree) documentPathsByID() map[string]string {
	paths := make(map[string]string)
	var walk func(nodeID string, parentPath string)
	walk = func(nodeID string, parentPath string) {
		node, ok := tree.TreeByID[nodeID]
		if !ok {
			return
		}
		currentPath := parentPath
		if node.ParentID != nil {
			if currentPath == "" {
				currentPath = node.Name
			} else {
				currentPath = currentPath + "/" + node.Name
			}
		}
		if node.Kind == "doc" && strings.TrimSpace(node.DocID) != "" {
			paths[node.DocID] = path.Clean("/" + currentPath)
			return
		}
		for _, childID := range node.Children {
			walk(childID, currentPath)
		}
	}
	walk(tree.TreeRootID, "")
	return paths
}

func (tree workspaceVFSTree) nodePath(nodeID string) string {
	node, ok := tree.TreeByID[nodeID]
	if !ok || node.ParentID == nil {
		return ""
	}
	segments := []string{node.Name}
	current := node
	for current.ParentID != nil {
		parent, ok := tree.TreeByID[*current.ParentID]
		if !ok || parent.ParentID == nil {
			break
		}
		segments = append([]string{parent.Name}, segments...)
		current = parent
	}
	return strings.Join(segments, "/")
}

func (tree workspaceVFSTree) ensureDirectories(segments []string) (string, error) {
	currentID := tree.TreeRootID
	for index, segment := range segments {
		name := strings.TrimSpace(segment)
		if name == "" {
			return "", fmt.Errorf("%w: directory name is required", ErrWorkspaceVFSInvalid)
		}
		current := tree.TreeByID[currentID]
		if current.Kind != "dir" {
			return "", fmt.Errorf("%w: parent node must be a directory", ErrWorkspaceVFSInvalid)
		}
		var nextID string
		for _, childID := range current.Children {
			child := tree.TreeByID[childID]
			if child.Name != name {
				continue
			}
			if child.Kind != "dir" {
				return "", fmt.Errorf("%w: path segment already exists as a document", ErrWorkspaceVFSInvalid)
			}
			nextID = childID
			break
		}
		if nextID == "" {
			nextID = makePathNodeID("dir", segments[:index+1])
			if _, exists := tree.TreeByID[nextID]; exists {
				return "", fmt.Errorf("%w: directory node id already exists", ErrWorkspaceVFSInvalid)
			}
			tree.TreeByID[nextID] = workspaceVFSNode{
				ID:       nextID,
				Kind:     "dir",
				Name:     name,
				ParentID: makeTreeString(currentID),
				Children: []string{},
			}
			current.Children = append(current.Children, nextID)
			tree.TreeByID[currentID] = current
		}
		currentID = nextID
	}
	return currentID, nil
}

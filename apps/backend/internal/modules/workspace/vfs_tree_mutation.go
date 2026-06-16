package workspace

import (
	"fmt"
	"strings"
)

func (tree workspaceVFSTree) addDocument(mount codeDocumentMount) error {
	normalizedPath, err := normalizeWorkspacePath(mount.Path)
	if err != nil {
		return err
	}
	segments := strings.Split(strings.Trim(normalizedPath, "/"), "/")
	fileName := strings.TrimSpace(mount.Name)
	if fileName == "" {
		fileName = segments[len(segments)-1]
	}
	if fileName != segments[len(segments)-1] {
		return fmt.Errorf("%w: document name must match path base name", ErrWorkspaceVFSInvalid)
	}

	parentID := strings.TrimSpace(mount.ParentID)
	if parentID == "" {
		var err error
		parentID, err = tree.ensureDirectories(segments[:len(segments)-1])
		if err != nil {
			return err
		}
	}
	if parentID != "" {
		parentPath := tree.nodePath(parentID)
		expectedParentPath := strings.Join(segments[:len(segments)-1], "/")
		if strings.Trim(parentPath, "/") != expectedParentPath {
			return fmt.Errorf("%w: document path does not match parent directory", ErrWorkspaceVFSInvalid)
		}
	}
	parent := tree.TreeByID[parentID]
	if parent.Kind != "dir" {
		return fmt.Errorf("%w: parent node must be a directory", ErrWorkspaceVFSInvalid)
	}
	for _, childID := range parent.Children {
		child := tree.TreeByID[childID]
		if child.Name == fileName {
			return fmt.Errorf("%w: workspace path already exists", ErrWorkspaceVFSInvalid)
		}
	}
	nodeID := strings.TrimSpace(mount.NodeID)
	if nodeID == "" {
		nodeID = makePathNodeID("doc", segments)
	}
	if _, exists := tree.TreeByID[nodeID]; exists {
		return fmt.Errorf("%w: node id already exists", ErrWorkspaceVFSInvalid)
	}
	tree.TreeByID[nodeID] = workspaceVFSNode{
		ID:       nodeID,
		Kind:     "doc",
		Name:     fileName,
		ParentID: makeTreeString(parentID),
		DocID:    strings.TrimSpace(mount.DocumentID),
	}
	parent.Children = append(parent.Children, nodeID)
	tree.TreeByID[parentID] = parent
	return nil
}

func (tree workspaceVFSTree) addDirectory(mount workspaceDirectoryMount) error {
	parentID := strings.TrimSpace(mount.ParentID)
	if parentID == "" {
		parentID = tree.TreeRootID
	}
	parent, ok := tree.TreeByID[parentID]
	if !ok || parent.Kind != "dir" {
		return fmt.Errorf("%w: parent node must be a directory", ErrWorkspaceVFSInvalid)
	}
	name, err := normalizeWorkspaceDirectoryName(mount.Name)
	if err != nil {
		return err
	}
	for _, childID := range parent.Children {
		child := tree.TreeByID[childID]
		if child.Name == name {
			return fmt.Errorf("%w: workspace path already exists", ErrWorkspaceVFSInvalid)
		}
	}
	nodeID := strings.TrimSpace(mount.NodeID)
	if nodeID == "" {
		nodeID = makePathNodeID("dir", []string{parentID, name})
	}
	if _, exists := tree.TreeByID[nodeID]; exists {
		return fmt.Errorf("%w: directory node id already exists", ErrWorkspaceVFSInvalid)
	}
	tree.TreeByID[nodeID] = workspaceVFSNode{
		ID:       nodeID,
		Kind:     "dir",
		Name:     name,
		ParentID: makeTreeString(parentID),
		Children: []string{},
	}
	parent.Children = append(parent.Children, nodeID)
	tree.TreeByID[parentID] = parent
	return nil
}

func (tree workspaceVFSTree) findDocumentNode(documentID string) (workspaceVFSNode, bool) {
	for _, node := range tree.TreeByID {
		if node.Kind == "doc" && node.DocID == documentID {
			return node, true
		}
	}
	return workspaceVFSNode{}, false
}

func (tree workspaceVFSTree) removeDocument(documentID string) error {
	node, ok := tree.findDocumentNode(strings.TrimSpace(documentID))
	if !ok {
		return fmt.Errorf("%w: document node does not exist", ErrWorkspaceVFSInvalid)
	}
	if node.ParentID == nil {
		return fmt.Errorf("%w: document node parent is required", ErrWorkspaceVFSInvalid)
	}
	parent, ok := tree.TreeByID[*node.ParentID]
	if !ok || parent.Kind != "dir" {
		return fmt.Errorf("%w: document parent node does not exist", ErrWorkspaceVFSInvalid)
	}
	children := make([]string, 0, len(parent.Children))
	for _, childID := range parent.Children {
		if childID != node.ID {
			children = append(children, childID)
		}
	}
	parent.Children = children
	tree.TreeByID[parent.ID] = parent
	delete(tree.TreeByID, node.ID)
	return nil
}

func (tree workspaceVFSTree) renameDocument(documentID string, nextPath string) error {
	node, ok := tree.findDocumentNode(strings.TrimSpace(documentID))
	if !ok {
		return fmt.Errorf("%w: document node does not exist", ErrWorkspaceVFSInvalid)
	}
	if node.ParentID == nil {
		return fmt.Errorf("%w: document node parent is required", ErrWorkspaceVFSInvalid)
	}
	oldParentID := *node.ParentID
	oldParent, ok := tree.TreeByID[oldParentID]
	if !ok || oldParent.Kind != "dir" {
		return fmt.Errorf("%w: document parent node does not exist", ErrWorkspaceVFSInvalid)
	}

	normalizedPath, err := normalizeWorkspacePath(nextPath)
	if err != nil {
		return err
	}
	segments := strings.Split(strings.Trim(normalizedPath, "/"), "/")
	nextName := segments[len(segments)-1]
	nextParentID, err := tree.ensureDirectories(segments[:len(segments)-1])
	if err != nil {
		return err
	}
	nextParent := tree.TreeByID[nextParentID]
	if nextParent.Kind != "dir" {
		return fmt.Errorf("%w: parent node must be a directory", ErrWorkspaceVFSInvalid)
	}
	for _, childID := range nextParent.Children {
		child := tree.TreeByID[childID]
		if childID != node.ID && child.Name == nextName {
			return fmt.Errorf("%w: workspace path already exists", ErrWorkspaceVFSInvalid)
		}
	}

	if nextParentID != oldParentID {
		oldChildren := make([]string, 0, len(oldParent.Children))
		for _, childID := range oldParent.Children {
			if childID != node.ID {
				oldChildren = append(oldChildren, childID)
			}
		}
		oldParent.Children = oldChildren
		tree.TreeByID[oldParentID] = oldParent
		nextParent.Children = append(nextParent.Children, node.ID)
		tree.TreeByID[nextParentID] = nextParent
		node.ParentID = makeTreeString(nextParentID)
	}
	node.Name = nextName
	tree.TreeByID[node.ID] = node
	return nil
}

func (tree workspaceVFSTree) renameDirectory(nodeID string, nextName string) error {
	nodeID = strings.TrimSpace(nodeID)
	node, ok := tree.TreeByID[nodeID]
	if !ok || node.Kind != "dir" {
		return fmt.Errorf("%w: directory node does not exist", ErrWorkspaceVFSInvalid)
	}
	if node.ID == tree.TreeRootID || node.ParentID == nil {
		return fmt.Errorf("%w: workspace root directory cannot be renamed", ErrWorkspaceVFSInvalid)
	}
	name, err := normalizeWorkspaceDirectoryName(nextName)
	if err != nil {
		return err
	}
	parent, ok := tree.TreeByID[*node.ParentID]
	if !ok || parent.Kind != "dir" {
		return fmt.Errorf("%w: directory parent node does not exist", ErrWorkspaceVFSInvalid)
	}
	for _, childID := range parent.Children {
		child := tree.TreeByID[childID]
		if childID != node.ID && child.Name == name {
			return fmt.Errorf("%w: workspace path already exists", ErrWorkspaceVFSInvalid)
		}
	}
	node.Name = name
	tree.TreeByID[node.ID] = node
	return nil
}

func (tree workspaceVFSTree) removeDirectory(nodeID string) ([]string, error) {
	nodeID = strings.TrimSpace(nodeID)
	node, ok := tree.TreeByID[nodeID]
	if !ok || node.Kind != "dir" || node.ID == tree.TreeRootID || node.ParentID == nil {
		return nil, fmt.Errorf("%w: directory node does not exist", ErrWorkspaceVFSInvalid)
	}
	removedDocumentIDs := make([]string, 0)
	var removeSubtree func(id string)
	removeSubtree = func(id string) {
		current, ok := tree.TreeByID[id]
		if !ok {
			return
		}
		for _, childID := range current.Children {
			removeSubtree(childID)
		}
		if current.Kind == "doc" && strings.TrimSpace(current.DocID) != "" {
			removedDocumentIDs = append(removedDocumentIDs, current.DocID)
		}
		delete(tree.TreeByID, id)
	}

	parent := tree.TreeByID[*node.ParentID]
	children := make([]string, 0, len(parent.Children))
	for _, childID := range parent.Children {
		if childID != node.ID {
			children = append(children, childID)
		}
	}
	parent.Children = children
	tree.TreeByID[parent.ID] = parent
	removeSubtree(node.ID)
	return removedDocumentIDs, nil
}

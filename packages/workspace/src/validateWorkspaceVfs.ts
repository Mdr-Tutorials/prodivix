import type {
  WorkspaceDocument,
  WorkspaceSnapshot,
  WorkspaceVfsNode,
  WorkspaceValidationIssue,
  WorkspaceValidationResult,
} from './types';

type WorkspaceVfsValidationInput = Pick<
  WorkspaceSnapshot,
  'treeRootId' | 'treeById' | 'docsById' | 'activeDocumentId'
>;

const ROOT_PATH = '/';

const escapePointerSegment = (segment: string): string =>
  segment.replaceAll('~', '~0').replaceAll('/', '~1');

const normalizePath = (path: string): string => {
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return ROOT_PATH;
  return `/${segments.join('/')}`;
};

const joinPath = (parentPath: string, name: string): string => {
  const normalizedName = name.trim();
  if (!normalizedName || normalizedName === ROOT_PATH) return parentPath;
  if (parentPath === ROOT_PATH) return `/${normalizedName}`;
  return `${parentPath}/${normalizedName}`;
};

const addIssue = (
  issues: WorkspaceValidationIssue[],
  issue: WorkspaceValidationIssue
) => {
  issues.push(issue);
};

const getNodePath = (nodeId: string) =>
  `/treeById/${escapePointerSegment(nodeId)}`;

const validateDirectoryChildren = (
  node: WorkspaceVfsNode,
  treeById: Record<string, WorkspaceVfsNode>,
  issues: WorkspaceValidationIssue[]
) => {
  if (!Array.isArray(node.children)) {
    addIssue(issues, {
      code: 'WKS_DIR_CHILDREN_MISSING',
      path: `${getNodePath(node.id)}/children`,
      message: 'Directory nodes must declare a children array.',
      nodeId: node.id,
    });
    return;
  }

  const seenChildIds = new Set<string>();
  const seenNames = new Map<string, string>();

  node.children.forEach((childId, index) => {
    const childPath = `${getNodePath(node.id)}/children/${index}`;
    if (seenChildIds.has(childId)) {
      addIssue(issues, {
        code: 'WKS_DIR_DUPLICATE_CHILD',
        path: childPath,
        message: 'Directory children must not contain duplicate node ids.',
        nodeId: childId,
      });
      return;
    }
    seenChildIds.add(childId);

    const child = treeById[childId];
    if (!child) {
      addIssue(issues, {
        code: 'WKS_DIR_CHILD_MISSING',
        path: childPath,
        message: 'Directory child id must exist in treeById.',
        nodeId: childId,
      });
      return;
    }

    if (child.parentId !== node.id) {
      addIssue(issues, {
        code: 'WKS_DIR_CHILD_PARENT_MISMATCH',
        path: `${getNodePath(child.id)}/parentId`,
        message: 'Child parentId must point back to the owning directory.',
        nodeId: child.id,
      });
    }

    const duplicateNameNodeId = seenNames.get(child.name);
    if (duplicateNameNodeId) {
      addIssue(issues, {
        code: 'WKS_DIR_DUPLICATE_NAME',
        path: `${getNodePath(child.id)}/name`,
        message: 'Sibling nodes must not use the same name.',
        nodeId: child.id,
      });
      return;
    }
    seenNames.set(child.name, child.id);
  });
};

const validateDocumentNode = (
  node: WorkspaceVfsNode,
  docsById: Record<string, WorkspaceDocument>,
  referencedDocumentIds: Map<string, string>,
  issues: WorkspaceValidationIssue[]
) => {
  if (node.children !== undefined) {
    addIssue(issues, {
      code: 'WKS_DOC_NODE_CHILDREN_INVALID',
      path: `${getNodePath(node.id)}/children`,
      message: 'Document nodes must not declare children.',
      nodeId: node.id,
    });
  }

  if (!node.docId || !docsById[node.docId]) {
    addIssue(issues, {
      code: 'WKS_DOC_REF_MISSING',
      path: `${getNodePath(node.id)}/docId`,
      message: 'Document nodes must reference an existing document.',
      nodeId: node.id,
      documentId: node.docId,
    });
    return;
  }

  const previousNodeId = referencedDocumentIds.get(node.docId);
  if (previousNodeId) {
    addIssue(issues, {
      code: 'WKS_DOC_REF_DUPLICATE',
      path: `${getNodePath(node.id)}/docId`,
      message: 'A document can only be mounted once in the workspace tree.',
      nodeId: node.id,
      documentId: node.docId,
    });
    return;
  }
  referencedDocumentIds.set(node.docId, node.id);
};

const visitReachableTree = (
  nodeId: string,
  treeById: Record<string, WorkspaceVfsNode>,
  issues: WorkspaceValidationIssue[],
  reachableNodeIds: Set<string>,
  visitingNodeIds: Set<string>
) => {
  if (visitingNodeIds.has(nodeId)) {
    addIssue(issues, {
      code: 'WKS_TREE_CYCLE',
      path: getNodePath(nodeId),
      message: 'Workspace tree must not contain cycles.',
      nodeId,
    });
    return;
  }

  const node = treeById[nodeId];
  if (!node || reachableNodeIds.has(nodeId)) return;

  visitingNodeIds.add(nodeId);
  reachableNodeIds.add(nodeId);
  if (node.kind === 'dir') {
    (node.children ?? []).forEach((childId) =>
      visitReachableTree(
        childId,
        treeById,
        issues,
        reachableNodeIds,
        visitingNodeIds
      )
    );
  }
  visitingNodeIds.delete(nodeId);
};

const collectTreePaths = (
  nodeId: string,
  treeById: Record<string, WorkspaceVfsNode>,
  currentPath: string,
  pathsByNodeId: Map<string, string>
) => {
  const node = treeById[nodeId];
  if (!node || pathsByNodeId.has(nodeId)) return;

  const nextPath =
    node.parentId === null ? ROOT_PATH : joinPath(currentPath, node.name);
  pathsByNodeId.set(nodeId, nextPath);

  if (node.kind === 'dir') {
    (node.children ?? []).forEach((childId) =>
      collectTreePaths(childId, treeById, nextPath, pathsByNodeId)
    );
  }
};

export const validateWorkspaceVfs = ({
  treeRootId,
  treeById,
  docsById,
  activeDocumentId,
}: WorkspaceVfsValidationInput): WorkspaceValidationResult => {
  const issues: WorkspaceValidationIssue[] = [];
  const root = treeById[treeRootId];

  if (!root) {
    addIssue(issues, {
      code: 'WKS_ROOT_MISSING',
      path: '/treeRootId',
      message: 'treeRootId must reference an existing node.',
      nodeId: treeRootId,
    });
    return { valid: false, issues };
  }

  if (root.parentId !== null) {
    addIssue(issues, {
      code: 'WKS_ROOT_PARENT_INVALID',
      path: `${getNodePath(root.id)}/parentId`,
      message: 'Root node parentId must be null.',
      nodeId: root.id,
    });
  }

  const referencedDocumentIds = new Map<string, string>();

  Object.entries(treeById).forEach(([nodeId, node]) => {
    if (node.id !== nodeId) {
      addIssue(issues, {
        code: 'WKS_NODE_ID_MISMATCH',
        path: `${getNodePath(nodeId)}/id`,
        message: 'treeById key must match node.id.',
        nodeId,
      });
    }

    if (node.parentId && !treeById[node.parentId]) {
      addIssue(issues, {
        code: 'WKS_NODE_PARENT_MISSING',
        path: `${getNodePath(node.id)}/parentId`,
        message: 'Node parentId must reference an existing directory.',
        nodeId: node.id,
      });
    }

    if (node.parentId) {
      const parent = treeById[node.parentId];
      if (
        parent?.kind === 'dir' &&
        !(parent.children ?? []).includes(node.id)
      ) {
        addIssue(issues, {
          code: 'WKS_NODE_PARENT_LINK_MISSING',
          path: `${getNodePath(parent.id)}/children`,
          message: 'Parent directory children must include the child node id.',
          nodeId: node.id,
        });
      }
    }

    if (node.kind === 'dir') {
      validateDirectoryChildren(node, treeById, issues);
      return;
    }

    validateDocumentNode(node, docsById, referencedDocumentIds, issues);
  });

  const reachableNodeIds = new Set<string>();
  visitReachableTree(treeRootId, treeById, issues, reachableNodeIds, new Set());

  Object.keys(treeById).forEach((nodeId) => {
    if (reachableNodeIds.has(nodeId)) return;
    addIssue(issues, {
      code: 'WKS_TREE_ORPHANED_NODE',
      path: getNodePath(nodeId),
      message: 'Every workspace tree node must be reachable from treeRootId.',
      nodeId,
    });
  });

  const pathsByNodeId = new Map<string, string>();
  collectTreePaths(treeRootId, treeById, ROOT_PATH, pathsByNodeId);

  Object.entries(docsById).forEach(([documentId, document]) => {
    const nodeId = referencedDocumentIds.get(documentId);
    if (!nodeId) {
      addIssue(issues, {
        code: 'WKS_DOCUMENT_ORPHANED',
        path: `/docsById/${escapePointerSegment(documentId)}`,
        message: 'Every document must be mounted by exactly one VFS doc node.',
        documentId,
      });
      return;
    }

    const expectedPath = pathsByNodeId.get(nodeId);
    if (expectedPath && normalizePath(document.path) !== expectedPath) {
      addIssue(issues, {
        code: 'WKS_DOCUMENT_PATH_MISMATCH',
        path: `/docsById/${escapePointerSegment(documentId)}/path`,
        message: 'WorkspaceDocument.path must match the path derived from VFS.',
        nodeId,
        documentId,
      });
    }
  });

  if (activeDocumentId && !docsById[activeDocumentId]) {
    addIssue(issues, {
      code: 'WKS_ACTIVE_DOCUMENT_MISSING',
      path: '/activeDocumentId',
      message: 'activeDocumentId must reference an existing document.',
      documentId: activeDocumentId,
    });
  }

  return { valid: issues.length === 0, issues };
};

export const validateWorkspaceSnapshot = (
  snapshot: WorkspaceSnapshot
): WorkspaceValidationResult =>
  validateWorkspaceVfs({
    treeRootId: snapshot.treeRootId,
    treeById: snapshot.treeById,
    docsById: snapshot.docsById,
    activeDocumentId: snapshot.activeDocumentId,
  });

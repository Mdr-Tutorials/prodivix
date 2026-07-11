import {
  composeRouteManifestWithModules,
  validateRouteManifest,
  type RouteModule,
  type RouteModuleMount,
  type WorkspaceRouteCodeReference,
  type WorkspaceRouteManifest,
  type WorkspaceRouteNode,
  type WorkspaceRouteOutletBinding,
  type WorkspaceRouteRuntime,
} from '@prodivix/shared/router';
import type { PIRDocument } from '@prodivix/shared/types/pir';
import { validatePirDocument } from '@prodivix/pir';
import { resolveCanonicalWorkspaceDocumentId } from './resolveCanonicalWorkspaceDocumentId';
import type {
  WorkspaceDocument,
  WorkspaceDocumentType,
  WorkspaceSnapshot,
  WorkspaceVfsNode,
} from './types';
import { validateWorkspaceSnapshot } from './validateWorkspaceVfs';
import { isWorkspaceCodeDocumentContent } from './workspaceCodeDocument';

const WORKSPACE_DOCUMENT_TYPES = new Set<WorkspaceDocumentType>([
  'pir-page',
  'pir-layout',
  'pir-component',
  'pir-graph',
  'pir-animation',
  'code',
  'asset',
  'project-config',
]);

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const requireRecord = (
  value: unknown,
  path: string
): Record<string, unknown> => {
  if (!isPlainRecord(value)) {
    throw new WorkspaceCodecError(path, 'Expected an object.');
  }
  return value;
};

const requireString = (value: unknown, path: string): string => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new WorkspaceCodecError(path, 'Expected a non-empty string.');
  }
  return value;
};

const optionalString = (value: unknown, path: string): string | undefined => {
  if (value === undefined) return undefined;
  return requireString(value, path);
};

const requirePositiveInteger = (value: unknown, path: string): number => {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new WorkspaceCodecError(path, 'Expected a positive integer.');
  }
  return value as number;
};

const parseStringArray = (value: unknown, path: string): string[] => {
  if (!Array.isArray(value)) {
    throw new WorkspaceCodecError(path, 'Expected an array.');
  }
  return value.map((item, index) => requireString(item, `${path}/${index}`));
};

const parseRouteCodeReference = (
  value: unknown,
  path: string
): WorkspaceRouteCodeReference => {
  const source = requireRecord(value, path);
  return {
    artifactId: requireString(source.artifactId, `${path}/artifactId`),
    ...(optionalString(source.exportName, `${path}/exportName`)
      ? { exportName: source.exportName as string }
      : {}),
    ...(optionalString(source.symbolId, `${path}/symbolId`)
      ? { symbolId: source.symbolId as string }
      : {}),
  };
};

const parseRouteRuntime = (
  value: unknown,
  path: string
): WorkspaceRouteRuntime => {
  const source = requireRecord(value, path);
  return {
    ...(source.loaderRef !== undefined
      ? {
          loaderRef: parseRouteCodeReference(
            source.loaderRef,
            `${path}/loaderRef`
          ),
        }
      : {}),
    ...(source.actionRef !== undefined
      ? {
          actionRef: parseRouteCodeReference(
            source.actionRef,
            `${path}/actionRef`
          ),
        }
      : {}),
    ...(source.guardRef !== undefined
      ? {
          guardRef: parseRouteCodeReference(
            source.guardRef,
            `${path}/guardRef`
          ),
        }
      : {}),
  };
};

const parseRouteOutletBindings = (
  value: unknown,
  path: string
): Record<string, WorkspaceRouteOutletBinding> => {
  const source = requireRecord(value, path);
  return Object.fromEntries(
    Object.entries(source).map(([name, rawBinding]) => {
      const binding = requireRecord(rawBinding, `${path}/${name}`);
      return [
        name,
        {
          outletNodeId: requireString(
            binding.outletNodeId,
            `${path}/${name}/outletNodeId`
          ),
          ...(optionalString(binding.pageDocId, `${path}/${name}/pageDocId`)
            ? { pageDocId: binding.pageDocId as string }
            : {}),
        },
      ];
    })
  );
};

const parseRouteNode = (value: unknown, path: string): WorkspaceRouteNode => {
  const source = requireRecord(value, path);
  if (source.index !== undefined && typeof source.index !== 'boolean') {
    throw new WorkspaceCodecError(`${path}/index`, 'Expected a boolean.');
  }
  if (source.children !== undefined && !Array.isArray(source.children)) {
    throw new WorkspaceCodecError(`${path}/children`, 'Expected an array.');
  }
  return {
    id: requireString(source.id, `${path}/id`),
    ...(source.segment !== undefined
      ? { segment: requireString(source.segment, `${path}/segment`) }
      : {}),
    ...(source.index !== undefined ? { index: source.index as boolean } : {}),
    ...(optionalString(source.layoutDocId, `${path}/layoutDocId`)
      ? { layoutDocId: source.layoutDocId as string }
      : {}),
    ...(optionalString(source.pageDocId, `${path}/pageDocId`)
      ? { pageDocId: source.pageDocId as string }
      : {}),
    ...(optionalString(source.outletNodeId, `${path}/outletNodeId`)
      ? { outletNodeId: source.outletNodeId as string }
      : {}),
    ...(source.outletBindings !== undefined
      ? {
          outletBindings: parseRouteOutletBindings(
            source.outletBindings,
            `${path}/outletBindings`
          ),
        }
      : {}),
    ...(source.runtime !== undefined
      ? { runtime: parseRouteRuntime(source.runtime, `${path}/runtime`) }
      : {}),
    ...(source.children !== undefined
      ? {
          children: (source.children as unknown[]).map((child, index) =>
            parseRouteNode(child, `${path}/children/${index}`)
          ),
        }
      : {}),
  };
};

const parseRouteModules = (
  value: unknown,
  path: string
): Record<string, RouteModule> => {
  const source = requireRecord(value, path);
  return Object.fromEntries(
    Object.entries(source).map(([key, rawModule]) => {
      const module = requireRecord(rawModule, `${path}/${key}`);
      const moduleId = requireString(
        module.moduleId,
        `${path}/${key}/moduleId`
      );
      if (moduleId !== key) {
        throw new WorkspaceCodecError(
          `${path}/${key}/moduleId`,
          'Route module key must match moduleId.'
        );
      }
      return [
        key,
        {
          moduleId,
          version: requireString(module.version, `${path}/${key}/version`),
          root: parseRouteNode(module.root, `${path}/${key}/root`),
        },
      ];
    })
  );
};

const parseRouteMounts = (value: unknown, path: string): RouteModuleMount[] => {
  if (!Array.isArray(value)) {
    throw new WorkspaceCodecError(path, 'Expected an array.');
  }
  return value.map((rawMount, index) => {
    const mountPath = `${path}/${index}`;
    const mount = requireRecord(rawMount, mountPath);
    return {
      mountId: requireString(mount.mountId, `${mountPath}/mountId`),
      moduleRef: requireString(mount.moduleRef, `${mountPath}/moduleRef`),
      ...(optionalString(mount.mountPath, `${mountPath}/mountPath`)
        ? { mountPath: mount.mountPath as string }
        : {}),
      ...(optionalString(
        mount.parentRouteNodeId,
        `${mountPath}/parentRouteNodeId`
      )
        ? { parentRouteNodeId: mount.parentRouteNodeId as string }
        : {}),
    };
  });
};

export const decodeWorkspaceRouteManifest = (
  value: unknown,
  documentExists?: (documentId: string) => boolean
): WorkspaceRouteManifest => {
  const source = requireRecord(value, '/routeManifest');
  const manifest: WorkspaceRouteManifest = {
    version: requireString(source.version, '/routeManifest/version'),
    root: parseRouteNode(source.root, '/routeManifest/root'),
    ...(source.modules !== undefined
      ? { modules: parseRouteModules(source.modules, '/routeManifest/modules') }
      : {}),
    ...(source.mounts !== undefined
      ? { mounts: parseRouteMounts(source.mounts, '/routeManifest/mounts') }
      : {}),
  };
  const issues = validateRouteManifest({ manifest, documentExists });
  if (issues.length) {
    throw new WorkspaceCodecError(
      '/routeManifest',
      issues.map((issue) => `${issue.code}: ${issue.message}`).join('; ')
    );
  }
  return manifest;
};

export const normalizeRouteManifest = decodeWorkspaceRouteManifest;

export const hasRouteNodeId = (
  node: WorkspaceRouteNode,
  nodeId: string
): boolean =>
  node.id === nodeId ||
  (node.children ?? []).some((child) => hasRouteNodeId(child, nodeId));

export const resolveDefaultActiveRouteNodeId = (
  manifest: WorkspaceRouteManifest
): string => manifest.root.children?.[0]?.id ?? manifest.root.id;

export const resolveActiveRouteNodeId = (
  manifest: WorkspaceRouteManifest,
  candidateIds: Array<string | undefined>
): string => {
  const composedManifest = composeRouteManifestWithModules(manifest).manifest;
  const candidate = candidateIds.find(
    (value) =>
      value?.trim() && hasRouteNodeId(composedManifest.root, value.trim())
  );
  return candidate?.trim() ?? resolveDefaultActiveRouteNodeId(composedManifest);
};

export const isPirWorkspaceDocumentType = (
  type: WorkspaceDocumentType
): boolean =>
  type === 'pir-page' || type === 'pir-layout' || type === 'pir-component';

export const isWorkspacePirDocument = (
  document: WorkspaceDocument | undefined
): document is WorkspaceDocument & { content: PIRDocument } =>
  Boolean(document && isPirWorkspaceDocumentType(document.type));

const parseWorkspaceDocument = (
  value: unknown,
  path: string
): WorkspaceDocument => {
  const source = requireRecord(value, path);
  const type = requireString(source.type, `${path}/type`);
  if (!WORKSPACE_DOCUMENT_TYPES.has(type as WorkspaceDocumentType)) {
    throw new WorkspaceCodecError(
      `${path}/type`,
      `Unsupported workspace document type: ${type}.`
    );
  }
  const id = requireString(source.id, `${path}/id`);
  let content = source.content;
  if (isPirWorkspaceDocumentType(type as WorkspaceDocumentType)) {
    const validation = validatePirDocument(content);
    if (validation.hasError) {
      throw new WorkspaceCodecError(
        `${path}/content`,
        validation.issues.map((issue) => issue.message).join('; ')
      );
    }
    content = validation.document;
  } else if (type === 'code' && !isWorkspaceCodeDocumentContent(content)) {
    throw new WorkspaceCodecError(
      `${path}/content`,
      `Workspace code document ${id} must use the code content wrapper.`
    );
  }
  const capabilities =
    source.capabilities === undefined
      ? undefined
      : parseStringArray(source.capabilities, `${path}/capabilities`);
  return {
    id,
    type: type as WorkspaceDocumentType,
    path: requireString(source.path, `${path}/path`),
    contentRev: requirePositiveInteger(source.contentRev, `${path}/contentRev`),
    metaRev: requirePositiveInteger(source.metaRev, `${path}/metaRev`),
    content,
    ...(optionalString(source.name, `${path}/name`)
      ? { name: source.name as string }
      : {}),
    ...(optionalString(source.updatedAt, `${path}/updatedAt`)
      ? { updatedAt: source.updatedAt as string }
      : {}),
    ...(capabilities ? { capabilities } : {}),
  };
};

export const normalizeWorkspaceDocument = (
  document: WorkspaceDocument
): WorkspaceDocument =>
  parseWorkspaceDocument(document, `/documents/${document.id}`);

const parseWorkspaceTree = (
  value: unknown
): Pick<WorkspaceSnapshot, 'treeRootId' | 'treeById'> => {
  const source = requireRecord(value, '/tree');
  const treeRootId = requireString(source.treeRootId, '/tree/treeRootId');
  const rawTreeById = requireRecord(source.treeById, '/tree/treeById');
  const treeById: Record<string, WorkspaceVfsNode> = {};
  Object.entries(rawTreeById).forEach(([nodeKey, rawNode]) => {
    const path = `/tree/treeById/${nodeKey}`;
    const node = requireRecord(rawNode, path);
    const id = requireString(node.id, `${path}/id`);
    if (id !== nodeKey) {
      throw new WorkspaceCodecError(
        `${path}/id`,
        'Tree node key must match node id.'
      );
    }
    if (node.kind !== 'dir' && node.kind !== 'doc') {
      throw new WorkspaceCodecError(`${path}/kind`, 'Expected dir or doc.');
    }
    if (node.parentId !== null && typeof node.parentId !== 'string') {
      throw new WorkspaceCodecError(
        `${path}/parentId`,
        'Expected a string or null.'
      );
    }
    if (node.kind === 'dir') {
      treeById[id] = {
        id,
        kind: 'dir',
        name: requireString(node.name, `${path}/name`),
        parentId: node.parentId,
        children: parseStringArray(node.children, `${path}/children`),
      };
      return;
    }
    treeById[id] = {
      id,
      kind: 'doc',
      name: requireString(node.name, `${path}/name`),
      parentId: node.parentId,
      docId: requireString(node.docId, `${path}/docId`),
    };
  });
  return { treeRootId, treeById };
};

export const normalizeWorkspaceTree = (
  tree: unknown,
  _documentsById?: Record<string, WorkspaceDocument>
): Pick<WorkspaceSnapshot, 'treeRootId' | 'treeById'> =>
  parseWorkspaceTree(tree);

const parseSettings = (value: unknown): Record<string, unknown> =>
  requireRecord(value, '/settings');

export class WorkspaceCodecError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'WorkspaceCodecError';
    this.path = path;
  }
}

export type WorkspaceDocumentWireDto = {
  id: string;
  type: WorkspaceDocumentType;
  name?: string;
  path: string;
  contentRev: number;
  metaRev: number;
  content: unknown;
  updatedAt?: string;
  capabilities?: string[];
};

export type WorkspaceTreeWireDto = {
  treeRootId: string;
  treeById: Record<string, WorkspaceVfsNode>;
};

export type WorkspaceSnapshotWireDto = {
  id: string;
  name?: string;
  workspaceRev: number;
  routeRev: number;
  opSeq: number;
  tree: WorkspaceTreeWireDto;
  documents: WorkspaceDocumentWireDto[];
  routeManifest: unknown;
  settings: Record<string, unknown>;
  activeDocumentId?: string;
  activeRouteNodeId?: string;
};

export type DecodedWorkspaceSnapshot = {
  workspace: WorkspaceSnapshot;
  settings: Record<string, unknown>;
};

export type WorkspaceMutationWireDto = {
  workspaceId: string;
  workspaceRev: number;
  routeRev: number;
  opSeq: number;
  tree?: WorkspaceTreeWireDto;
  updatedDocuments?: WorkspaceDocumentWireDto[];
  removedDocumentIds?: string[];
  routeManifest?: unknown;
  settings?: Record<string, unknown>;
  activeDocumentId?: string;
  activeRouteNodeId?: string;
  acceptedMutationId?: string;
};

export type DecodedWorkspaceMutation = {
  workspaceId: string;
  workspaceRev: number;
  routeRev: number;
  opSeq: number;
  tree?: Pick<WorkspaceSnapshot, 'treeRootId' | 'treeById'>;
  updatedDocuments: WorkspaceDocument[];
  removedDocumentIds: string[];
  routeManifest?: WorkspaceRouteManifest;
  settings?: Record<string, unknown>;
  activeDocumentId?: string;
  activeRouteNodeId?: string;
  acceptedMutationId?: string;
};

/** Decodes the backend wire contract into the only canonical Workspace model. */
export const decodeWorkspaceSnapshot = (
  value: unknown
): DecodedWorkspaceSnapshot => {
  const source = requireRecord(value, '/workspace');
  if (!Array.isArray(source.documents) || !source.documents.length) {
    throw new WorkspaceCodecError(
      '/workspace/documents',
      'Expected at least one workspace document.'
    );
  }
  const documents = source.documents.map((document, index) =>
    parseWorkspaceDocument(document, `/workspace/documents/${index}`)
  );
  const docsById: Record<string, WorkspaceDocument> = {};
  documents.forEach((document, index) => {
    if (docsById[document.id]) {
      throw new WorkspaceCodecError(
        `/workspace/documents/${index}/id`,
        `Duplicate workspace document id: ${document.id}.`
      );
    }
    docsById[document.id] = document;
  });
  const tree = parseWorkspaceTree(source.tree);
  const routeManifest = decodeWorkspaceRouteManifest(
    source.routeManifest,
    (documentId) => Boolean(docsById[documentId])
  );
  const activeDocumentCandidate = optionalString(
    source.activeDocumentId,
    '/workspace/activeDocumentId'
  );
  const activeDocumentId =
    activeDocumentCandidate ?? resolveCanonicalWorkspaceDocumentId(documents);
  const activeRouteNodeId = resolveActiveRouteNodeId(routeManifest, [
    optionalString(source.activeRouteNodeId, '/workspace/activeRouteNodeId'),
  ]);
  const workspace: WorkspaceSnapshot = {
    id: requireString(source.id, '/workspace/id'),
    workspaceRev: requirePositiveInteger(
      source.workspaceRev,
      '/workspace/workspaceRev'
    ),
    routeRev: requirePositiveInteger(source.routeRev, '/workspace/routeRev'),
    opSeq: requirePositiveInteger(source.opSeq, '/workspace/opSeq'),
    ...tree,
    docsById,
    routeManifest,
    ...(optionalString(source.name, '/workspace/name')
      ? { name: source.name as string }
      : {}),
    ...(activeDocumentId ? { activeDocumentId } : {}),
    ...(activeRouteNodeId ? { activeRouteNodeId } : {}),
  };
  const validation = validateWorkspaceSnapshot(workspace);
  if (!validation.valid) {
    throw new WorkspaceCodecError(
      '/workspace',
      validation.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('; ')
    );
  }
  return { workspace, settings: parseSettings(source.settings) };
};

export const encodeWorkspaceSnapshot = (
  workspace: WorkspaceSnapshot,
  settings: Record<string, unknown>
): WorkspaceSnapshotWireDto => {
  const validation = validateWorkspaceSnapshot(workspace);
  if (!validation.valid) {
    throw new WorkspaceCodecError(
      '/workspace',
      validation.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('; ')
    );
  }
  return {
    id: workspace.id,
    ...(workspace.name ? { name: workspace.name } : {}),
    workspaceRev: workspace.workspaceRev,
    routeRev: workspace.routeRev,
    opSeq: workspace.opSeq,
    tree: {
      treeRootId: workspace.treeRootId,
      treeById: workspace.treeById,
    },
    documents: Object.values(workspace.docsById).sort(
      (left, right) =>
        left.path.localeCompare(right.path) || left.id.localeCompare(right.id)
    ),
    routeManifest: workspace.routeManifest,
    settings: parseSettings(settings),
    ...(workspace.activeDocumentId
      ? { activeDocumentId: workspace.activeDocumentId }
      : {}),
    ...(workspace.activeRouteNodeId
      ? { activeRouteNodeId: workspace.activeRouteNodeId }
      : {}),
  };
};

export const decodeWorkspaceMutation = (
  value: unknown,
  workspace: WorkspaceSnapshot
): DecodedWorkspaceMutation => {
  const source = requireRecord(value, '/mutation');
  const workspaceId = requireString(
    source.workspaceId,
    '/mutation/workspaceId'
  );
  if (workspaceId !== workspace.id) {
    throw new WorkspaceCodecError(
      '/mutation/workspaceId',
      'Mutation workspaceId does not match the current workspace.'
    );
  }
  const updatedDocuments =
    source.updatedDocuments === undefined
      ? []
      : Array.isArray(source.updatedDocuments)
        ? source.updatedDocuments.map((document, index) =>
            parseWorkspaceDocument(
              document,
              `/mutation/updatedDocuments/${index}`
            )
          )
        : (() => {
            throw new WorkspaceCodecError(
              '/mutation/updatedDocuments',
              'Expected an array.'
            );
          })();
  const seenIds = new Set<string>();
  updatedDocuments.forEach((document, index) => {
    if (seenIds.has(document.id)) {
      throw new WorkspaceCodecError(
        `/mutation/updatedDocuments/${index}/id`,
        `Duplicate workspace document id: ${document.id}.`
      );
    }
    seenIds.add(document.id);
  });
  const removedDocumentIds =
    source.removedDocumentIds === undefined
      ? []
      : parseStringArray(
          source.removedDocumentIds,
          '/mutation/removedDocumentIds'
        );
  const docsAfterMutation = { ...workspace.docsById };
  removedDocumentIds.forEach(
    (documentId) => delete docsAfterMutation[documentId]
  );
  updatedDocuments.forEach((document) => {
    docsAfterMutation[document.id] = document;
  });
  return {
    workspaceId,
    workspaceRev: requirePositiveInteger(
      source.workspaceRev,
      '/mutation/workspaceRev'
    ),
    routeRev: requirePositiveInteger(source.routeRev, '/mutation/routeRev'),
    opSeq: requirePositiveInteger(source.opSeq, '/mutation/opSeq'),
    ...(source.tree !== undefined
      ? { tree: parseWorkspaceTree(source.tree) }
      : {}),
    updatedDocuments,
    removedDocumentIds,
    ...(source.routeManifest !== undefined
      ? {
          routeManifest: decodeWorkspaceRouteManifest(
            source.routeManifest,
            (documentId) => Boolean(docsAfterMutation[documentId])
          ),
        }
      : {}),
    ...(source.settings !== undefined
      ? { settings: parseSettings(source.settings) }
      : {}),
    ...(optionalString(source.activeDocumentId, '/mutation/activeDocumentId')
      ? { activeDocumentId: source.activeDocumentId as string }
      : {}),
    ...(optionalString(source.activeRouteNodeId, '/mutation/activeRouteNodeId')
      ? { activeRouteNodeId: source.activeRouteNodeId as string }
      : {}),
    ...(optionalString(
      source.acceptedMutationId,
      '/mutation/acceptedMutationId'
    )
      ? { acceptedMutationId: source.acceptedMutationId as string }
      : {}),
  };
};

export const applyWorkspaceMutation = (
  workspace: WorkspaceSnapshot,
  mutation: DecodedWorkspaceMutation
): WorkspaceSnapshot => {
  if (workspace.id !== mutation.workspaceId) {
    throw new WorkspaceCodecError(
      '/mutation/workspaceId',
      'Mutation workspaceId does not match the current workspace.'
    );
  }
  const docsById = { ...workspace.docsById };
  mutation.removedDocumentIds.forEach(
    (documentId) => delete docsById[documentId]
  );
  mutation.updatedDocuments.forEach((document) => {
    docsById[document.id] = document;
  });
  const routeManifest = mutation.routeManifest ?? workspace.routeManifest;
  const requestedActiveDocumentId =
    mutation.activeDocumentId ?? workspace.activeDocumentId;
  const activeDocumentId =
    requestedActiveDocumentId && docsById[requestedActiveDocumentId]
      ? requestedActiveDocumentId
      : resolveCanonicalWorkspaceDocumentId(Object.values(docsById));
  const nextWorkspace: WorkspaceSnapshot = {
    ...workspace,
    workspaceRev: mutation.workspaceRev,
    routeRev: mutation.routeRev,
    opSeq: mutation.opSeq,
    ...(mutation.tree ?? {}),
    docsById,
    routeManifest,
    ...(activeDocumentId ? { activeDocumentId } : {}),
    activeRouteNodeId: resolveActiveRouteNodeId(routeManifest, [
      mutation.activeRouteNodeId,
      workspace.activeRouteNodeId,
    ]),
  };
  const validation = validateWorkspaceSnapshot(nextWorkspace);
  if (!validation.valid) {
    throw new WorkspaceCodecError(
      '/mutation',
      validation.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join('; ')
    );
  }
  return nextWorkspace;
};

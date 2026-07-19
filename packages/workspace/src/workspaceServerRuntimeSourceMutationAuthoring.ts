import { findRouteNodeById } from '@prodivix/router';
import {
  writeServerRuntimeProfile,
  type ServerFunctionReference,
  type ServerRuntimeProfile,
} from '@prodivix/server-runtime';
import {
  applyWorkspaceCommand,
  type WorkspaceTransactionEnvelope,
} from './workspaceCommand';
import { createWorkspaceDocumentAtPathCommand } from './workspaceDocumentFactory';
import { createWorkspaceServerRuntimeBindingPlan } from './workspaceServerRuntimeAuthoring';
import type { WorkspaceDocument, WorkspaceSnapshot } from './types';

export type WorkspaceSourceMutationTransactionPlanResult =
  | Readonly<{
      status: 'ready';
      plan: Readonly<{
        transaction: WorkspaceTransactionEnvelope;
        functionRef: ServerFunctionReference;
        actionDocumentId: string;
        targetDocumentId: string;
      }>;
    }>
  | Readonly<{
      status: 'rejected';
      code:
        | 'WKS_SERVER_RUNTIME_ROUTE_MISSING'
        | 'WKS_SERVER_RUNTIME_PRESET_INVALID'
        | 'WKS_SERVER_RUNTIME_ARTIFACT_UNSUPPORTED'
        | 'WKS_SERVER_RUNTIME_BINDING_INVALID';
      message: string;
    }>;

export type CreateWorkspaceSourceMutationTransactionPlanInput = Readonly<{
  workspace: WorkspaceSnapshot;
  routeNodeId: string;
  actionDocumentId: string;
  actionPath: string;
  targetDocumentId: string;
  targetPath: string;
  transactionId: string;
  issuedAt: string;
  exportName?: string;
}>;

const SOURCE_MUTATION_EXPORT_NAME = 'replaceProjectSource';

const sourceMutationProfile = (exportName: string): ServerRuntimeProfile =>
  Object.freeze({
    schemaVersion: '1.0',
    functionsByExport: Object.freeze({
      [exportName]: Object.freeze({
        kind: 'route-action' as const,
        runtimeZone: 'server' as const,
        adapterId: 'prodivix.code-export',
        effect: 'mutation' as const,
        auth: Object.freeze({
          kind: 'permission' as const,
          permissionId: 'workspace.write',
        }),
        inputSchema: Object.freeze({
          type: 'object',
          additionalProperties: false,
          required: Object.freeze(['format', 'route', 'submission']),
          properties: Object.freeze({
            format: Object.freeze({ const: 'prodivix.route-action-input.v1' }),
            route: Object.freeze({ type: 'object' }),
            submission: Object.freeze({
              type: 'object',
              additionalProperties: false,
              required: Object.freeze(['method', 'encType', 'value']),
              properties: Object.freeze({
                method: Object.freeze({
                  enum: Object.freeze(['POST', 'PUT', 'PATCH', 'DELETE']),
                }),
                encType: Object.freeze({
                  enum: Object.freeze([
                    'application/json',
                    'application/x-www-form-urlencoded',
                  ]),
                }),
                value: Object.freeze({
                  type: 'object',
                  additionalProperties: false,
                  required: Object.freeze(['source']),
                  properties: Object.freeze({
                    source: Object.freeze({ type: 'string' }),
                  }),
                }),
              }),
            }),
          }),
        }),
        outputSchema: Object.freeze({
          type: 'object',
          additionalProperties: false,
          required: Object.freeze(['updated']),
          properties: Object.freeze({
            updated: Object.freeze({ const: true }),
          }),
        }),
        idempotency: Object.freeze({ kind: 'invocation-key' as const }),
      }),
    }),
  });

const relativeWorkspaceImport = (
  importerPath: string,
  targetPath: string
): string | undefined => {
  if (
    !importerPath.startsWith('/') ||
    !targetPath.startsWith('/') ||
    importerPath === targetPath
  )
    return undefined;
  const importer = importerPath.slice(1).split('/');
  const target = targetPath.slice(1).split('/');
  if (
    importer.some(
      (segment) => !segment || segment === '.' || segment === '..'
    ) ||
    target.some((segment) => !segment || segment === '.' || segment === '..')
  )
    return undefined;
  importer.pop();
  let common = 0;
  while (common < importer.length && importer[common] === target[common])
    common += 1;
  const relative = `${'../'.repeat(importer.length - common)}${target
    .slice(common)
    .join('/')}`;
  return relative.startsWith('../') ? relative : `./${relative}`;
};

const sourceMutationActionSource = (
  exportName: string,
  targetDocumentId: string,
  importSpecifier: string
): string => `import ${JSON.stringify(importSpecifier)};

type ProjectSourceMutationInput = Readonly<{
  submission: Readonly<{ value: Readonly<{ source: string }> }>;
}>;

type ProjectSourceMutationContext = Readonly<{
  replaceProjectSource?: (mutation: Readonly<{
    artifactId: string;
    source: string;
  }>) => Promise<void>;
}>;

export const ${exportName} = async (
  input: ProjectSourceMutationInput,
  context: ProjectSourceMutationContext,
) => {
  if (!context.replaceProjectSource) {
    throw new Error('SVR_SOURCE_MUTATION_UNAVAILABLE');
  }
  await context.replaceProjectSource({
    artifactId: ${JSON.stringify(targetDocumentId)},
    source: input.submission.value.source,
  });
  return { kind: 'value' as const, value: { updated: true } };
};
`;

const sourceMutationTargetSource = `/**
 * This whole file can be replaced only through an isolated workspace.write
 * execution and the explicit revision-fenced Runtime Files adoption flow.
 */
export const projectSourceValue = 'Edit this source through the route action.';
`;

/** Creates one bounded source target, isolated action, and Route binding atomically. */
export const createWorkspaceSourceMutationTransactionPlan = (
  input: CreateWorkspaceSourceMutationTransactionPlanInput
): WorkspaceSourceMutationTransactionPlanResult => {
  const routeNodeId = input.routeNodeId.trim();
  if (!findRouteNodeById(input.workspace.routeManifest.root, routeNodeId)) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ROUTE_MISSING',
      message: `Route does not exist: ${routeNodeId}`,
    });
  }
  const actionDocumentId = input.actionDocumentId.trim();
  const targetDocumentId = input.targetDocumentId.trim();
  const actionPath = input.actionPath.trim();
  const targetPath = input.targetPath.trim();
  const exportName = input.exportName?.trim() || SOURCE_MUTATION_EXPORT_NAME;
  const importSpecifier = relativeWorkspaceImport(actionPath, targetPath);
  if (
    !actionDocumentId ||
    !targetDocumentId ||
    actionDocumentId === targetDocumentId ||
    !actionPath ||
    !targetPath ||
    !importSpecifier ||
    !/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(exportName)
  ) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_PRESET_INVALID',
      message:
        'Source mutation action, target identity, path, or export name is invalid.',
    });
  }
  let metadata: Readonly<Record<string, unknown>>;
  try {
    metadata = writeServerRuntimeProfile(
      undefined,
      sourceMutationProfile(exportName),
      'ts'
    );
  } catch (error) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_PRESET_INVALID',
      message:
        error instanceof Error
          ? error.message
          : 'Source mutation profile is invalid.',
    });
  }
  const createDocument = (
    workspace: WorkspaceSnapshot,
    document: WorkspaceDocument,
    suffix: string,
    label: string
  ) =>
    createWorkspaceDocumentAtPathCommand({
      workspace,
      document,
      commandId: `${input.transactionId}:${suffix}`,
      issuedAt: input.issuedAt,
      label,
    });
  let createTarget;
  let createAction;
  try {
    createTarget = createDocument(
      input.workspace,
      {
        id: targetDocumentId,
        type: 'code',
        name: targetPath.split('/').at(-1),
        path: targetPath,
        contentRev: 1,
        metaRev: 1,
        content: { language: 'ts', source: sourceMutationTargetSource },
      },
      'target',
      'Create isolated project-source mutation target'
    );
    const targetStaged = applyWorkspaceCommand(input.workspace, createTarget);
    if (!targetStaged.ok) throw new Error(targetStaged.issues[0]?.message);
    createAction = createDocument(
      targetStaged.snapshot,
      {
        id: actionDocumentId,
        type: 'code',
        name: actionPath.split('/').at(-1),
        path: actionPath,
        contentRev: 1,
        metaRev: 1,
        content: {
          language: 'ts',
          source: sourceMutationActionSource(
            exportName,
            targetDocumentId,
            importSpecifier
          ),
          metadata,
        },
      },
      'action',
      'Create isolated workspace.write source mutation action'
    );
  } catch (error) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ARTIFACT_UNSUPPORTED',
      message:
        error instanceof Error
          ? error.message
          : 'Source mutation CodeArtifacts could not be created.',
    });
  }
  const targetStaged = applyWorkspaceCommand(input.workspace, createTarget);
  if (!targetStaged.ok) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ARTIFACT_UNSUPPORTED',
      message:
        targetStaged.issues[0]?.message ??
        'Source mutation target failed Workspace validation.',
    });
  }
  const actionStaged = applyWorkspaceCommand(
    targetStaged.snapshot,
    createAction
  );
  if (!actionStaged.ok) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ARTIFACT_UNSUPPORTED',
      message:
        actionStaged.issues[0]?.message ??
        'Source mutation action failed Workspace validation.',
    });
  }
  const functionRef = Object.freeze({
    artifactId: actionDocumentId,
    exportName,
  });
  const binding = createWorkspaceServerRuntimeBindingPlan({
    workspace: actionStaged.snapshot,
    routeNodeId,
    slot: 'action',
    reference: functionRef,
    operationId: `${input.transactionId}:binding`,
    issuedAt: input.issuedAt,
  });
  if (binding.status !== 'ready' || binding.plan.kind !== 'command') {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_BINDING_INVALID',
      message:
        binding.status === 'rejected'
          ? binding.message
          : 'Source mutation Route binding could not be created.',
    });
  }
  return Object.freeze({
    status: 'ready',
    plan: Object.freeze({
      transaction: Object.freeze({
        id: input.transactionId,
        workspaceId: input.workspace.id,
        issuedAt: input.issuedAt,
        label: 'Create isolated workspace.write source mutation action',
        commands: [createTarget, createAction, binding.plan.command],
      }),
      functionRef,
      actionDocumentId,
      targetDocumentId,
    }),
  });
};

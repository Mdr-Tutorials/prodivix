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
import type { WorkspaceSnapshot } from './types';

export type CreateWorkspaceReadSecretLoaderTransactionPlanInput = Readonly<{
  workspace: WorkspaceSnapshot;
  routeNodeId: string;
  documentId: string;
  path: string;
  secretBindingId: string;
  transactionId: string;
  issuedAt: string;
  exportName?: string;
}>;

export type WorkspaceReadSecretLoaderTransactionPlanResult =
  | Readonly<{
      status: 'ready';
      plan: Readonly<{
        transaction: WorkspaceTransactionEnvelope;
        functionRef: ServerFunctionReference;
        documentId: string;
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

const READ_SECRET_EXPORT_NAME = 'loadWorkspaceReadSecret';
const READ_SECRET_FIELD = 'signingKey';

const readSecretProfile = (
  exportName: string,
  secretBindingId: string
): ServerRuntimeProfile =>
  Object.freeze({
    schemaVersion: '1.0',
    functionsByExport: Object.freeze({
      [exportName]: Object.freeze({
        kind: 'route-loader' as const,
        runtimeZone: 'server' as const,
        adapterId: 'prodivix.code-export',
        effect: 'read' as const,
        auth: Object.freeze({
          kind: 'permission' as const,
          permissionId: 'workspace.read',
        }),
        inputSchema: Object.freeze({
          type: 'object',
          additionalProperties: false,
          required: Object.freeze(['routeId']),
          properties: Object.freeze({
            routeId: Object.freeze({ type: 'string' }),
          }),
        }),
        outputSchema: Object.freeze({
          type: 'object',
          additionalProperties: false,
          required: Object.freeze(['secretResolved']),
          properties: Object.freeze({
            secretResolved: Object.freeze({ const: true }),
          }),
        }),
        environment: Object.freeze({
          secretsByField: Object.freeze({
            [READ_SECRET_FIELD]: Object.freeze({
              bindingId: secretBindingId,
            }),
          }),
        }),
      }),
    }),
  });

const readSecretSource = (exportName: string): string =>
  `type WorkspaceReadSecretContext = Readonly<{\n  useSecret?: (\n    field: '${READ_SECRET_FIELD}',\n    consumer: (material: string) => void | Promise<void>,\n  ) => Promise<void>;\n}>;\n\nexport const ${exportName} = async (\n  _input: Readonly<{ routeId: string }>,\n  context: WorkspaceReadSecretContext,\n) => {\n  if (!context.useSecret) throw new Error('Isolated Secret capability is unavailable.');\n  let secretResolved = false;\n  await context.useSecret('${READ_SECRET_FIELD}', (material) => {\n    secretResolved = material.length > 0;\n  });\n  if (!secretResolved) throw new Error('The declared Secret is unavailable.');\n  return { kind: 'value' as const, value: { secretResolved: true as const } };\n};\n`;

/** Creates one reference-only workspace.read + Secret loader and binds it atomically. */
export const createWorkspaceReadSecretLoaderTransactionPlan = (
  input: CreateWorkspaceReadSecretLoaderTransactionPlanInput
): WorkspaceReadSecretLoaderTransactionPlanResult => {
  const routeNodeId = input.routeNodeId.trim();
  if (!findRouteNodeById(input.workspace.routeManifest.root, routeNodeId)) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ROUTE_MISSING',
      message: `Route does not exist: ${routeNodeId}`,
    });
  }
  const documentId = input.documentId.trim();
  const path = input.path.trim();
  const secretBindingId = input.secretBindingId.trim();
  const exportName = input.exportName?.trim() || READ_SECRET_EXPORT_NAME;
  if (
    !documentId ||
    !path ||
    !secretBindingId ||
    secretBindingId !== input.secretBindingId ||
    !/^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(exportName)
  ) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_PRESET_INVALID',
      message:
        'workspace.read Secret loader identity, path, binding, or export name is invalid.',
    });
  }
  let metadata: Readonly<Record<string, unknown>>;
  try {
    metadata = writeServerRuntimeProfile(
      undefined,
      readSecretProfile(exportName, secretBindingId),
      'ts'
    );
  } catch (error) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_PRESET_INVALID',
      message:
        error instanceof Error
          ? error.message
          : 'workspace.read Secret loader profile is invalid.',
    });
  }
  let createArtifact;
  try {
    createArtifact = createWorkspaceDocumentAtPathCommand({
      workspace: input.workspace,
      document: {
        id: documentId,
        type: 'code',
        name: path.split('/').at(-1),
        path,
        contentRev: 1,
        metaRev: 1,
        content: {
          language: 'ts',
          source: readSecretSource(exportName),
          metadata,
        },
      },
      commandId: `${input.transactionId}:artifact`,
      issuedAt: input.issuedAt,
      label: 'Create isolated workspace.read Secret loader',
    });
  } catch (error) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ARTIFACT_UNSUPPORTED',
      message:
        error instanceof Error
          ? error.message
          : 'workspace.read Secret loader CodeArtifact could not be created.',
    });
  }
  const staged = applyWorkspaceCommand(input.workspace, createArtifact);
  if (!staged.ok) {
    return Object.freeze({
      status: 'rejected',
      code: 'WKS_SERVER_RUNTIME_ARTIFACT_UNSUPPORTED',
      message:
        staged.issues[0]?.message ??
        'workspace.read Secret loader failed Workspace validation.',
    });
  }
  const functionRef = Object.freeze({ artifactId: documentId, exportName });
  const binding = createWorkspaceServerRuntimeBindingPlan({
    workspace: staged.snapshot,
    routeNodeId,
    slot: 'loader',
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
          : 'workspace.read Secret Route loader binding could not be created.',
    });
  }
  return Object.freeze({
    status: 'ready',
    plan: Object.freeze({
      transaction: Object.freeze({
        id: input.transactionId,
        workspaceId: input.workspace.id,
        issuedAt: input.issuedAt,
        label: 'Create isolated workspace.read Secret loader',
        commands: [createArtifact, binding.plan.command],
      }),
      functionRef,
      documentId,
    }),
  });
};

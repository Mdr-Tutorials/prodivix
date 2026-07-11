import type {
  WorkspaceCommandEnvelope,
  WorkspacePatchOperation,
  WorkspaceTransactionEnvelope,
} from './workspaceCommand';
import type { WorkspaceRouteIntent } from './workspaceRouteIntent';
import type { WorkspaceSnapshot } from './types';

const routeCommandTypeByIntent: Record<WorkspaceRouteIntent['type'], string> = {
  'create-page': 'node.create-page',
  'create-index': 'node.create-index',
  'create-child-route': 'node.create-child',
  'rename-segment': 'node.rename-segment',
  'move-route': 'node.move',
  'attach-layout': 'layout.attach',
  'detach-layout': 'layout.detach',
  'bind-outlet': 'outlet.bind',
  'unbind-outlet': 'outlet.unbind',
  'set-runtime-ref': 'runtime-ref.set',
  'delete-route': 'node.delete',
};

const appendPropertyPatch = (
  forwardOps: WorkspacePatchOperation[],
  reverseOps: WorkspacePatchOperation[],
  path: string,
  before: unknown,
  after: unknown
) => {
  if (Object.is(before, after)) return;
  if (before === undefined) {
    forwardOps.push({ op: 'add', path, value: after });
    reverseOps.unshift({ op: 'remove', path });
    return;
  }
  if (after === undefined) {
    forwardOps.push({ op: 'remove', path });
    reverseOps.unshift({ op: 'add', path, value: before });
    return;
  }
  forwardOps.push({ op: 'replace', path, value: after });
  reverseOps.unshift({ op: 'replace', path, value: before });
};

export const createRouteIntentCommand = (input: {
  commandId: string;
  issuedAt: string;
  intent: WorkspaceRouteIntent;
  before: WorkspaceSnapshot;
  after: WorkspaceSnapshot;
}): WorkspaceCommandEnvelope => {
  const forwardOps: WorkspacePatchOperation[] = [];
  const reverseOps: WorkspacePatchOperation[] = [];
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/routeManifest',
    input.before.routeManifest,
    input.after.routeManifest
  );
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/activeRouteNodeId',
    input.before.activeRouteNodeId,
    input.after.activeRouteNodeId
  );
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/activeDocumentId',
    input.before.activeDocumentId,
    input.after.activeDocumentId
  );
  const commandType = routeCommandTypeByIntent[input.intent.type];
  return {
    id: input.commandId,
    namespace: 'core.route',
    type: commandType,
    version: '1.0',
    issuedAt: input.issuedAt,
    forwardOps,
    reverseOps,
    target: { workspaceId: input.before.id },
    domainHint: 'route',
    label: commandType,
  };
};

const createRouteWorkspaceCommand = (input: {
  commandId: string;
  issuedAt: string;
  before: WorkspaceSnapshot;
  after: WorkspaceSnapshot;
}): WorkspaceCommandEnvelope => {
  const forwardOps: WorkspacePatchOperation[] = [];
  const reverseOps: WorkspacePatchOperation[] = [];
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/treeRootId',
    input.before.treeRootId,
    input.after.treeRootId
  );
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/treeById',
    input.before.treeById,
    input.after.treeById
  );
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/docsById',
    input.before.docsById,
    input.after.docsById
  );
  appendPropertyPatch(
    forwardOps,
    reverseOps,
    '/activeDocumentId',
    input.before.activeDocumentId,
    input.after.activeDocumentId
  );
  return {
    id: input.commandId,
    namespace: 'core.workspace',
    type: 'document.create',
    version: '1.0',
    issuedAt: input.issuedAt,
    forwardOps,
    reverseOps,
    target: { workspaceId: input.before.id },
    domainHint: 'workspace',
    label: 'Create route document',
  };
};

export const createRouteIntentTransaction = (input: {
  transactionId: string;
  issuedAt: string;
  intent: WorkspaceRouteIntent;
  before: WorkspaceSnapshot;
  afterWorkspaceMutation: WorkspaceSnapshot;
  after: WorkspaceSnapshot;
}): WorkspaceTransactionEnvelope => ({
  id: input.transactionId,
  workspaceId: input.before.id,
  issuedAt: input.issuedAt,
  label: routeCommandTypeByIntent[input.intent.type],
  commands: [
    createRouteWorkspaceCommand({
      commandId: `${input.transactionId}:workspace`,
      issuedAt: input.issuedAt,
      before: input.before,
      after: input.afterWorkspaceMutation,
    }),
    createRouteIntentCommand({
      commandId: `${input.transactionId}:route`,
      issuedAt: input.issuedAt,
      intent: input.intent,
      before: input.afterWorkspaceMutation,
      after: input.after,
    }),
  ],
});

import {
  type DataOperationInputBinding,
  type DataOperationKind,
  type DataOperationReference,
  createDataOperationReference,
  normalizeDataOperationInputBinding,
} from '@prodivix/data';
import {
  type PIRCollectionDataLifecycleMapping,
  type PIRCollectionNode,
  type PIRDataOperationBinding,
  type PIRDataOperationTriggerBinding,
  type PIRDataQueryActivation,
  type PIRDocument,
  type PIRNode,
  type PIRTriggerBinding,
  type PIRValidationIssue,
  type PIRValueBinding,
  validatePirDocument,
} from '@prodivix/pir';
import {
  applyWorkspaceTransaction,
  type WorkspaceCommandEnvelope,
  type WorkspaceTransactionEnvelope,
} from '../workspaceCommand';
import { createWorkspacePirDocumentUpdateCommand } from '../workspacePirDocument';
import { decodeWorkspaceDataSourceDocument } from '../workspaceDataSourceDocument';
import type { WorkspaceSnapshot } from '../types';
import {
  decodeWorkspacePirDocument,
  type WorkspacePirReadIssue,
} from '../component/workspacePirDocument';

export const WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES = Object.freeze({
  baseRevisionMismatch: 'WKS_PIR_DATA_BINDING_BASE_REVISION_MISMATCH',
  inputInvalid: 'WKS_PIR_DATA_BINDING_INPUT_INVALID',
  sourceMissing: 'WKS_PIR_DATA_BINDING_SOURCE_MISSING',
  sourceTypeInvalid: 'WKS_PIR_DATA_BINDING_SOURCE_TYPE_INVALID',
  sourceInvalid: 'WKS_PIR_DATA_BINDING_SOURCE_INVALID',
  dataSourceMissing: 'WKS_PIR_DATA_BINDING_DATA_SOURCE_MISSING',
  dataSourceTypeInvalid: 'WKS_PIR_DATA_BINDING_DATA_SOURCE_TYPE_INVALID',
  dataSourceInvalid: 'WKS_PIR_DATA_BINDING_DATA_SOURCE_INVALID',
  operationMissing: 'DAT-2001',
  operationKindInvalid: 'WKS_PIR_DATA_BINDING_OPERATION_KIND_INVALID',
  dataIdConflict: 'WKS_PIR_DATA_BINDING_DATA_ID_CONFLICT',
  bindingReferenced: 'WKS_PIR_DATA_BINDING_REFERENCED',
  collectionMissing: 'WKS_PIR_DATA_BINDING_COLLECTION_MISSING',
  collectionTypeInvalid: 'WKS_PIR_DATA_BINDING_COLLECTION_TYPE_INVALID',
  triggerNodeMissing: 'WKS_PIR_DATA_TRIGGER_NODE_MISSING',
  triggerNodeTypeInvalid: 'WKS_PIR_DATA_TRIGGER_NODE_TYPE_INVALID',
  triggerConflict: 'WKS_PIR_DATA_TRIGGER_CONFLICT',
  resultInvalid: 'WKS_PIR_DATA_BINDING_RESULT_INVALID',
  transactionInvalid: 'WKS_PIR_DATA_BINDING_TRANSACTION_INVALID',
  unchanged: 'WKS_PIR_DATA_BINDING_UNCHANGED',
} as const);

export type WorkspacePirDataBindingPlanIssueCode =
  (typeof WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES)[keyof typeof WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES];

export type WorkspacePirDataBindingPlanIssue = Readonly<{
  code: WorkspacePirDataBindingPlanIssueCode;
  path: string;
  message: string;
  documentId?: string;
  dataId?: string;
  operationDocumentId?: string;
  operationId?: string;
  collectionNodeId?: string;
  nodeId?: string;
  eventName?: string;
  causeCode?: string;
}>;

type WorkspacePirDataBindingPlanInputBase = Readonly<{
  workspace: WorkspaceSnapshot;
  baseRevision: number;
  transactionId: string;
  issuedAt: string;
  documentId: string;
}>;

export type CreateWorkspacePirDataOperationBindingTransactionInput =
  WorkspacePirDataBindingPlanInputBase &
    Readonly<{
      dataId: string;
      binding: PIRDataOperationBinding | null;
    }>;

export type CreateWorkspaceCollectionDataOperationBindingTransactionInput =
  WorkspacePirDataBindingPlanInputBase &
    Readonly<{
      collectionNodeId: string;
      dataId: string;
      operation: DataOperationReference;
      idle: PIRCollectionDataLifecycleMapping['idle'];
      path?: string;
      input?: DataOperationInputBinding;
      activations?: readonly PIRDataQueryActivation[];
    }>;

export type CreateWorkspacePirDataOperationTriggerTransactionInput =
  WorkspacePirDataBindingPlanInputBase &
    Readonly<{
      nodeId: string;
      eventName: string;
      previousEventName?: string;
      replaceExisting?: boolean;
      trigger: PIRDataOperationTriggerBinding | null;
    }>;

export type WorkspacePirDataOperationBindingTransactionPlan = Readonly<{
  baseRevision: number;
  documentId: string;
  command: WorkspaceCommandEnvelope;
  transaction: WorkspaceTransactionEnvelope;
  nextDocumentContent: PIRDocument;
}>;

export type WorkspacePirDataOperationBindingTransactionPlanResult =
  | Readonly<{
      status: 'ready';
      plan: WorkspacePirDataOperationBindingTransactionPlan;
    }>
  | Readonly<{
      status: 'rejected';
      issues: readonly WorkspacePirDataBindingPlanIssue[];
    }>;

type ValidPirRead = Extract<
  ReturnType<typeof decodeWorkspacePirDocument>,
  Readonly<{ status: 'valid' }>
>;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const escapePointerSegment = (value: string): string =>
  value.replaceAll('~', '~0').replaceAll('/', '~1');

const isCanonicalText = (value: string): boolean =>
  value.length > 0 && value === value.trim() && !value.includes('\0');

const compareIssues = (
  left: WorkspacePirDataBindingPlanIssue,
  right: WorkspacePirDataBindingPlanIssue
): number =>
  compareText(left.path, right.path) ||
  compareText(left.code, right.code) ||
  compareText(left.message, right.message);

const reject = (
  issues: readonly WorkspacePirDataBindingPlanIssue[]
): WorkspacePirDataOperationBindingTransactionPlanResult =>
  Object.freeze({
    status: 'rejected',
    issues: Object.freeze(
      [...issues].sort(compareIssues).map((issue) => Object.freeze(issue))
    ),
  });

const validateEnvelope = (
  input: WorkspacePirDataBindingPlanInputBase,
  fields: readonly Readonly<{
    path: string;
    value: string;
    label: string;
  }>[]
): WorkspacePirDataBindingPlanIssue[] => {
  const issues: WorkspacePirDataBindingPlanIssue[] = [];
  if (
    !Number.isSafeInteger(input.baseRevision) ||
    input.baseRevision !== input.workspace.workspaceRev
  ) {
    issues.push({
      code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.baseRevisionMismatch,
      path: '/baseRevision',
      message: 'Base revision must equal the current Workspace revision.',
      documentId: input.documentId,
    });
  }
  for (const field of [
    {
      path: '/transactionId',
      value: input.transactionId,
      label: 'Transaction id',
    },
    { path: '/issuedAt', value: input.issuedAt, label: 'Issued-at value' },
    { path: '/documentId', value: input.documentId, label: 'PIR document id' },
    ...fields,
  ]) {
    if (isCanonicalText(field.value)) continue;
    issues.push({
      code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
      path: field.path,
      message: `${field.label} must be a non-empty canonical string.`,
      documentId: input.documentId,
    });
  }
  return issues;
};

const mapPirReadIssue = (
  documentId: string,
  issue: WorkspacePirReadIssue
): WorkspacePirDataBindingPlanIssue => ({
  code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.sourceInvalid,
  path: `/docsById/${escapePointerSegment(documentId)}/content${issue.path === '$' ? '' : issue.path}`,
  message: issue.message,
  documentId,
  ...(issue.code ? { causeCode: issue.code } : {}),
});

const readPirSource = (
  workspace: WorkspaceSnapshot,
  documentId: string
):
  | Readonly<{ ok: true; read: ValidPirRead }>
  | Readonly<{
      ok: false;
      issues: readonly WorkspacePirDataBindingPlanIssue[];
    }> => {
  const document = workspace.docsById[documentId];
  if (!document) {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.sourceMissing,
          path: `/docsById/${escapePointerSegment(documentId)}`,
          message: 'PIR source document does not exist.',
          documentId,
        },
      ],
    };
  }
  const read = decodeWorkspacePirDocument(document, {
    workspaceId: workspace.id,
  });
  if (read.status === 'valid') return { ok: true, read };
  if (read.status === 'unsupported-document-type') {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.sourceTypeInvalid,
          path: `/docsById/${escapePointerSegment(documentId)}/type`,
          message:
            'Data operation bindings can only be owned by a PIR document.',
          documentId,
        },
      ],
    };
  }
  return {
    ok: false,
    issues: read.issues.map((issue) => mapPirReadIssue(documentId, issue)),
  };
};

const resolveOperation = (
  workspace: WorkspaceSnapshot,
  referenceInput: DataOperationReference,
  expectedKind: DataOperationKind
):
  | Readonly<{ ok: true; reference: DataOperationReference }>
  | Readonly<{
      ok: false;
      issues: readonly WorkspacePirDataBindingPlanIssue[];
    }> => {
  let reference: DataOperationReference;
  try {
    reference = createDataOperationReference(referenceInput);
  } catch {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
          path: '/operation',
          message: 'Data operation reference is invalid.',
        },
      ],
    };
  }
  const target = workspace.docsById[reference.documentId];
  if (!target) {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.dataSourceMissing,
          path: `/docsById/${escapePointerSegment(reference.documentId)}`,
          message: 'Referenced Data source document does not exist.',
          operationDocumentId: reference.documentId,
          operationId: reference.operationId,
        },
      ],
    };
  }
  const dataSource = decodeWorkspaceDataSourceDocument(target);
  if (dataSource.status === 'unsupported-document-type') {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.dataSourceTypeInvalid,
          path: `/docsById/${escapePointerSegment(reference.documentId)}/type`,
          message: 'Referenced document must be a Data source document.',
          operationDocumentId: reference.documentId,
          operationId: reference.operationId,
        },
      ],
    };
  }
  if (dataSource.status === 'invalid') {
    return {
      ok: false,
      issues: dataSource.issues.map((issue) => ({
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.dataSourceInvalid,
        path: `/docsById/${escapePointerSegment(reference.documentId)}/content${issue.path === '/' ? '' : issue.path}`,
        message: issue.message,
        operationDocumentId: reference.documentId,
        operationId: reference.operationId,
        causeCode: issue.code,
      })),
    };
  }
  const operation =
    dataSource.decodedContent.operationsById[reference.operationId];
  if (!operation) {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.operationMissing,
          path: `/docsById/${escapePointerSegment(reference.documentId)}/content/operationsById/${escapePointerSegment(reference.operationId)}`,
          message: 'Referenced Data operation does not exist.',
          operationDocumentId: reference.documentId,
          operationId: reference.operationId,
        },
      ],
    };
  }
  if (operation.kind !== expectedKind) {
    return {
      ok: false,
      issues: [
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.operationKindInvalid,
          path: `/docsById/${escapePointerSegment(reference.documentId)}/content/operationsById/${escapePointerSegment(reference.operationId)}/kind`,
          message: `This PIR Data authoring surface requires a ${expectedKind} operation.`,
          operationDocumentId: reference.documentId,
          operationId: reference.operationId,
        },
      ],
    };
  }
  return { ok: true, reference };
};

const resolveQueryOperation = (
  workspace: WorkspaceSnapshot,
  reference: DataOperationReference
) => resolveOperation(workspace, reference, 'query');

const sortedRecord = <Value>(
  value: Readonly<Record<string, Value>>
): Readonly<Record<string, Value>> =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => compareText(left, right))
    )
  );

const normalizeQueryBinding = (
  binding: PIRDataOperationBinding,
  operation: DataOperationReference
): PIRDataOperationBinding => {
  const activations = binding.activations
    ? Object.freeze(
        binding.activations
          .map((activation): PIRDataQueryActivation => {
            if (activation.kind === 'document')
              return Object.freeze({ kind: 'document' });
            if (activation.kind === 'route')
              return Object.freeze({
                kind: 'route',
                routeId: activation.routeId.trim(),
              });
            return Object.freeze({
              kind: 'input-change',
              dependencyId: activation.dependencyId.trim(),
            });
          })
          .sort((left, right) =>
            compareText(JSON.stringify(left), JSON.stringify(right))
          )
      )
    : undefined;
  return Object.freeze({
    operation,
    ...(binding.input
      ? { input: normalizeDataOperationInputBinding(binding.input) }
      : {}),
    ...(activations ? { activations } : {}),
  });
};

const replaceDataBinding = (
  document: PIRDocument,
  dataId: string,
  binding: PIRDataOperationBinding | null
): PIRDocument => {
  const currentLogic = document.logic ?? {};
  const currentDataById = currentLogic.dataById ?? {};
  const nextDataById = { ...currentDataById };
  if (binding) nextDataById[dataId] = binding;
  else delete nextDataById[dataId];

  const { dataById: _previousDataById, ...logicWithoutData } = currentLogic;
  const nextLogic = {
    ...logicWithoutData,
    ...(Object.keys(nextDataById).length > 0
      ? { dataById: sortedRecord(nextDataById) }
      : {}),
  };
  const { logic: _previousLogic, ...documentWithoutLogic } = document;
  return Object.keys(nextLogic).length > 0
    ? { ...documentWithoutLogic, logic: nextLogic }
    : documentWithoutLogic;
};

type DataReferenceOccurrence = Readonly<{ path: string }>;

const collectDataBindingReferences = (
  document: PIRDocument,
  dataId: string
): readonly DataReferenceOccurrence[] => {
  const result: DataReferenceOccurrence[] = [];
  const visitValue = (
    value: PIRValueBinding | undefined,
    path: string
  ): void => {
    if (value?.kind === 'data' && value.dataId === dataId)
      result.push({ path });
  };
  const visitTrigger = (trigger: PIRTriggerBinding, path: string): void => {
    if (trigger.kind === 'emit-component-event') {
      visitValue(trigger.payload, `${path}/payload`);
    }
  };
  const visitNode = (node: PIRNode): void => {
    const base = `/ui/graph/nodesById/${escapePointerSegment(node.id)}`;
    if (node.kind === 'element') {
      visitValue(node.text, `${base}/text`);
      for (const [name, value] of Object.entries(node.style ?? {})) {
        visitValue(value, `${base}/style/${escapePointerSegment(name)}`);
      }
      for (const [name, value] of Object.entries(node.props ?? {})) {
        visitValue(value, `${base}/props/${escapePointerSegment(name)}`);
      }
      for (const [field, value] of [
        ['source', node.data?.source],
        ['value', node.data?.value],
        ['mock', node.data?.mock],
      ] as const) {
        visitValue(value, `${base}/data/${field}`);
      }
      for (const [name, value] of Object.entries(node.data?.extend ?? {})) {
        visitValue(value, `${base}/data/extend/${escapePointerSegment(name)}`);
      }
      for (const [name, trigger] of Object.entries(node.events ?? {})) {
        visitTrigger(trigger, `${base}/events/${escapePointerSegment(name)}`);
      }
      return;
    }
    if (node.kind === 'component-instance') {
      for (const [name, value] of Object.entries(node.bindings.props)) {
        visitValue(
          value,
          `${base}/bindings/props/${escapePointerSegment(name)}`
        );
      }
      for (const [name, trigger] of Object.entries(node.bindings.events)) {
        visitTrigger(
          trigger,
          `${base}/bindings/events/${escapePointerSegment(name)}`
        );
      }
      return;
    }
    if (node.kind === 'component-slot-outlet') {
      for (const [name, value] of Object.entries(node.bindings.props)) {
        visitValue(
          value,
          `${base}/bindings/props/${escapePointerSegment(name)}`
        );
      }
      return;
    }
    if (node.source.kind === 'binding') {
      visitValue(node.source.value, `${base}/source/value`);
    }
    if (node.key.kind === 'binding') {
      visitValue(node.key.value, `${base}/key/value`);
    }
    if (node.lifecycle?.dataId === dataId) {
      result.push({ path: `${base}/lifecycle/dataId` });
    }
  };
  Object.values(document.ui.graph.nodesById).forEach(visitNode);
  return Object.freeze(
    result.sort((left, right) => compareText(left.path, right.path))
  );
};

const collectDataIdConflict = (
  document: PIRDocument,
  dataId: string
): WorkspacePirDataBindingPlanIssue | undefined => {
  const node = document.ui.graph.nodesById[dataId];
  return node?.kind === 'element' && node.data
    ? {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.dataIdConflict,
        path: `/ui/graph/nodesById/${escapePointerSegment(dataId)}/data`,
        message:
          'Data operation binding id conflicts with an Element-owned data scope.',
        dataId,
      }
    : undefined;
};

const mapPirValidationIssue = (
  documentId: string,
  issue: PIRValidationIssue
): WorkspacePirDataBindingPlanIssue => ({
  code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.resultInvalid,
  path: `/docsById/${escapePointerSegment(documentId)}/content${issue.path}`,
  message: issue.message,
  documentId,
  causeCode: issue.code,
});

const completePlan = (input: {
  envelope: WorkspacePirDataBindingPlanInputBase;
  before: PIRDocument;
  after: PIRDocument;
  type:
    | 'data-operation-binding.update'
    | 'collection.data-operation.bind'
    | 'data-operation-trigger.update';
  label: string;
}): WorkspacePirDataOperationBindingTransactionPlanResult => {
  if (JSON.stringify(input.before) === JSON.stringify(input.after)) {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.unchanged,
        path: `/docsById/${escapePointerSegment(input.envelope.documentId)}/content`,
        message: 'Data binding update must change the PIR document.',
        documentId: input.envelope.documentId,
      },
    ]);
  }
  const validation = validatePirDocument(input.after);
  if (!validation.valid) {
    return reject(
      validation.issues.map((issue) =>
        mapPirValidationIssue(input.envelope.documentId, issue)
      )
    );
  }
  const command = createWorkspacePirDocumentUpdateCommand({
    workspace: input.envelope.workspace,
    before: input.before,
    after: input.after,
    documentId: input.envelope.documentId,
    commandId: `${input.envelope.transactionId}:document`,
    issuedAt: input.envelope.issuedAt,
    namespace: 'core.pir.data',
    type: input.type,
    label: input.label,
  });
  if (!command) {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.unchanged,
        path: `/docsById/${escapePointerSegment(input.envelope.documentId)}/content`,
        message: 'Data binding update produced no reversible patch.',
        documentId: input.envelope.documentId,
      },
    ]);
  }
  const transaction: WorkspaceTransactionEnvelope = {
    id: input.envelope.transactionId,
    workspaceId: input.envelope.workspace.id,
    issuedAt: input.envelope.issuedAt,
    label: input.label,
    commands: [command],
  };
  const dryApply = applyWorkspaceTransaction(
    input.envelope.workspace,
    transaction
  );
  if (!dryApply.ok) {
    const first = dryApply.issues[0];
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.transactionInvalid,
        path: first?.path ?? '/',
        message: first?.message ?? 'Data binding transaction is invalid.',
        documentId: input.envelope.documentId,
        ...(first ? { causeCode: first.code } : {}),
      },
    ]);
  }
  return Object.freeze({
    status: 'ready',
    plan: Object.freeze({
      baseRevision: input.envelope.baseRevision,
      documentId: input.envelope.documentId,
      command,
      transaction,
      nextDocumentContent: input.after,
    }),
  });
};

/** Plans one durable local dataId to DataOperationReference upsert or removal. */
export const createWorkspacePirDataOperationBindingTransactionPlan = (
  input: CreateWorkspacePirDataOperationBindingTransactionInput
): WorkspacePirDataOperationBindingTransactionPlanResult => {
  const envelopeIssues = validateEnvelope(input, [
    { path: '/dataId', value: input.dataId, label: 'Local data id' },
  ]);
  if (envelopeIssues.length > 0) return reject(envelopeIssues);
  const source = readPirSource(input.workspace, input.documentId);
  if (!source.ok) return reject(source.issues);
  let normalizedBinding: PIRDataOperationBinding | null = null;
  if (input.binding) {
    const target = resolveQueryOperation(
      input.workspace,
      input.binding.operation
    );
    if (!target.ok) return reject(target.issues);
    try {
      normalizedBinding = normalizeQueryBinding(
        input.binding,
        target.reference
      );
    } catch {
      return reject([
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
          path: '/binding/input',
          message: 'Data query input mapping is invalid.',
          documentId: input.documentId,
          dataId: input.dataId,
        },
      ]);
    }
    const conflict = collectDataIdConflict(
      source.read.decodedContent,
      input.dataId
    );
    if (conflict)
      return reject([{ ...conflict, documentId: input.documentId }]);
  } else {
    const occurrences = collectDataBindingReferences(
      source.read.decodedContent,
      input.dataId
    );
    if (occurrences.length > 0) {
      return reject(
        occurrences.map((occurrence) => ({
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.bindingReferenced,
          path: `/docsById/${escapePointerSegment(input.documentId)}/content${occurrence.path}`,
          message: `Local data binding "${input.dataId}" is still referenced by this PIR document.`,
          documentId: input.documentId,
          dataId: input.dataId,
        }))
      );
    }
  }
  const after = replaceDataBinding(
    source.read.decodedContent,
    input.dataId,
    normalizedBinding
  );
  return completePlan({
    envelope: input,
    before: source.read.decodedContent,
    after,
    type: 'data-operation-binding.update',
    label: `${normalizedBinding ? 'Bind' : 'Remove'} data ${input.dataId}`,
  });
};

/** Plans one Blueprint element event to mutation dispatch without overwriting other domain bindings. */
export const createWorkspacePirDataOperationTriggerTransactionPlan = (
  input: CreateWorkspacePirDataOperationTriggerTransactionInput
): WorkspacePirDataOperationBindingTransactionPlanResult => {
  const envelopeIssues = validateEnvelope(input, [
    { path: '/nodeId', value: input.nodeId, label: 'Element node id' },
    { path: '/eventName', value: input.eventName, label: 'Event name' },
  ]);
  if (
    input.previousEventName !== undefined &&
    !isCanonicalText(input.previousEventName)
  ) {
    envelopeIssues.push({
      code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
      path: '/previousEventName',
      message: 'Previous event name must be a non-empty canonical string.',
      documentId: input.documentId,
      nodeId: input.nodeId,
      eventName: input.eventName,
    });
  }
  if (envelopeIssues.length > 0) return reject(envelopeIssues);
  const source = readPirSource(input.workspace, input.documentId);
  if (!source.ok) return reject(source.issues);
  const currentNode =
    source.read.decodedContent.ui.graph.nodesById[input.nodeId];
  if (!currentNode) {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.triggerNodeMissing,
        path: `/docsById/${escapePointerSegment(input.documentId)}/content/ui/graph/nodesById/${escapePointerSegment(input.nodeId)}`,
        message: 'Data mutation trigger owner does not exist.',
        documentId: input.documentId,
        nodeId: input.nodeId,
        eventName: input.eventName,
      },
    ]);
  }
  if (currentNode.kind !== 'element') {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.triggerNodeTypeInvalid,
        path: `/docsById/${escapePointerSegment(input.documentId)}/content/ui/graph/nodesById/${escapePointerSegment(input.nodeId)}/kind`,
        message:
          'Blueprint Data mutation triggers currently require an Element owner.',
        documentId: input.documentId,
        nodeId: input.nodeId,
        eventName: input.eventName,
      },
    ]);
  }
  const previousEventName = input.previousEventName ?? input.eventName;
  const currentTrigger = currentNode.events?.[previousEventName];
  const destinationTrigger = currentNode.events?.[input.eventName];
  if (
    ((currentTrigger && currentTrigger.kind !== 'dispatch-data-operation') ||
      (input.eventName !== previousEventName && destinationTrigger)) &&
    !input.replaceExisting
  ) {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.triggerConflict,
        path: `/docsById/${escapePointerSegment(input.documentId)}/content/ui/graph/nodesById/${escapePointerSegment(input.nodeId)}/events/${escapePointerSegment(previousEventName)}`,
        message:
          'Data mutation authoring must not overwrite another domain-owned event binding.',
        documentId: input.documentId,
        nodeId: input.nodeId,
        eventName: input.eventName,
      },
    ]);
  }

  let nextTrigger: PIRDataOperationTriggerBinding | undefined;
  if (input.trigger) {
    const target = resolveOperation(
      input.workspace,
      input.trigger.operation,
      'mutation'
    );
    if (!target.ok) return reject(target.issues);
    try {
      nextTrigger = Object.freeze({
        kind: 'dispatch-data-operation',
        operation: target.reference,
        input: normalizeDataOperationInputBinding(input.trigger.input),
      });
    } catch {
      return reject([
        {
          code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
          path: '/trigger/input',
          message: 'Data mutation input mapping is invalid.',
          documentId: input.documentId,
          nodeId: input.nodeId,
          eventName: input.eventName,
        },
      ]);
    }
  }

  const events = { ...(currentNode.events ?? {}) };
  delete events[previousEventName];
  if (nextTrigger) events[input.eventName] = nextTrigger;
  else delete events[input.eventName];
  const { events: _currentEvents, ...nodeWithoutEvents } = currentNode;
  const nextNode = Object.freeze({
    ...nodeWithoutEvents,
    ...(Object.keys(events).length > 0 ? { events: sortedRecord(events) } : {}),
  });
  const after: PIRDocument = {
    ...source.read.decodedContent,
    ui: {
      ...source.read.decodedContent.ui,
      graph: {
        ...source.read.decodedContent.ui.graph,
        nodesById: {
          ...source.read.decodedContent.ui.graph.nodesById,
          [input.nodeId]: nextNode,
        },
      },
    },
  };
  return completePlan({
    envelope: input,
    before: source.read.decodedContent,
    after,
    type: 'data-operation-trigger.update',
    label: `${nextTrigger ? 'Bind' : 'Remove'} Data mutation ${input.eventName}`,
  });
};

/**
 * Atomically creates the local query binding and maps one Collection source
 * and lifecycle to the exact same dataId.
 */
export const createWorkspaceCollectionDataOperationBindingTransactionPlan = (
  input: CreateWorkspaceCollectionDataOperationBindingTransactionInput
): WorkspacePirDataOperationBindingTransactionPlanResult => {
  const normalizedPath = input.path?.trim();
  const envelopeIssues = validateEnvelope(input, [
    { path: '/dataId', value: input.dataId, label: 'Local data id' },
    {
      path: '/collectionNodeId',
      value: input.collectionNodeId,
      label: 'Collection node id',
    },
  ]);
  if (input.path?.includes('\0')) {
    envelopeIssues.push({
      code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
      path: '/path',
      message: 'Collection result path must not contain null bytes.',
      documentId: input.documentId,
      collectionNodeId: input.collectionNodeId,
    });
  }
  if (input.idle !== 'loading' && input.idle !== 'empty') {
    envelopeIssues.push({
      code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
      path: '/idle',
      message: 'Collection idle lifecycle state must map to loading or empty.',
      documentId: input.documentId,
      collectionNodeId: input.collectionNodeId,
    });
  }
  if (envelopeIssues.length > 0) return reject(envelopeIssues);
  const source = readPirSource(input.workspace, input.documentId);
  if (!source.ok) return reject(source.issues);
  const target = resolveQueryOperation(input.workspace, input.operation);
  if (!target.ok) return reject(target.issues);
  const conflict = collectDataIdConflict(
    source.read.decodedContent,
    input.dataId
  );
  if (conflict) return reject([{ ...conflict, documentId: input.documentId }]);

  const currentNode =
    source.read.decodedContent.ui.graph.nodesById[input.collectionNodeId];
  if (!currentNode) {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.collectionMissing,
        path: `/docsById/${escapePointerSegment(input.documentId)}/content/ui/graph/nodesById/${escapePointerSegment(input.collectionNodeId)}`,
        message: 'Collection node does not exist.',
        documentId: input.documentId,
        collectionNodeId: input.collectionNodeId,
      },
    ]);
  }
  if (currentNode.kind !== 'collection') {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.collectionTypeInvalid,
        path: `/docsById/${escapePointerSegment(input.documentId)}/content/ui/graph/nodesById/${escapePointerSegment(input.collectionNodeId)}/kind`,
        message:
          'Data lifecycle mapping can only be attached to a Collection node.',
        documentId: input.documentId,
        collectionNodeId: input.collectionNodeId,
      },
    ]);
  }

  let binding: PIRDataOperationBinding;
  try {
    binding = normalizeQueryBinding(
      {
        operation: target.reference,
        ...(input.input ? { input: input.input } : {}),
        ...(input.activations ? { activations: input.activations } : {}),
      },
      target.reference
    );
  } catch {
    return reject([
      {
        code: WORKSPACE_PIR_DATA_BINDING_PLAN_ISSUE_CODES.inputInvalid,
        path: '/input',
        message: 'Collection Data query input mapping is invalid.',
        documentId: input.documentId,
        collectionNodeId: input.collectionNodeId,
      },
    ]);
  }
  const lifecycle: PIRCollectionDataLifecycleMapping = Object.freeze({
    kind: 'data-operation',
    dataId: input.dataId,
    idle: input.idle,
  });
  const collection: PIRCollectionNode = Object.freeze({
    ...currentNode,
    source: Object.freeze({
      kind: 'binding',
      value: Object.freeze({
        kind: 'data',
        dataId: input.dataId,
        ...(normalizedPath ? { path: normalizedPath } : {}),
      }),
    }),
    lifecycle,
  });
  const withBinding = replaceDataBinding(
    source.read.decodedContent,
    input.dataId,
    binding
  );
  const after: PIRDocument = {
    ...withBinding,
    ui: {
      ...withBinding.ui,
      graph: {
        ...withBinding.ui.graph,
        nodesById: {
          ...withBinding.ui.graph.nodesById,
          [input.collectionNodeId]: collection,
        },
      },
    },
  };
  return completePlan({
    envelope: input,
    before: source.read.decodedContent,
    after,
    type: 'collection.data-operation.bind',
    label: `Bind collection ${input.collectionNodeId} to ${target.reference.operationId}`,
  });
};

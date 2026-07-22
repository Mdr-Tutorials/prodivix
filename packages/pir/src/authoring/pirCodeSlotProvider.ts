import {
  createSemanticId,
  type DataOperationInputBinding,
  getCodeReferenceSemanticRole,
  type AuthoringContext,
  type CodeReference,
  type CodeSlotBindingProjection,
  type CodeSlotContract,
  type CodeSlotProvider,
} from '@prodivix/authoring';
import type {
  PIRDocument,
  PIRElementNode,
  PIRTriggerBinding,
} from '../pir.types';

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const toJsonPointerToken = (value: string): string =>
  value.replaceAll('~', '~0').replaceAll('/', '~1');

export const createPirMountedCssCodeSlotId = (
  documentId: string,
  nodeId: string
): string =>
  createSemanticId('pir-code-slot', documentId, nodeId, 'mounted-css');

const createPirCodeReferenceId = (input: {
  workspaceId: string;
  documentId: string;
  nodeId: string;
  fieldPath: string;
  reference: CodeReference;
}): string =>
  createSemanticId(
    'pir-reference',
    input.workspaceId,
    input.documentId,
    input.nodeId,
    input.fieldPath,
    getCodeReferenceSemanticRole(input.reference)
  );

const createEventSlot = (
  documentId: string,
  nodeId: string,
  trigger: Extract<PIRTriggerBinding, { kind: 'call-code' }>
): CodeSlotContract => ({
  id: trigger.slotId,
  ownerRef: { kind: 'pir-node', documentId, nodeId },
  kind: 'event-handler',
  inputTypeRef: 'PIRTriggerContext',
  outputTypeRef: 'void | Promise<void>',
  capabilityIds: ['pir-event-handler'],
  defaultPlacement: [
    'inspector',
    'blueprint-canvas',
    'code-editor',
    'issues-panel',
  ],
});

const createMountedCssSlot = (
  documentId: string,
  nodeId: string
): CodeSlotContract => ({
  id: createPirMountedCssCodeSlotId(documentId, nodeId),
  ownerRef: { kind: 'pir-node', documentId, nodeId },
  kind: 'mounted-css',
  outputTypeRef: 'CSSStyleSheet',
  capabilityIds: ['css', 'mounted-css'],
  defaultPlacement: [
    'inspector',
    'blueprint-canvas',
    'code-editor',
    'issues-panel',
  ],
});

const createDataInputSlot = (
  ownerRef: CodeSlotContract['ownerRef'],
  binding: Extract<DataOperationInputBinding, { kind: 'code' }>
): CodeSlotContract => ({
  id: binding.slotId,
  ownerRef,
  kind: 'data-input-transform',
  inputTypeRef: 'DataJsonValue',
  outputTypeRef: 'DataJsonValue | Promise<DataJsonValue>',
  capabilityIds: ['data-operation-input-transform'],
  defaultPlacement: ['inspector', 'code-editor', 'issues-panel'],
});

const visitDataInputCodeBindings = (
  binding: DataOperationInputBinding,
  fieldPath: string,
  visit: (
    binding: Extract<DataOperationInputBinding, { kind: 'code' }>,
    fieldPath: string
  ) => void
): void => {
  if (binding.kind === 'code') {
    visit(binding, fieldPath);
    visitDataInputCodeBindings(binding.input, `${fieldPath}/input`, visit);
    return;
  }
  if (binding.kind === 'object') {
    Object.entries(binding.propertiesByKey).forEach(([key, child]) =>
      visitDataInputCodeBindings(
        child,
        `${fieldPath}/propertiesByKey/${toJsonPointerToken(key)}`,
        visit
      )
    );
    return;
  }
  if (binding.kind === 'array')
    binding.items.forEach((child, index) =>
      visitDataInputCodeBindings(child, `${fieldPath}/items/${index}`, visit)
    );
};

const matchesOwner = (
  context: AuthoringContext,
  documentId: string,
  nodeId: string
): boolean => {
  const target = context.targetRef;
  if (!target) return true;
  return (
    (target.kind === 'pir-node' || target.kind === 'inspector-field') &&
    target.documentId === documentId &&
    target.nodeId === nodeId
  );
};

const getMountedCssReference = (
  node: PIRElementNode
): CodeReference | undefined => {
  const binding = node.props?.mountedCss;
  return binding?.kind === 'code' ? binding.reference : undefined;
};

/** Projects PIR-owned event and mounted-CSS slots from one current document. */
export const createPirCodeSlotProvider = (input: {
  workspaceId: string;
  documentId: string;
  document: PIRDocument;
}): CodeSlotProvider => {
  const slots: CodeSlotContract[] = [];
  const bindings: CodeSlotBindingProjection[] = [];
  const nodes = Object.entries(input.document.ui.graph.nodesById).sort(
    ([left], [right]) => compareText(left, right)
  );

  for (const [dataId, dataBinding] of Object.entries(
    input.document.logic?.dataById ?? {}
  ).sort(([left], [right]) => compareText(left, right))) {
    if (!dataBinding.input) continue;
    visitDataInputCodeBindings(
      dataBinding.input,
      'input',
      (code, fieldPath) => {
        const ownerRef = {
          kind: 'document',
          documentId: input.documentId,
        } as const;
        const slot = createDataInputSlot(ownerRef, code);
        slots.push(slot);
        bindings.push({
          binding: { slotId: slot.id, reference: code.reference },
          ownerRef,
          semanticReferenceId: createSemanticId(
            'pir-data-input-code-reference',
            input.workspaceId,
            input.documentId,
            dataId,
            `${fieldPath}/reference`
          ),
        });
      }
    );
  }

  for (const [nodeId, node] of nodes) {
    const events =
      node.kind === 'element'
        ? node.events
        : node.kind === 'component-instance'
          ? node.bindings.events
          : undefined;
    for (const [eventName, trigger] of Object.entries(events ?? {}).sort(
      ([left], [right]) => compareText(left, right)
    )) {
      const fieldPath =
        node.kind === 'component-instance'
          ? `/bindings/events/${toJsonPointerToken(eventName)}/trigger`
          : `/events/${toJsonPointerToken(eventName)}`;
      if (trigger.kind === 'call-code') {
        const slot = createEventSlot(input.documentId, nodeId, trigger);
        slots.push(slot);
        bindings.push({
          binding: { slotId: slot.id, reference: trigger.reference },
          ownerRef: slot.ownerRef,
          semanticReferenceId: createPirCodeReferenceId({
            ...input,
            nodeId,
            fieldPath,
            reference: trigger.reference,
          }),
        });
      }
      if (trigger.kind === 'dispatch-data-operation') {
        visitDataInputCodeBindings(
          trigger.input,
          `${fieldPath}/input`,
          (code, codeFieldPath) => {
            const ownerRef = {
              kind: 'pir-node',
              documentId: input.documentId,
              nodeId,
            } as const;
            const slot = createDataInputSlot(ownerRef, code);
            slots.push(slot);
            bindings.push({
              binding: { slotId: slot.id, reference: code.reference },
              ownerRef,
              semanticReferenceId: createPirCodeReferenceId({
                ...input,
                nodeId,
                fieldPath: `${codeFieldPath}/reference`,
                reference: code.reference,
              }),
            });
          }
        );
      }
    }

    if (node.kind !== 'element') continue;
    const mountedCssReference = getMountedCssReference(node);
    const mountedCssSlot = createMountedCssSlot(input.documentId, nodeId);
    slots.push(mountedCssSlot);
    if (!mountedCssReference) continue;
    bindings.push({
      binding: {
        slotId: mountedCssSlot.id,
        reference: mountedCssReference,
      },
      ownerRef: mountedCssSlot.ownerRef,
      semanticReferenceId: createPirCodeReferenceId({
        ...input,
        nodeId,
        fieldPath: '/props/mountedCss',
        reference: mountedCssReference,
      }),
    });
  }

  const slotsById = new Map(slots.map((slot) => [slot.id, slot]));
  const bindingsById = new Map(
    bindings.map((projection) => [projection.binding.slotId, projection])
  );

  return {
    id: `core.pir.code-slots.${input.documentId}`,
    source: { kind: 'pir', documentId: input.documentId },
    listSlots(context) {
      return slots.filter((slot) => {
        const owner = slot.ownerRef;
        return owner.kind === 'document'
          ? !context.targetRef ||
              (context.targetRef.kind === 'document' &&
                context.targetRef.documentId === owner.documentId)
          : owner.kind === 'pir-node' &&
              matchesOwner(context, owner.documentId, owner.nodeId);
      });
    },
    getSlot(id) {
      return slotsById.get(id) ?? null;
    },
    listBindingProjections(context) {
      return bindings.filter((projection) => {
        const owner = projection.ownerRef;
        return (
          (owner.kind === 'document'
            ? !context.targetRef ||
              (context.targetRef.kind === 'document' &&
                context.targetRef.documentId === owner.documentId)
            : owner.kind === 'pir-node' &&
              matchesOwner(context, input.documentId, owner.nodeId)) &&
          (!context.artifactId ||
            projection.binding.reference.artifactId === context.artifactId)
        );
      });
    },
    getBindingProjection(id) {
      return bindingsById.get(id) ?? null;
    },
  };
};

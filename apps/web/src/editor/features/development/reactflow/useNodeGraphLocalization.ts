import { useCallback, useMemo } from 'react';
import type { Node } from '@xyflow/react';
import type { GraphNodeData, GraphNodeKind } from './GraphNode';
import type { ConnectionValidationReason } from './graphConnectionValidation';
import { NODE_MENU_GROUPS } from './nodeCatalog';
import type { NodeGraphTranslate } from './nodeGraphI18nTypes';
import type { NodeValidationText } from './nodeGraphEditorModel';

export const useNodeGraphLocalization = (t: NodeGraphTranslate) => {
  const resolveCatalogNodeLabel = useCallback(
    (kind: GraphNodeKind, fallbackLabel: string) =>
      t(`nodeGraph.catalog.nodes.${kind}`, {
        defaultValue: fallbackLabel,
      }),
    [t]
  );
  const resolveCatalogGroupLabel = useCallback(
    (groupId: string, fallbackLabel: string) =>
      t(`nodeGraph.catalog.groups.${groupId}`, {
        defaultValue: fallbackLabel,
      }),
    [t]
  );
  const localizedNodeMenuGroups = useMemo(
    () =>
      NODE_MENU_GROUPS.map((group) => ({
        ...group,
        label: resolveCatalogGroupLabel(group.id, group.label),
        items: group.items.map((item) => ({
          ...item,
          label: resolveCatalogNodeLabel(item.kind, item.label),
        })),
      })),
    [resolveCatalogGroupLabel, resolveCatalogNodeLabel]
  );
  const connectionHintTextByReason = useMemo<
    Record<ConnectionValidationReason, string>
  >(
    () => ({
      'missing-endpoint': t('nodeGraph.connection.missingEndpoint', {
        defaultValue: 'Invalid connection: missing source or target.',
      }),
      'invalid-handle': t('nodeGraph.connection.invalidHandle', {
        defaultValue: 'Invalid connection: unable to resolve port handle.',
      }),
      'wrong-direction': t('nodeGraph.connection.wrongDirection', {
        defaultValue:
          'Invalid connection: connect from output port to input port.',
      }),
      'semantic-mismatch': t('nodeGraph.connection.semanticMismatch', {
        defaultValue: 'Invalid connection: port semantics do not match.',
      }),
      'node-not-found': t('nodeGraph.connection.nodeNotFound', {
        defaultValue: 'Invalid connection: node state changed, please retry.',
      }),
      'source-occupied': t('nodeGraph.connection.sourceOccupied', {
        defaultValue:
          'Invalid connection: source port is single-use and already occupied.',
      }),
      'target-occupied': t('nodeGraph.connection.targetOccupied', {
        defaultValue:
          'Invalid connection: target port is single-use and already occupied.',
      }),
    }),
    [t]
  );
  const hintText = useMemo(
    () => ({
      invalidConnectEnd: t('nodeGraph.hints.invalidConnectEnd', {
        defaultValue:
          'Unable to connect: connect output port to an input with matching semantic.',
      }),
      invalidPortHandle: t('nodeGraph.hints.invalidPortHandle', {
        defaultValue:
          'Unable to parse selected port semantic; node created without auto-connect.',
      }),
      noMatchingInput: t('nodeGraph.hints.noMatchingInput', {
        defaultValue:
          'Created node has no matching input port. Node created without connection.',
      }),
      noMatchingOutput: t('nodeGraph.hints.noMatchingOutput', {
        defaultValue:
          'Created node has no matching output port. Node created without connection.',
      }),
      keepAtLeastOneCase: t('nodeGraph.hints.keepAtLeastOneCase', {
        defaultValue: 'Switch must keep at least one case.',
      }),
      keepAtLeastOneStatus: t('nodeGraph.hints.keepAtLeastOneStatus', {
        defaultValue: 'Fetch must keep at least one status branch.',
      }),
      keepAtLeastOneBranch: t('nodeGraph.hints.keepAtLeastOneBranch', {
        defaultValue: 'Parallel branches must keep at least one branch.',
      }),
      keepAtLeastOneEntry: t('nodeGraph.hints.keepAtLeastOneEntry', {
        defaultValue: 'Current node must keep at least one mapping entry.',
      }),
      keepAtLeastOneBinding: t('nodeGraph.hints.keepAtLeastOneBinding', {
        defaultValue: 'Subflow bindings must keep at least one entry.',
      }),
      keepAtLeastOneGraph: t('nodeGraph.hints.keepAtLeastOneGraph', {
        defaultValue: 'Keep at least one graph.',
      }),
    }),
    [t]
  );
  const validationText = useMemo<NodeValidationText>(
    () => ({
      playAnimationRequired: t('nodeGraph.validation.playAnimationRequired', {
        defaultValue: 'targetId and timelineName are required.',
      }),
      scrollToSelectorRequired: t('nodeGraph.validation.scrollToSelector', {
        defaultValue: 'selector target mode requires selector.',
      }),
      focusControlSelectorRequired: t('nodeGraph.validation.focusSelector', {
        defaultValue: 'selector is required.',
      }),
      validateSchemaOrRulesRequired: t(
        'nodeGraph.validation.validateSchemaOrRules',
        {
          defaultValue:
            'Configure schema or provide rules from in.data.rules input.',
        }
      ),
      envVarKeyRequired: t('nodeGraph.validation.envVarKeyRequired', {
        defaultValue: 'key is required.',
      }),
    }),
    [t]
  );
  const localizeNodeLabel = useCallback(
    (node: Node<GraphNodeData>): Node<GraphNodeData> => ({
      ...node,
      data: {
        ...node.data,
        label: resolveCatalogNodeLabel(node.data.kind, node.data.label),
      },
    }),
    [resolveCatalogNodeLabel]
  );

  return {
    connectionHintTextByReason,
    hintText,
    localizedNodeMenuGroups,
    localizeNodeLabel,
    validationText,
  };
};

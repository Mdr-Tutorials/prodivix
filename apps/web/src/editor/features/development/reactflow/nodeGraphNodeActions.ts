import { useCallback, type Dispatch, type SetStateAction } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { createNodeGraphExecutorCodeSlotId } from '@prodivix/nodegraph';
import type { GraphNodeData, GraphNodeKind } from './GraphNode';
import {
  type ConnectionValidationReason,
  validateConnectionWithState,
} from './graphConnectionValidation';
import { normalizeHandleId, parseHandleInfo } from './graphPortUtils';
import {
  clampNumber,
  createNode,
  createNodeId,
  getDefaultHandleForNode,
  resolveGroupBodyBounds,
  resolveGroupBoxSize,
  resolveNodeSize,
  type ContextMenuState,
} from './nodeGraphEditorModel';

type GroupAutoLayoutById = Map<
  string,
  { x: number; y: number; width: number; height: number }
>;

type UseNodeGraphNodeActionsParams = {
  closeMenu: () => void;
  connectionHintTextByReason: Record<ConnectionValidationReason, string>;
  createLocalizedNode: (
    kind: GraphNodeKind,
    position: { x: number; y: number }
  ) => Node<GraphNodeData>;
  groupAutoLayoutById: GroupAutoLayoutById;
  hintText: {
    invalidPortHandle: string;
    noMatchingInput: string;
    noMatchingOutput: string;
  };
  menu: ContextMenuState;
  documentId?: string;
  nodes: Node<GraphNodeData>[];
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  setHint: Dispatch<SetStateAction<string | null>>;
  setNodes: Dispatch<SetStateAction<Node<GraphNodeData>[]>>;
};

export const useNodeGraphNodeActions = ({
  closeMenu,
  connectionHintTextByReason,
  createLocalizedNode,
  groupAutoLayoutById,
  hintText,
  menu,
  documentId,
  nodes,
  setEdges,
  setHint,
  setNodes,
}: UseNodeGraphNodeActionsParams) => {
  const createNodeFromCanvas = useCallback(
    (kind: GraphNodeKind) => {
      if (!menu || menu.kind !== 'canvas') return;
      setNodes((current) => [
        ...current,
        createLocalizedNode(kind, { x: menu.flowX, y: menu.flowY }),
      ]);
      closeMenu();
    },
    [closeMenu, createLocalizedNode, menu, setNodes]
  );

  const createNodeFromGroupBox = useCallback(
    (kind: GraphNodeKind) => {
      if (!menu || menu.kind !== 'node') return;
      const groupNode = nodes.find(
        (node) => node.id === menu.nodeId && node.data.kind === 'groupBox'
      );
      if (!groupNode) return;
      const groupLayout = groupAutoLayoutById.get(groupNode.id) ?? {
        width: resolveGroupBoxSize(groupNode.data).width,
        height: resolveGroupBoxSize(groupNode.data).height,
      };
      const groupBodyBounds = resolveGroupBodyBounds(groupNode, groupLayout);
      const draftNode = createNode(kind, {
        x: menu.flowX,
        y: menu.flowY,
      });
      const draftSize = resolveNodeSize(draftNode);
      const x = clampNumber(
        menu.flowX,
        groupBodyBounds.left + 8,
        Math.max(
          groupBodyBounds.left + 8,
          groupBodyBounds.right - draftSize.width
        )
      );
      const y = clampNumber(
        menu.flowY,
        groupBodyBounds.top + 8,
        Math.max(
          groupBodyBounds.top + 8,
          groupBodyBounds.bottom - draftSize.height
        )
      );
      const createdNode = createLocalizedNode(kind, { x, y });
      if (createdNode.data.kind !== 'groupBox') {
        createdNode.data.groupBoxId = groupNode.id;
      }
      setNodes((current) => [...current, createdNode]);
      closeMenu();
    },
    [closeMenu, createLocalizedNode, groupAutoLayoutById, menu, nodes, setNodes]
  );

  const updateNodeColorTheme = useCallback(
    (nodeId: string, color: string) => {
      setNodes((current) =>
        current.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  color,
                },
              }
            : node
        )
      );
      closeMenu();
    },
    [closeMenu, setNodes]
  );

  const deleteNode = useCallback(() => {
    if (!menu || menu.kind !== 'node') return;
    setNodes((current) => current.filter((node) => node.id !== menu.nodeId));
    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== menu.nodeId && edge.target !== menu.nodeId
      )
    );
    closeMenu();
  }, [closeMenu, menu, setEdges, setNodes]);

  const duplicateNode = useCallback(() => {
    if (!menu || menu.kind !== 'node') return;
    setNodes((current) => {
      const target = current.find((node) => node.id === menu.nodeId);
      if (!target) return current;
      const copyId = createNodeId();
      const copy = {
        ...target,
        id: copyId,
        position: { x: target.position.x + 36, y: target.position.y + 36 },
        data: target.data.executor
          ? {
              ...target.data,
              executor: {
                ...target.data.executor,
                slotId: documentId
                  ? createNodeGraphExecutorCodeSlotId(documentId, copyId)
                  : `${target.data.executor.slotId}:copy:${copyId}`,
              },
            }
          : target.data,
      };
      return [...current, copy];
    });
    closeMenu();
  }, [closeMenu, documentId, menu, setNodes]);

  const detachNodeFromBox = useCallback(() => {
    if (!menu || menu.kind !== 'node') return;
    setNodes((current) =>
      current.map((node) => {
        if (node.id !== menu.nodeId || node.data.kind === 'groupBox')
          return node;
        if (!node.data.groupBoxId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            groupBoxId: undefined,
          },
        };
      })
    );
    closeMenu();
  }, [closeMenu, menu, setNodes]);

  const disconnectPort = useCallback(() => {
    if (!menu || menu.kind !== 'port') return;
    const handleId = normalizeHandleId(menu.handleId) ?? menu.handleId;
    setEdges((current) =>
      current.filter((edge) =>
        menu.role === 'source'
          ? !(edge.source === menu.nodeId && edge.sourceHandle === handleId)
          : !(edge.target === menu.nodeId && edge.targetHandle === handleId)
      )
    );
    closeMenu();
  }, [closeMenu, menu, setEdges]);

  const createNodeFromPort = useCallback(
    (kind: GraphNodeKind) => {
      if (!menu || menu.kind !== 'port') return;
      const sourceNode = nodes.find((node) => node.id === menu.nodeId);
      if (!sourceNode) return;
      const normalizedHandleId = normalizeHandleId(menu.handleId);
      const handleInfo = parseHandleInfo(normalizedHandleId);
      if (!handleInfo) {
        setHint(hintText.invalidPortHandle);
        closeMenu();
        return;
      }
      const xOffset = menu.role === 'source' ? 260 : -260;
      const newNode = createLocalizedNode(kind, {
        x: sourceNode.position.x + xOffset,
        y: sourceNode.position.y + 24,
      });
      setNodes((current) => [...current, newNode]);
      setEdges((current) => {
        const next = [...current];
        const sourceHandleId = normalizedHandleId;
        if (menu.role === 'source') {
          const targetHandle = getDefaultHandleForNode(
            newNode,
            'in',
            handleInfo.semantic
          );
          if (!targetHandle || !sourceHandleId) {
            setHint(hintText.noMatchingInput);
            return next;
          }
          const connection = {
            source: menu.nodeId,
            sourceHandle: sourceHandleId,
            target: newNode.id,
            targetHandle,
          };
          const validation = validateConnectionWithState(
            connection,
            [...nodes, newNode],
            current
          );
          if (!validation.valid) {
            const reason =
              'reason' in validation ? validation.reason : 'invalid-handle';
            setHint(connectionHintTextByReason[reason]);
            return next;
          }
          next.push({
            id: `e-${createNodeId()}`,
            ...connection,
            type: 'smoothstep',
          });
        } else {
          const sourceHandle = getDefaultHandleForNode(
            newNode,
            'out',
            handleInfo.semantic
          );
          if (!sourceHandle || !sourceHandleId) {
            setHint(hintText.noMatchingOutput);
            return next;
          }
          const connection = {
            source: newNode.id,
            sourceHandle,
            target: menu.nodeId,
            targetHandle: sourceHandleId,
          };
          const validation = validateConnectionWithState(
            connection,
            [...nodes, newNode],
            current
          );
          if (!validation.valid) {
            const reason =
              'reason' in validation ? validation.reason : 'invalid-handle';
            setHint(connectionHintTextByReason[reason]);
            return next;
          }
          next.push({
            id: `e-${createNodeId()}`,
            ...connection,
            type: 'smoothstep',
          });
        }
        return next;
      });
      closeMenu();
    },
    [
      closeMenu,
      connectionHintTextByReason,
      createLocalizedNode,
      hintText.invalidPortHandle,
      hintText.noMatchingInput,
      hintText.noMatchingOutput,
      menu,
      nodes,
      setEdges,
      setHint,
      setNodes,
    ]
  );

  return {
    createNodeFromCanvas,
    createNodeFromGroupBox,
    createNodeFromPort,
    deleteNode,
    detachNodeFromBox,
    disconnectPort,
    duplicateNode,
    updateNodeColorTheme,
  };
};

import type { Edge, Node } from '@xyflow/react';
import type { GraphNodeData } from './graphNodeShared';
import { normalizePersistedEdge } from './graphNodePersistence';
import { isPlainObject } from './nodeGraphEditorUtils';
import type {
  GraphDocument,
  NodeGraphEditorGraphState,
  NodeGraphEditorNodeState,
  NodeGraphEditorPirState,
  PirLogicGraphDocument,
  ProjectGraphSnapshot,
} from './nodeGraphEditorTypes';

const normalizeGraphId = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const EDITOR_ONLY_NODE_DATA_FIELDS: Array<keyof GraphNodeData> = [
  'collapsed',
  'validationMessage',
  'autoBoxWidth',
  'autoBoxHeight',
  'autoNoteWidth',
  'autoNoteHeight',
];

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeNodeGraphEditorNodeState = (
  source: unknown
): NodeGraphEditorNodeState | null => {
  if (!isPlainObject(source)) return null;
  const id = normalizeGraphId(source.id);
  if (!id) return null;
  if (!isFiniteNumber(source.x) || !isFiniteNumber(source.y)) return null;
  const normalized: NodeGraphEditorNodeState = {
    id,
    x: source.x,
    y: source.y,
  };
  if (isFiniteNumber(source.width) && source.width > 0) {
    normalized.width = source.width;
  }
  if (isFiniteNumber(source.height) && source.height > 0) {
    normalized.height = source.height;
  }
  if (typeof source.parentId === 'string' && source.parentId.trim()) {
    normalized.parentId = source.parentId.trim();
  }
  if (source.extent === 'parent') {
    normalized.extent = 'parent';
  }
  if (isFiniteNumber(source.zIndex)) {
    normalized.zIndex = source.zIndex;
  }
  if (typeof source.collapsed === 'boolean') {
    normalized.collapsed = source.collapsed;
  }
  return normalized;
};

const normalizeNodeGraphEditorGraphState = (
  source: unknown
): NodeGraphEditorGraphState | null => {
  if (!isPlainObject(source)) return null;
  const id = normalizeGraphId(source.id);
  if (!id) return null;
  const rawNodes = Array.isArray(source.nodes) ? source.nodes : [];
  const usedNodeIds = new Set<string>();
  const nodes: NodeGraphEditorNodeState[] = [];
  rawNodes.forEach((node) => {
    const normalizedNode = normalizeNodeGraphEditorNodeState(node);
    if (!normalizedNode) return;
    if (usedNodeIds.has(normalizedNode.id)) return;
    usedNodeIds.add(normalizedNode.id);
    nodes.push(normalizedNode);
  });
  return {
    id,
    nodes,
  };
};

export const normalizeNodeGraphEditorState = (
  source: unknown
): NodeGraphEditorPirState | null => {
  if (!isPlainObject(source)) return null;
  const rawGraphs = Array.isArray(source.graphs) ? source.graphs : [];
  const usedGraphIds = new Set<string>();
  const graphs: NodeGraphEditorGraphState[] = [];
  rawGraphs.forEach((graph) => {
    const normalizedGraph = normalizeNodeGraphEditorGraphState(graph);
    if (!normalizedGraph) return;
    if (usedGraphIds.has(normalizedGraph.id)) return;
    usedGraphIds.add(normalizedGraph.id);
    graphs.push(normalizedGraph);
  });
  const activeGraphId = normalizeGraphId(source.activeGraphId);
  if (!graphs.length && !activeGraphId) return null;
  return {
    version: 1,
    activeGraphId: activeGraphId || undefined,
    graphs,
  };
};

const createFallbackPosition = (index: number) => ({
  x: (index % 4) * 220,
  y: Math.floor(index / 4) * 140,
});

const resolvePositionFromNodeState = (
  node: Node<GraphNodeData>,
  nodeState: NodeGraphEditorNodeState | undefined,
  nodeIndex: number
) => {
  if (nodeState) {
    return {
      x: nodeState.x,
      y: nodeState.y,
    };
  }
  if (isFiniteNumber(node.position?.x) && isFiniteNumber(node.position?.y)) {
    return {
      x: node.position.x,
      y: node.position.y,
    };
  }
  return createFallbackPosition(nodeIndex);
};

export const applyNodeGraphEditorStateToGraphs = (
  graphs: GraphDocument[],
  editorState: NodeGraphEditorPirState | null
): GraphDocument[] => {
  if (!editorState?.graphs.length) return graphs;
  const graphStateById = new Map<string, NodeGraphEditorGraphState>();
  editorState.graphs.forEach((graphState) => {
    graphStateById.set(graphState.id, graphState);
  });
  return graphs.map((graph) => {
    const graphState = graphStateById.get(graph.id);
    if (!graphState) return graph;
    const nodeStateById = new Map<string, NodeGraphEditorNodeState>();
    graphState.nodes.forEach((nodeState) => {
      nodeStateById.set(nodeState.id, nodeState);
    });
    const nextNodes = graph.nodes.map((node, nodeIndex) => {
      const nodeState = nodeStateById.get(node.id);
      const nextData = { ...node.data };
      if (typeof nodeState?.collapsed === 'boolean') {
        nextData.collapsed = nodeState.collapsed;
      }
      return {
        ...node,
        position: resolvePositionFromNodeState(node, nodeState, nodeIndex),
        parentId: nodeState?.parentId ?? node.parentId,
        extent: nodeState?.extent ?? node.extent,
        zIndex: nodeState?.zIndex ?? node.zIndex,
        data: nextData,
      };
    });
    return {
      ...graph,
      nodes: nextNodes,
    };
  });
};

const stripEditorOnlyDataFields = (data: GraphNodeData): GraphNodeData => {
  const nextData: GraphNodeData = { ...data };
  EDITOR_ONLY_NODE_DATA_FIELDS.forEach((field) => {
    delete nextData[field];
  });
  return nextData;
};

export const serializeGraphsForPirLogic = (
  graphs: GraphDocument[]
): PirLogicGraphDocument[] =>
  graphs.map((graph) => ({
    id: graph.id,
    name: graph.name,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      type:
        typeof node.type === 'string' && node.type.trim()
          ? node.type
          : 'graphNode',
      data: stripEditorOnlyDataFields(node.data),
    })),
    edges: graph.edges.map(normalizePersistedEdge),
  }));

const normalizeCoordinate = (value: unknown) =>
  isFiniteNumber(value) ? value : 0;

export const buildNodeGraphEditorState = (
  snapshot: ProjectGraphSnapshot
): NodeGraphEditorPirState => ({
  version: 1,
  activeGraphId: snapshot.activeGraphId,
  graphs: snapshot.graphs.map((graph) => ({
    id: graph.id,
    nodes: graph.nodes.map((node) => {
      const collapsed =
        typeof node.data.collapsed === 'boolean' ? node.data.collapsed : false;
      return {
        id: node.id,
        x: normalizeCoordinate(node.position?.x),
        y: normalizeCoordinate(node.position?.y),
        parentId:
          typeof node.parentId === 'string' && node.parentId.trim()
            ? node.parentId
            : undefined,
        extent: node.extent === 'parent' ? 'parent' : undefined,
        zIndex: isFiniteNumber(node.zIndex) ? node.zIndex : undefined,
        collapsed: collapsed || undefined,
      };
    }),
  })),
});

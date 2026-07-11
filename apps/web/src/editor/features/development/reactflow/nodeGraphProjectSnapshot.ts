import type { Edge, Node } from '@xyflow/react';
import { normalizeCases, type GraphNodeData } from './graphNodeShared';
import {
  normalizePersistedEdge,
  normalizePersistedNode,
} from './graphNodePersistence';
import { DEFAULT_GRAPH_NAME } from './nodeGraphEditorConstants';
import { createGraphId, isPlainObject } from './nodeGraphEditorUtils';
import { createNode } from './nodeGraphEditorModel';
import type {
  GraphDocument,
  ProjectGraphSnapshot,
} from './nodeGraphEditorTypes';

const createInitialNodes = (): Node<GraphNodeData>[] => [
  createNode('start', { x: 100, y: 180 }),
  createNode('switch', { x: 380, y: 120 }),
  createNode('process', { x: 720, y: 120 }),
  createNode('end', { x: 980, y: 250 }),
];

const createInitialEdges = (nodes: Node<GraphNodeData>[]): Edge[] => [
  {
    id: 'e-initial-1',
    source: nodes[0].id,
    sourceHandle: 'out.control.next',
    target: nodes[1].id,
    targetHandle: 'in.control.prev',
    type: 'smoothstep',
  },
  (() => {
    const switchCases = normalizeCases(nodes[1].data.cases);
    return {
      id: 'e-initial-2',
      source: nodes[1].id,
      sourceHandle: switchCases.length
        ? `out.control.case-${switchCases[0].id}`
        : 'out.control.default',
      target: nodes[2].id,
      targetHandle: 'in.control.prev',
      type: 'smoothstep',
    };
  })(),
  {
    id: 'e-initial-3',
    source: nodes[2].id,
    sourceHandle: 'out.control.next',
    target: nodes[3].id,
    targetHandle: 'in.control.prev',
    type: 'smoothstep',
  },
];

export const createStarterGraph = (name: string): GraphDocument => {
  const nodes = createInitialNodes();
  return {
    id: createGraphId(),
    name,
    nodes,
    edges: createInitialEdges(nodes),
  };
};

type NormalizeGraphDocumentsOptions = {
  createFallbackWhenEmpty?: boolean;
  fallbackGraphName?: string;
};

const normalizeGraphId = (value: unknown) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const normalizeGraphName = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
};

export const normalizeGraphDocuments = (
  source: unknown,
  options: NormalizeGraphDocumentsOptions = {}
): GraphDocument[] => {
  const {
    createFallbackWhenEmpty = false,
    fallbackGraphName = DEFAULT_GRAPH_NAME,
  } = options;
  const inputGraphs = Array.isArray(source) ? source : [];
  const normalized: GraphDocument[] = [];
  const usedIds = new Set<string>();
  inputGraphs.forEach((entry, index) => {
    let graphId = '';
    let graphName = '';
    let nodes: Node<GraphNodeData>[] = [];
    let edges: Edge[] = [];
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (!trimmed) return;
      graphId = trimmed;
      graphName = trimmed;
    } else if (isPlainObject(entry)) {
      graphId = normalizeGraphId(entry.id);
      graphName = normalizeGraphName(
        entry.name,
        graphId || `graph-${index + 1}`
      );
      nodes = Array.isArray(entry.nodes)
        ? entry.nodes
            .map((node, nodeIndex) =>
              isPlainObject(node)
                ? normalizePersistedNode(
                    node as unknown as Node<GraphNodeData>,
                    nodeIndex
                  )
                : null
            )
            .filter((node): node is Node<GraphNodeData> => Boolean(node))
        : [];
      edges = Array.isArray(entry.edges)
        ? entry.edges
            .map((edge) =>
              isPlainObject(edge)
                ? normalizePersistedEdge(edge as unknown as Edge)
                : null
            )
            .filter((edge): edge is Edge => Boolean(edge))
        : [];
    } else {
      return;
    }
    if (!graphId || usedIds.has(graphId)) {
      do {
        graphId = createGraphId();
      } while (usedIds.has(graphId));
    }
    usedIds.add(graphId);
    normalized.push({
      id: graphId,
      name: normalizeGraphName(graphName, graphId),
      nodes,
      edges,
    });
  });
  if (!normalized.length && createFallbackWhenEmpty) {
    return [createStarterGraph(fallbackGraphName)];
  }
  return normalized;
};

export const ensureProjectGraphSnapshot = (
  source: unknown,
  options: NormalizeGraphDocumentsOptions = {}
): ProjectGraphSnapshot => {
  const normalizedGraphs = normalizeGraphDocuments(
    isPlainObject(source) ? source.graphs : undefined,
    {
      ...options,
      createFallbackWhenEmpty: true,
    }
  );
  const rawActiveGraphId = isPlainObject(source)
    ? normalizeGraphId(source.activeGraphId)
    : '';
  const activeGraphId = normalizedGraphs.some(
    (graph) => graph.id === rawActiveGraphId
  )
    ? rawActiveGraphId
    : normalizedGraphs[0].id;
  return {
    version: 2,
    activeGraphId,
    graphs: normalizedGraphs,
  };
};

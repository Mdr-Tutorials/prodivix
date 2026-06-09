import type { Edge, Node } from '@xyflow/react';
import type { GraphNodeData } from './graphNodeShared';

export type ContextMenuState =
  | null
  | { kind: 'canvas'; x: number; y: number; flowX: number; flowY: number }
  | {
      kind: 'node';
      x: number;
      y: number;
      nodeId: string;
      flowX: number;
      flowY: number;
    }
  | {
      kind: 'port';
      x: number;
      y: number;
      nodeId: string;
      handleId: string;
      role: 'source' | 'target';
    };

export type ContextMenuItem = {
  id: string;
  label: string;
  icon?: string;
  onSelect?: () => void;
  children?: ContextMenuItem[];
  tone?: 'default' | 'danger';
};

export type GraphDocument = {
  id: string;
  name: string;
  nodes: Node<GraphNodeData>[];
  edges: Edge[];
};

export type ProjectGraphSnapshot = {
  version: 2;
  activeGraphId: string;
  graphs: GraphDocument[];
};

export type PirLogicGraphNode = {
  id: string;
  type: string;
  data: GraphNodeData;
};

export type PirLogicGraphDocument = {
  id: string;
  name: string;
  nodes: PirLogicGraphNode[];
  edges: Edge[];
};

export type NodeGraphEditorNodeState = {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  parentId?: string;
  extent?: 'parent';
  zIndex?: number;
  collapsed?: boolean;
};

export type NodeGraphEditorGraphState = {
  id: string;
  nodes: NodeGraphEditorNodeState[];
};

export type NodeGraphEditorPirState = {
  version: 1;
  activeGraphId?: string;
  graphs: NodeGraphEditorGraphState[];
};

export type NodeValidationText = {
  playAnimationRequired: string;
  scrollToSelectorRequired: string;
  focusControlSelectorRequired: string;
  validateSchemaOrRulesRequired: string;
  envVarKeyRequired: string;
};

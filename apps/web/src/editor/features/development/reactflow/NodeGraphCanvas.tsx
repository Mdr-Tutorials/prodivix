import {
  Background,
  ConnectionMode,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Edge,
  type IsValidConnection,
  type Node,
  type OnConnect,
  type OnConnectEnd,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnNodesChange,
} from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import type { ContextMenuState } from './nodeGraphEditorModel';
import { nodeTypes } from './nodeGraphNodeTypes';
import { NodeGraphViewportControls } from './NodeGraphViewportControls';
import type { NodeGraphTranslate } from './nodeGraphI18nTypes';

type NodeGraphCanvasProps = {
  colorMode: 'light' | 'dark';
  edges: Edge[];
  flowNodes: Node<GraphNodeData>[];
  invalidConnectEndHint: string;
  isValidConnection: IsValidConnection;
  onConnect: OnConnect;
  onEdgesChange: OnEdgesChange<Edge>;
  onNodeDragStop: OnNodeDrag<Node<GraphNodeData>>;
  onNodesChange: OnNodesChange<Node<GraphNodeData>>;
  setHint: (hint: string) => void;
  setMenu: (menu: ContextMenuState) => void;
  t: NodeGraphTranslate;
};

export const NodeGraphCanvas = ({
  colorMode,
  edges,
  flowNodes,
  invalidConnectEndHint,
  isValidConnection,
  onConnect,
  onEdgesChange,
  onNodeDragStop,
  onNodesChange,
  setHint,
  setMenu,
  t,
}: NodeGraphCanvasProps) => {
  const reactFlow = useReactFlow<Node<GraphNodeData>, Edge>();
  const handleConnectEnd: OnConnectEnd = (_, state) => {
    if (!state?.isValid) {
      setHint(invalidConnectEndHint);
    }
  };

  return (
    <ReactFlow<Node<GraphNodeData>, Edge>
      nodes={flowNodes}
      edges={edges}
      elevateNodesOnSelect={false}
      onNodesChange={onNodesChange}
      onNodeDragStop={onNodeDragStop}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      isValidConnection={isValidConnection}
      nodeTypes={nodeTypes}
      nodesConnectable
      edgesReconnectable
      nodesDraggable
      fitView
      minZoom={0.4}
      maxZoom={2}
      connectionMode={ConnectionMode.Strict}
      colorMode={colorMode}
      className="nodegraph-native-canvas"
      proOptions={{ hideAttribution: true }}
      onPaneContextMenu={(event) => {
        event.preventDefault();
        const flowPos = reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        setMenu({
          kind: 'canvas',
          x: event.clientX,
          y: event.clientY,
          flowX: flowPos.x,
          flowY: flowPos.y,
        });
      }}
      onNodeContextMenu={(event, node) => {
        event.preventDefault();
        const flowPos = reactFlow.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        setMenu({
          kind: 'node',
          x: event.clientX,
          y: event.clientY,
          nodeId: node.id,
          flowX: flowPos.x,
          flowY: flowPos.y,
        });
      }}
      onConnectEnd={handleConnectEnd}
    >
      <Background
        gap={20}
        size={1}
        color={
          colorMode === 'dark'
            ? 'rgb(255 255 255 / 0.14)'
            : 'rgb(15 23 42 / 0.18)'
        }
      />
      <MiniMap pannable zoomable />
      <NodeGraphViewportControls t={t} />
    </ReactFlow>
  );
};

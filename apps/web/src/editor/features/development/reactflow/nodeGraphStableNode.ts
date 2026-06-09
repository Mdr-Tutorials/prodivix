import type { Node } from '@xyflow/react';
import type { GraphNodeData } from './GraphNode';
import { resolveNodeSize } from './nodeGraphEditorModel';

export const serializeNodes = (nodes: Node<GraphNodeData>[]) =>
  JSON.stringify(nodes);

export const toStableGraphNode = (
  node: Node<GraphNodeData>
): Node<GraphNodeData> => {
  const nodeSize = resolveNodeSize(node);
  const isAnnotationNode =
    node.data.kind === 'groupBox' || node.data.kind === 'stickyNote';
  const isMinimalStickyNote =
    node.data.kind === 'stickyNote' &&
    (node.data.color ?? 'minimal') === 'minimal';
  const className = [
    node.className,
    node.data.kind === 'stickyNote' ? 'nodegraph-node-sticky-note' : '',
    isMinimalStickyNote ? 'nodegraph-node-sticky-note-minimal' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const stableNode: Node<GraphNodeData> = {
    id: node.id,
    type:
      typeof node.type === 'string' && node.type.trim()
        ? node.type
        : 'graphNode',
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
    },
    data: { ...node.data },
    initialWidth: nodeSize.width,
    initialHeight: nodeSize.height,
    className: className || undefined,
    style: isAnnotationNode
      ? {
          background: 'transparent',
          boxShadow: 'none',
          border: 'none',
          borderRadius: 0,
        }
      : node.style,
    zIndex: node.data.kind === 'groupBox' ? -10 : 10,
  };
  if (typeof node.parentId === 'string' && node.parentId.trim()) {
    stableNode.parentId = node.parentId;
  }
  if (node.extent === 'parent') {
    stableNode.extent = 'parent';
  }
  if (typeof node.zIndex === 'number' && Number.isFinite(node.zIndex)) {
    stableNode.zIndex = node.zIndex;
  }
  return stableNode;
};

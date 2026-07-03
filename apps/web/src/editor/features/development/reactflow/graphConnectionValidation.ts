import type { Connection, Edge, Node } from '@xyflow/react';
import type { GraphNodeData } from './graphNodeShared';
import {
  isMultiHandle,
  normalizeHandleId,
  parseHandleInfo,
} from './graphPortUtils';

export type ConnectionValidationReason =
  | 'missing-endpoint'
  | 'invalid-handle'
  | 'wrong-direction'
  | 'semantic-mismatch'
  | 'node-not-found'
  | 'source-occupied'
  | 'target-occupied';

export type ConnectionValidationResult =
  { valid: true } | { valid: false; reason: ConnectionValidationReason };

export const CONNECTION_HINT_BY_REASON: Record<
  ConnectionValidationReason,
  string
> = {
  'missing-endpoint': '连接无效：缺少起点或终点。',
  'invalid-handle': '连接无效：端口标识无法识别。',
  'wrong-direction': '连接无效：只能从输出端口连接到输入端口。',
  'semantic-mismatch': '连接无效：端口语义不匹配。',
  'node-not-found': '连接无效：节点状态已变化，请重试。',
  'source-occupied': '连接无效：该输出端口是单接口，已被占用。',
  'target-occupied': '连接无效：该输入端口是单接口，已被占用。',
};

export const validateConnectionWithState = (
  connection: Pick<
    Connection,
    'source' | 'target' | 'sourceHandle' | 'targetHandle'
  >,
  nodesSnapshot: Node<GraphNodeData>[],
  edgesSnapshot: Edge[]
): ConnectionValidationResult => {
  if (!connection.source || !connection.target) {
    return { valid: false, reason: 'missing-endpoint' };
  }
  const sourceHandleId = normalizeHandleId(connection.sourceHandle);
  const targetHandleId = normalizeHandleId(connection.targetHandle);
  const sourceInfo = parseHandleInfo(sourceHandleId);
  const targetInfo = parseHandleInfo(targetHandleId);
  if (!sourceInfo || !targetInfo) {
    return { valid: false, reason: 'invalid-handle' };
  }
  if (sourceInfo.role !== 'out' || targetInfo.role !== 'in') {
    return { valid: false, reason: 'wrong-direction' };
  }
  if (sourceInfo.semantic !== targetInfo.semantic) {
    return { valid: false, reason: 'semantic-mismatch' };
  }

  const sourceNode = nodesSnapshot.find(
    (node) => node.id === connection.source
  );
  const targetNode = nodesSnapshot.find(
    (node) => node.id === connection.target
  );
  if (!sourceNode || !targetNode || !sourceHandleId || !targetHandleId) {
    return { valid: false, reason: 'node-not-found' };
  }

  const sourceUsed = edgesSnapshot.some(
    (edge) =>
      edge.source === connection.source &&
      edge.sourceHandle === sourceHandleId &&
      !(
        edge.target === connection.target &&
        edge.targetHandle === targetHandleId
      )
  );
  if (!isMultiHandle(sourceHandleId) && sourceUsed) {
    return { valid: false, reason: 'source-occupied' };
  }

  const targetUsed = edgesSnapshot.some(
    (edge) =>
      edge.target === connection.target &&
      edge.targetHandle === targetHandleId &&
      !(
        edge.source === connection.source &&
        edge.sourceHandle === sourceHandleId
      )
  );
  if (!isMultiHandle(targetHandleId) && targetUsed) {
    return { valid: false, reason: 'target-occupied' };
  }

  return { valid: true };
};

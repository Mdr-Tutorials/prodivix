import type { CodeResourceNode } from './codeTree';
import { resolveTemplateByCodeKind } from './codeResourceModel';

const collectNodeIds = (node: CodeResourceNode) => {
  const ids = new Set<string>();
  const walk = (current: CodeResourceNode) => {
    ids.add(current.id);
    (current.children ?? []).forEach(walk);
  };
  walk(node);
  return ids;
};

export const resolveCreatedNodeId = (
  before: CodeResourceNode,
  after: CodeResourceNode
) => {
  const beforeIds = collectNodeIds(before);
  let createdId: string | null = null;
  const walk = (current: CodeResourceNode) => {
    if (createdId) return;
    if (!beforeIds.has(current.id)) {
      createdId = current.id;
      return;
    }
    (current.children ?? []).forEach(walk);
  };
  walk(after);
  return createdId;
};

export const createTemplateForCodeFolder = (
  folder: 'scripts' | 'styles' | 'shaders'
) => {
  if (folder === 'styles') return resolveTemplateByCodeKind('css');
  if (folder === 'shaders') return resolveTemplateByCodeKind('glsl');
  return resolveTemplateByCodeKind('ts');
};

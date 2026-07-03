import type { PublicResourceNode } from './publicTree';

export type PublicFileKind = 'text' | 'json' | 'svg';

export const getResourceManagerPublicSelectionStorageKey = (
  projectId?: string
) =>
  `prodivix.resourceManager.public.selection.${projectId?.trim() || 'default'}`;

export const formatPublicResourceBytes = (value?: number) => {
  if (!value || value <= 0) return '0 B';
  if (value > 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value > 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${value} B`;
};

export const isSvgFileNode = (node?: PublicResourceNode) =>
  Boolean(node?.type === 'file' && node.mime?.includes('svg'));

export const isTextLikeNode = (node?: PublicResourceNode) =>
  Boolean(
    node?.type === 'file' &&
    (node.mime?.startsWith('text/') ||
      node.mime?.includes('json') ||
      node.mime?.includes('svg'))
  );

export const getDefaultPublicFileTemplate = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.json')) {
    return {
      mime: 'application/json',
      content: '{\n  "name": "resource"\n}\n',
    };
  }
  if (lower.endsWith('.svg')) {
    return {
      mime: 'image/svg+xml',
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="48" fill="#111"/>\n</svg>\n',
    };
  }
  return { mime: 'text/plain', content: 'new file\n' };
};

export const createPublicTemplateByKind = (kind: PublicFileKind) => {
  if (kind === 'json') {
    return {
      name: 'untitled.json',
      mime: 'application/json',
      content: '{\n}\n',
    };
  }
  if (kind === 'svg') {
    return {
      name: 'untitled.svg',
      mime: 'image/svg+xml',
      content:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="48" fill="#111"/>\n</svg>\n',
    };
  }
  return { name: 'untitled.txt', mime: 'text/plain', content: 'new file\n' };
};

const collectNodeIds = (node: PublicResourceNode): Set<string> => {
  const ids = new Set<string>();
  const walk = (current: PublicResourceNode) => {
    ids.add(current.id);
    (current.children ?? []).forEach(walk);
  };
  walk(node);
  return ids;
};

export const resolveCreatedPublicNodeId = (
  previousTree: PublicResourceNode,
  nextTree: PublicResourceNode
) => {
  const beforeIds = collectNodeIds(previousTree);
  let createdId: string | undefined;
  const walk = (current: PublicResourceNode) => {
    if (createdId) return;
    if (!beforeIds.has(current.id)) {
      createdId = current.id;
      return;
    }
    (current.children ?? []).forEach(walk);
  };
  walk(nextTree);
  return createdId;
};

export const shouldReadPublicFileText = (file: File) =>
  file.type.includes('text') ||
  file.type.includes('json') ||
  file.name.toLowerCase().endsWith('.svg');

import type { WorkspaceCodeDocumentContent } from './types';

export const isWorkspaceCodeDocumentContent = (
  content: unknown
): content is WorkspaceCodeDocumentContent => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return false;
  }

  const record = content as Record<string, unknown>;
  return (
    typeof record.language === 'string' && typeof record.source === 'string'
  );
};

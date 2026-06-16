import type {
  AuthoringContext,
  CodeArtifact,
  CodeArtifactProvider,
} from '@/authoring/authoring.types';
import type {
  StableWorkspaceDocument,
  StableWorkspaceSnapshot,
} from '@/workspace/types';
import { isWorkspaceCodeDocumentContent } from '@/workspace/workspaceCodeDocument';

const CODE_ARTIFACT_PROVIDER_ID = 'workspace-code-documents';

const toCodeArtifact = (
  document: StableWorkspaceDocument
): CodeArtifact | null => {
  if (
    document.type !== 'code' ||
    !isWorkspaceCodeDocumentContent(document.content)
  ) {
    return null;
  }

  return {
    id: document.id,
    path: document.path,
    language: document.content.language,
    owner: { kind: 'workspace-module', documentId: document.id },
    source: document.content.source,
    revision: String(document.contentRev),
  };
};

export const createWorkspaceCodeArtifactProvider = (
  snapshot: StableWorkspaceSnapshot
): CodeArtifactProvider => {
  const listAllArtifacts = (): CodeArtifact[] =>
    Object.values(snapshot.docsById)
      .map(toCodeArtifact)
      .filter((artifact): artifact is CodeArtifact => Boolean(artifact));

  return {
    id: CODE_ARTIFACT_PROVIDER_ID,
    source: { kind: 'workspace' },
    listArtifacts(context: AuthoringContext) {
      const artifacts = listAllArtifacts();
      if (!context.artifactId) return artifacts;
      return artifacts.filter((artifact) => artifact.id === context.artifactId);
    },
    getArtifact(id: string) {
      return listAllArtifacts().find((artifact) => artifact.id === id) ?? null;
    },
  };
};

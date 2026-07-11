export type WorkspaceLikeDocument = {
  id?: string;
  type?: string;
  path?: string;
};

/**
 * Resolves the PIR document that should drive an editor projection without
 * coupling the PIR package to Workspace wire shapes.
 */
export const resolveCanonicalWorkspaceDocumentId = (
  documents: WorkspaceLikeDocument[]
): string | undefined => {
  if (!documents.length) return undefined;

  const canonicalRootPage = documents.find(
    (document) =>
      document.type === 'pir-page' &&
      (document.path ?? '').trim() === '/pir.json'
  );
  if (canonicalRootPage?.id) return canonicalRootPage.id;

  const rootPage = documents.find(
    (document) =>
      document.type === 'pir-page' &&
      ((document.path ?? '').trim() === '/' ||
        (document.path ?? '').trim() === '')
  );
  if (rootPage?.id) return rootPage.id;

  return documents.find((document) => document.type === 'pir-page')?.id;
};

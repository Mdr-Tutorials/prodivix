/** Stable address of an operation owned by a Workspace data document. */
export type DataOperationReference = Readonly<{
  documentId: string;
  operationId: string;
}>;

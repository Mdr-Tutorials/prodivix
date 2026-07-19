import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  Braces,
  Database,
  ListChecks,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { useExecutionCenterNavigationStore } from '@/editor/features/execution';
import { useWorkspaceSemanticNavigationStore } from '@/editor/navigation';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { DataOpenApiImportPanel } from './DataOpenApiImportPanel';
import { DataManualAuthoringPanel } from './DataManualAuthoringPanel';
import { DataOperationTestPanel } from './DataOperationTestPanel';
import {
  buildDataResourceModel,
  type DataResourceDocumentView,
  type DataResourceOperationView,
} from './dataResourceModel';

const selectedDocumentFromModel = (
  documents: readonly DataResourceDocumentView[],
  documentId: string | undefined
): DataResourceDocumentView | undefined =>
  documents.find((document) => document.id === documentId) ?? documents[0];

export function DataResourcePage() {
  const { t } = useTranslation('editor');
  const { projectId } = useParams();
  const navigate = useNavigate();
  const workspace = useEditorStore((state) => state.workspace);
  const setActiveDocumentId = useEditorStore(
    (state) => state.setActiveDocumentId
  );
  const model = useMemo(() => buildDataResourceModel(workspace), [workspace]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>();
  const [selectedOperationId, setSelectedOperationId] = useState<string>();
  const navigationRequest = useWorkspaceSemanticNavigationStore(
    (state) => state.navigationRequest
  );
  const consumeNavigation = useWorkspaceSemanticNavigationStore(
    (state) => state.consumeNavigation
  );
  const selectedDocument = selectedDocumentFromModel(
    model.documents,
    selectedDocumentId
  );
  const selectedOperation =
    selectedDocument?.status === 'ready'
      ? (selectedDocument.operations.find(
          (operation) => operation.id === selectedOperationId
        ) ?? selectedDocument.operations[0])
      : undefined;

  useEffect(() => {
    if (!workspace) return;
    const activeDocumentId = workspace.activeDocumentId;
    const active = model.documents.find(
      (document) => document.id === activeDocumentId
    );
    if (active && active.id !== selectedDocumentId) {
      setSelectedDocumentId(active.id);
      setSelectedOperationId(
        active.status === 'ready' ? active.operations[0]?.id : undefined
      );
    } else if (!selectedDocument && model.documents[0]) {
      setSelectedDocumentId(model.documents[0].id);
    }
  }, [model.documents, selectedDocument, selectedDocumentId, workspace]);

  useEffect(() => {
    if (
      !navigationRequest ||
      !workspace ||
      navigationRequest.workspaceId !== workspace.id ||
      navigationRequest.location.kind !== 'diagnostic-target'
    ) {
      return;
    }
    const target = navigationRequest.location.targetRef;
    if (target.kind !== 'data-source' && target.kind !== 'data-operation')
      return;
    setSelectedDocumentId(target.documentId);
    setSelectedOperationId(
      target.kind === 'data-operation' ? target.operationId : undefined
    );
    setActiveDocumentId(target.documentId);
    consumeNavigation(navigationRequest.id);
  }, [consumeNavigation, navigationRequest, setActiveDocumentId, workspace]);

  const selectDocument = (document: DataResourceDocumentView) => {
    setSelectedDocumentId(document.id);
    setSelectedOperationId(
      document.status === 'ready' ? document.operations[0]?.id : undefined
    );
    setActiveDocumentId(document.id);
  };

  const selectOperation = (
    document: DataResourceDocumentView,
    operation: DataResourceOperationView
  ) => {
    setSelectedDocumentId(document.id);
    setSelectedOperationId(operation.id);
    setActiveDocumentId(document.id);
  };

  const openIssues = (documentId: string, operationId?: string) => {
    if (!projectId) return;
    const query = new URLSearchParams({ domain: 'data', documentId });
    if (operationId) query.set('operationId', operationId);
    navigate(`/editor/project/${projectId}/issues?${query.toString()}`);
  };

  const openNetwork = (documentId: string, operationId: string) => {
    if (!projectId || !workspace) return;
    useExecutionCenterNavigationStore.getState().openNetworkOperation({
      workspaceId: workspace.id,
      documentId,
      operationId,
    });
    navigate(`/editor/project/${projectId}/blueprint`);
  };

  return (
    <section className="grid gap-4">
      <article className="rounded-2xl border border-black/8 bg-(--bg-canvas) p-5">
        <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.12em] text-(--text-muted) uppercase">
          <Database size={14} />
          {t('resourceManager.data.header.badge')}
        </p>
        <h2 className="mt-2 text-base font-medium text-(--text-primary)">
          {t('resourceManager.data.header.title')}
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-(--text-secondary)">
          {t('resourceManager.data.header.description')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-(--text-secondary)">
          <span className="rounded-full border border-black/10 px-2.5 py-1">
            {t('resourceManager.data.summary.sources', {
              count: model.sourceCount,
            })}
          </span>
          <span className="rounded-full border border-black/10 px-2.5 py-1">
            {t('resourceManager.data.summary.operations', {
              count: model.operationCount,
            })}
          </span>
          <span className="rounded-full border border-black/10 px-2.5 py-1">
            {t('resourceManager.data.summary.invalid', {
              count: model.invalidCount,
            })}
          </span>
        </div>
      </article>

      <DataOpenApiImportPanel
        documents={model.documents}
        preferredDocumentId={selectedDocument?.id}
        onAdopted={(documentId) => {
          setSelectedDocumentId(documentId);
          setSelectedOperationId(undefined);
        }}
      />

      <DataManualAuthoringPanel
        documentId={selectedDocument?.id}
        operationId={selectedOperation?.id}
        onApplied={(documentId) => {
          setSelectedDocumentId(documentId);
          setActiveDocumentId(documentId);
        }}
      />

      <DataOperationTestPanel
        documentId={selectedDocument?.id}
        operationId={selectedOperation?.id}
      />

      <div className="grid min-h-96 gap-4 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.3fr)]">
        <article className="rounded-2xl border border-black/8 bg-(--bg-canvas) p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-(--text-muted) uppercase">
              <ListChecks size={14} />
              {t('resourceManager.data.documents.title')}
            </p>
            <span className="text-xs text-(--text-muted)">
              {model.documents.length}
            </span>
          </div>
          <div className="mt-3 grid gap-2">
            {model.documents.length ? (
              model.documents.map((document) => (
                <div
                  key={document.id}
                  className={`rounded-xl border p-2 ${selectedDocument?.id === document.id ? 'border-black/24 bg-black/[0.025]' : 'border-black/8'}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-start justify-between gap-2 text-left"
                    onClick={() => selectDocument(document)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-(--text-primary)">
                        {document.status === 'ready'
                          ? document.sourceName
                          : document.id}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-(--text-muted)">
                        {document.path}
                      </span>
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] ${document.status === 'ready' ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}
                    >
                      {t(`resourceManager.data.status.${document.status}`)}
                    </span>
                  </button>
                  {document.status === 'ready' && document.operations.length ? (
                    <div className="mt-2 grid gap-1 border-t border-black/6 pt-2">
                      {document.operations.map((operation) => (
                        <button
                          key={operation.id}
                          type="button"
                          className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${selectedOperation?.id === operation.id && selectedDocument?.id === document.id ? 'bg-black text-white' : 'text-(--text-secondary) hover:bg-black/[0.03]'}`}
                          onClick={() => selectOperation(document, operation)}
                        >
                          <span className="truncate">{operation.name}</span>
                          <span className="shrink-0 font-mono text-[10px] opacity-70">
                            {operation.method ?? operation.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-black/10 p-4 text-sm text-(--text-secondary)">
                {t('resourceManager.data.documents.empty')}
              </p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-black/8 bg-(--bg-canvas) p-5">
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-(--text-muted) uppercase">
            <Braces size={14} />
            {t('resourceManager.data.inspector.badge')}
          </p>
          {!selectedDocument ? (
            <p className="mt-4 text-sm text-(--text-secondary)">
              {t('resourceManager.data.inspector.empty')}
            </p>
          ) : selectedDocument.status === 'invalid' ? (
            <div className="mt-4 grid gap-3">
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                <span>{t('resourceManager.data.inspector.invalid')}</span>
              </div>
              {selectedDocument.issues.map((issue, index) => (
                <div
                  key={`${issue.path}:${index}`}
                  className="rounded-xl border border-black/8 p-3 text-xs"
                >
                  <strong>{issue.code}</strong>
                  <span className="ml-2 break-all text-(--text-muted)">
                    {issue.path}
                  </span>
                  <p className="mt-1 text-(--text-secondary)">
                    {issue.message}
                  </p>
                </div>
              ))}
              <button
                type="button"
                className="w-fit rounded-xl border border-black/10 px-3 py-2 text-xs"
                onClick={() => openIssues(selectedDocument.id)}
              >
                {t('resourceManager.data.actions.openIssues')}
              </button>
            </div>
          ) : selectedOperation ? (
            <div className="mt-4 grid gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-(--text-primary)">
                    {selectedOperation.name}
                  </h3>
                  <p className="mt-1 font-mono text-xs text-(--text-secondary)">
                    {selectedOperation.method ?? selectedOperation.kind}{' '}
                    {selectedOperation.path ?? selectedOperation.id}
                  </p>
                </div>
                <span className="rounded-full border border-black/10 px-2.5 py-1 text-xs text-(--text-secondary)">
                  {selectedDocument.runtimeZone}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  ['input', selectedOperation.inputSchemaId ?? '-'],
                  ['output', selectedOperation.outputSchemaId],
                  ['mappings', String(selectedOperation.mappingCount)],
                  ['policies', selectedOperation.policyIds.join(', ') || '-'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-black/8 p-3"
                  >
                    <p className="text-[10px] tracking-[0.08em] text-(--text-muted) uppercase">
                      {t(`resourceManager.data.inspector.${label}`)}
                    </p>
                    <p className="mt-1 text-xs break-all text-(--text-primary)">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
              {selectedOperation.authorizationBindingIds.length ? (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                  <span>
                    {t('resourceManager.data.inspector.authorization', {
                      bindings:
                        selectedOperation.authorizationBindingIds.join(', '),
                    })}
                  </span>
                </div>
              ) : null}
              {selectedDocument.provenance.length ? (
                <div className="rounded-xl border border-black/8 p-3 text-xs text-(--text-secondary)">
                  <p className="font-medium text-(--text-primary)">
                    {t('resourceManager.data.inspector.provenance')}
                  </p>
                  {selectedDocument.provenance.map((entry) => (
                    <p key={entry.id} className="mt-1 break-all">
                      {entry.kind} · {entry.externalDocumentId} ·{' '}
                      {entry.operationCount} operations
                    </p>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-black/10 px-3 py-2 text-xs text-(--text-primary) hover:bg-black/[0.02]"
                  onClick={() =>
                    openIssues(selectedDocument.id, selectedOperation.id)
                  }
                >
                  {t('resourceManager.data.actions.openIssues')}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs text-(--text-primary) hover:bg-black/[0.02]"
                  onClick={() =>
                    openNetwork(selectedDocument.id, selectedOperation.id)
                  }
                >
                  <Network size={13} />
                  {t('resourceManager.data.actions.openNetwork')}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-(--text-secondary)">
              {t('resourceManager.data.inspector.noOperation')}
            </p>
          )}
        </article>
      </div>
    </section>
  );
}

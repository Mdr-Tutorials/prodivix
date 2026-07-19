import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GitCompareArrows,
  ShieldCheck,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import type { DataOpenApiImportImpact } from '@prodivix/data-http';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { dispatchWorkspaceAuthoringOperation } from '@/editor/workspaceSync/workspaceAuthoringOperationDispatcher';
import { createWorkspaceClientOperationId } from '@/editor/workspaceSync/workspaceOperationIdentity';
import {
  createDataOpenApiImportPreview,
  type DataOpenApiImportDraft,
  type DataOpenApiImportPreview,
} from './dataOpenApiImportSession';
import type { DataResourceDocumentView } from './dataResourceModel';
import { createWorkspaceDataOpenApiAdoption } from './workspaceDataOpenApiImport';

type DataOpenApiImportPanelProps = Readonly<{
  documents: readonly DataResourceDocumentView[];
  preferredDocumentId?: string;
  onAdopted(documentId: string): void;
}>;

const NEW_TARGET = '@new';

const defaultDraft = (
  document?: DataResourceDocumentView
): DataOpenApiImportDraft => {
  if (document?.status === 'ready') {
    const provenance = document.provenance[0];
    const runtimeZone = ['client', 'server', 'edge'].includes(
      document.runtimeZone
    )
      ? (document.runtimeZone as DataOpenApiImportDraft['runtimeZone'])
      : 'server';
    return Object.freeze({
      documentId: document.id,
      documentPath: document.path,
      importId: provenance?.id ?? `${document.sourceId}-openapi`,
      externalDocumentId: provenance?.externalDocumentId ?? '',
      sourceId: document.sourceId,
      runtimeZone,
      baseUrl: '',
      specification: '',
    });
  }
  if (document) {
    return Object.freeze({
      documentId: document.id,
      documentPath: document.path,
      importId: `${document.id}-openapi`,
      externalDocumentId: '',
      sourceId: document.id,
      runtimeZone: 'server',
      baseUrl: '',
      specification: '',
    });
  }
  return Object.freeze({
    documentId: 'data-openapi',
    documentPath: '/data/openapi.data.json',
    importId: 'openapi-import',
    externalDocumentId: 'https://api.example.com/openapi.json',
    sourceId: 'openapi-source',
    runtimeZone: 'server',
    baseUrl: '',
    specification: '',
  });
};

const statusTone = (status: string): string => {
  if (status === 'ready')
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'impact-required')
    return 'border-amber-200 bg-amber-50 text-amber-900';
  return 'border-red-200 bg-red-50 text-red-800';
};

const impactCount = (impact: DataOpenApiImportImpact): number =>
  impact.schemaIds.length + impact.operationIds.length;

export function DataOpenApiImportPanel({
  documents,
  preferredDocumentId,
  onAdopted,
}: DataOpenApiImportPanelProps) {
  const { t } = useTranslation('editor');
  const workspace = useEditorStore((state) => state.workspace);
  const workspaceReadonly = useEditorStore((state) => state.workspaceReadonly);
  const preferredDocument = documents.find(
    (document) => document.id === preferredDocumentId
  );
  const [target, setTarget] = useState(
    preferredDocument ? preferredDocument.id : NEW_TARGET
  );
  const [draft, setDraft] = useState<DataOpenApiImportDraft>(() =>
    defaultDraft(preferredDocument)
  );
  const [preview, setPreview] = useState<DataOpenApiImportPreview>();
  const [impactConfirmed, setImpactConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const lastPreferredDocumentId = useRef(preferredDocumentId);
  const selectedDocument = useMemo(
    () => documents.find((document) => document.id === target),
    [documents, target]
  );
  const isReimport = target !== NEW_TARGET;

  useEffect(() => {
    if (!preferredDocumentId) {
      lastPreferredDocumentId.current = undefined;
      return;
    }
    if (preferredDocumentId === lastPreferredDocumentId.current) return;
    lastPreferredDocumentId.current = preferredDocumentId;
    const next = documents.find(
      (document) => document.id === preferredDocumentId
    );
    if (!next) return;
    setTarget(next.id);
    setDraft(defaultDraft(next));
    setPreview(undefined);
    setImpactConfirmed(false);
    setMessage('');
  }, [documents, preferredDocumentId]);

  const updateDraft = <Key extends keyof DataOpenApiImportDraft>(
    key: Key,
    value: DataOpenApiImportDraft[Key]
  ) => {
    setDraft((current) => Object.freeze({ ...current, [key]: value }));
    setPreview(undefined);
    setImpactConfirmed(false);
    setMessage('');
  };

  const selectTarget = (value: string) => {
    setTarget(value);
    setDraft(
      defaultDraft(
        value === NEW_TARGET
          ? undefined
          : documents.find((document) => document.id === value)
      )
    );
    setPreview(undefined);
    setImpactConfirmed(false);
    setMessage('');
  };

  const generatePreview = (impactApproval?: DataOpenApiImportImpact) => {
    if (!workspace) return;
    setPreview(
      createDataOpenApiImportPreview({
        workspace,
        draft,
        ...(impactApproval ? { impactApproval } : {}),
      })
    );
    setMessage('');
  };

  const adopt = async () => {
    if (!preview || preview.status !== 'proposal' || !workspace) return;
    const proposal = preview.proposal;
    if (proposal.status !== 'ready') return;
    const editor = useEditorStore.getState();
    const currentWorkspace = editor.workspace;
    if (!currentWorkspace) return;
    const adoption = createWorkspaceDataOpenApiAdoption({
      workspace: currentWorkspace,
      proposal,
      documentId: proposal.target.documentId,
      documentPath: preview.documentPath,
      commandId: createWorkspaceClientOperationId('data-openapi-adopt'),
      issuedAt: new Date().toISOString(),
      ...(preview.expectedContentRev === undefined
        ? {}
        : { expectedContentRev: preview.expectedContentRev }),
    });
    if (adoption.status !== 'ready') {
      setMessage(
        adoption.status === 'no-change'
          ? t('resourceManager.data.import.feedback.noChange')
          : t(`resourceManager.data.import.feedback.${adoption.reason}`)
      );
      return;
    }
    setSaving(true);
    setMessage('');
    const outcome = await dispatchWorkspaceAuthoringOperation({
      workspace: currentWorkspace,
      readonly: editor.workspaceReadonly,
      operation: { kind: 'command', command: adoption.command },
    });
    setSaving(false);
    if (outcome.status !== 'applied') {
      setMessage(outcome.message);
      return;
    }
    editor.setActiveDocumentId(proposal.target.documentId);
    setMessage(t('resourceManager.data.import.feedback.adopted'));
    onAdopted(proposal.target.documentId);
  };

  const proposal =
    preview?.status === 'proposal' ? preview.proposal : undefined;

  return (
    <article className="rounded-2xl border border-black/8 bg-(--bg-canvas) p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-(--text-muted) uppercase">
            <Upload size={14} />
            {t('resourceManager.data.import.badge')}
          </p>
          <h3 className="mt-2 text-sm font-medium text-(--text-primary)">
            {t('resourceManager.data.import.title')}
          </h3>
          <p className="mt-1 max-w-3xl text-xs text-(--text-secondary)">
            {t('resourceManager.data.import.description')}
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-black/10 px-2.5 py-1 text-[11px] text-(--text-secondary)">
          <ShieldCheck size={12} />
          {t('resourceManager.data.import.referenceOnly')}
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-1 text-xs text-(--text-secondary)">
          {t('resourceManager.data.import.target')}
          <select
            aria-label={t('resourceManager.data.import.target')}
            value={target}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-(--text-primary)"
            onChange={(event) => selectTarget(event.target.value)}
          >
            <option value={NEW_TARGET}>
              {t('resourceManager.data.import.newTarget')}
            </option>
            {documents.map((document) => (
              <option key={document.id} value={document.id}>
                {document.path}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary)">
          {t('resourceManager.data.import.documentId')}
          <input
            aria-label={t('resourceManager.data.import.documentId')}
            value={draft.documentId}
            disabled={isReimport}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/[0.03]"
            onChange={(event) => updateDraft('documentId', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary)">
          {t('resourceManager.data.import.documentPath')}
          <input
            aria-label={t('resourceManager.data.import.documentPath')}
            value={draft.documentPath}
            disabled={isReimport}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/[0.03]"
            onChange={(event) =>
              updateDraft('documentPath', event.target.value)
            }
          />
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary)">
          {t('resourceManager.data.import.runtimeZone')}
          <select
            aria-label={t('resourceManager.data.import.runtimeZone')}
            value={draft.runtimeZone}
            disabled={isReimport}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/[0.03]"
            onChange={(event) =>
              updateDraft(
                'runtimeZone',
                event.target.value as DataOpenApiImportDraft['runtimeZone']
              )
            }
          >
            <option value="client">client</option>
            <option value="server">server</option>
            <option value="edge">edge</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary)">
          {t('resourceManager.data.import.importId')}
          <input
            aria-label={t('resourceManager.data.import.importId')}
            value={draft.importId}
            disabled={isReimport}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/[0.03]"
            onChange={(event) => updateDraft('importId', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary) xl:col-span-2">
          {t('resourceManager.data.import.externalDocumentId')}
          <input
            aria-label={t('resourceManager.data.import.externalDocumentId')}
            value={draft.externalDocumentId}
            disabled={isReimport}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/[0.03]"
            onChange={(event) =>
              updateDraft('externalDocumentId', event.target.value)
            }
          />
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary)">
          {t('resourceManager.data.import.sourceId')}
          <input
            aria-label={t('resourceManager.data.import.sourceId')}
            value={draft.sourceId}
            disabled={isReimport}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm disabled:bg-black/[0.03]"
            onChange={(event) => updateDraft('sourceId', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary) md:col-span-2 xl:col-span-4">
          {t('resourceManager.data.import.baseUrl')}
          <input
            aria-label={t('resourceManager.data.import.baseUrl')}
            value={draft.baseUrl}
            placeholder={t('resourceManager.data.import.baseUrlPlaceholder')}
            className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            onChange={(event) => updateDraft('baseUrl', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-xs text-(--text-secondary) md:col-span-2 xl:col-span-4">
          {t('resourceManager.data.import.specification')}
          <textarea
            aria-label={t('resourceManager.data.import.specification')}
            value={draft.specification}
            rows={8}
            spellCheck={false}
            className="resize-y rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2 font-mono text-xs text-(--text-primary)"
            onChange={(event) =>
              updateDraft('specification', event.target.value)
            }
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-xl border border-black/12 bg-black px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!workspace || saving}
          onClick={() => generatePreview()}
        >
          {t('resourceManager.data.import.preview')}
        </button>
        {proposal?.status === 'ready' ? (
          <button
            type="button"
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={workspaceReadonly || saving}
            onClick={() => void adopt()}
          >
            {saving
              ? t('resourceManager.data.import.saving')
              : t('resourceManager.data.import.adopt')}
          </button>
        ) : null}
      </div>

      {preview?.status === 'invalid-input' ? (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
        >
          <strong>{preview.code}</strong>
          <span className="ml-2">{preview.message}</span>
        </div>
      ) : null}

      {proposal ? (
        <section
          className="mt-4 grid gap-3"
          aria-label={t('resourceManager.data.import.previewResults')}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs ${statusTone(proposal.status)}`}
            >
              {t(`resourceManager.data.import.status.${proposal.status}`)}
            </span>
            <span className="text-xs text-(--text-muted)">
              {t('resourceManager.data.import.changeCount', {
                count: proposal.changes.length,
              })}
            </span>
            <span className="text-xs text-(--text-muted)">
              {t('resourceManager.data.import.impactCount', {
                count: impactCount(proposal.impact),
              })}
            </span>
          </div>

          {proposal.status === 'impact-required' ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={impactConfirmed}
                  onChange={(event) => setImpactConfirmed(event.target.checked)}
                />
                <span>
                  {t('resourceManager.data.import.confirmImpact', {
                    schemas: proposal.impact.schemaIds.join(', ') || '-',
                    operations: proposal.impact.operationIds.join(', ') || '-',
                  })}
                </span>
              </label>
              <button
                type="button"
                className="mt-2 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs disabled:opacity-50"
                disabled={!impactConfirmed}
                onClick={() => generatePreview(proposal.impact)}
              >
                {t('resourceManager.data.import.approveImpact')}
              </button>
            </div>
          ) : null}

          {proposal.changes.length ? (
            <div className="overflow-hidden rounded-xl border border-black/8">
              <div className="flex items-center gap-2 border-b border-black/8 bg-black/[0.02] px-3 py-2 text-xs font-medium text-(--text-secondary)">
                <GitCompareArrows size={13} />
                {t('resourceManager.data.import.diff')}
              </div>
              <div className="max-h-56 overflow-auto">
                {proposal.changes.map((change, index) => (
                  <div
                    key={`${change.entity}:${change.targetId}:${change.change}:${index}`}
                    className="grid grid-cols-[80px_100px_minmax(0,1fr)] gap-2 border-b border-black/6 px-3 py-2 text-xs last:border-b-0"
                  >
                    <span className="text-(--text-muted)">{change.entity}</span>
                    <span className="text-(--text-secondary)">
                      {change.change}
                    </span>
                    <span
                      className="truncate text-(--text-primary)"
                      title={change.externalId ?? change.targetId}
                    >
                      {change.targetId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {proposal.issues.length ? (
            <div className="grid gap-2">
              {proposal.issues.map((issue, index) => (
                <div
                  key={`${issue.code}:${issue.path}:${index}`}
                  className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${issue.severity === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
                >
                  <TriangleAlert size={14} className="mt-0.5 shrink-0" />
                  <span className="min-w-0">
                    <strong>{issue.code}</strong>
                    <span className="ml-2 break-all">{issue.path}</span>
                    <span className="mt-1 block">{issue.message}</span>
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {selectedDocument?.status === 'invalid' && isReimport ? (
        <p className="mt-3 text-xs text-red-700">
          {t('resourceManager.data.import.invalidTarget')}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="mt-3 rounded-xl border border-black/8 px-3 py-2 text-xs text-(--text-secondary)"
        >
          {message}
        </p>
      ) : null}
    </article>
  );
}

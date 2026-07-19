import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, FlaskConical, TriangleAlert } from 'lucide-react';
import {
  createDataLifecycleChannel,
  runDataOperationTest,
  type DataJsonValue,
  type DataOperationTestReport,
} from '@prodivix/data';
import { decodeWorkspaceDataSourceDocument } from '@prodivix/workspace';
import { useEditorStore } from '@/editor/store/useEditorStore';
import { createBrowserTestDataExecutionEnvironment } from '@/editor/features/execution/browserDataExecutionEnvironment';
import { createWorkspaceClientOperationId } from '@/editor/workspaceSync/workspaceOperationIdentity';

type DataOperationTestPanelProps = Readonly<{
  documentId?: string;
  operationId?: string;
}>;

type OutcomeKind = 'result' | 'error';

const parseJson = (value: string): DataJsonValue =>
  JSON.parse(value) as DataJsonValue;

export function DataOperationTestPanel({
  documentId,
  operationId,
}: DataOperationTestPanelProps) {
  const { t } = useTranslation('editor');
  const workspace = useEditorStore((state) => state.workspace);
  const [inputDraft, setInputDraft] = useState('{}');
  const [fixtureKind, setFixtureKind] = useState<OutcomeKind>('result');
  const [fixtureDraft, setFixtureDraft] = useState('{}');
  const [fixtureEmpty, setFixtureEmpty] = useState(false);
  const [expectedKind, setExpectedKind] = useState<OutcomeKind>('result');
  const [expectedDraft, setExpectedDraft] = useState('{}');
  const [expectedEmpty, setExpectedEmpty] = useState(false);
  const [report, setReport] = useState<DataOperationTestReport>();
  const [message, setMessage] = useState('');
  const [running, setRunning] = useState(false);
  const sequence = useRef(0);

  const selected = useMemo(() => {
    if (!workspace || !documentId || !operationId) return undefined;
    const workspaceDocument = workspace.docsById[documentId];
    if (!workspaceDocument || workspaceDocument.type !== 'data-source')
      return undefined;
    const read = decodeWorkspaceDataSourceDocument(workspaceDocument);
    if (read.status !== 'valid') return undefined;
    const operation = read.decodedContent.operationsById[operationId];
    return operation
      ? Object.freeze({
          workspaceDocument,
          document: read.decodedContent,
          operation,
        })
      : undefined;
  }, [documentId, operationId, workspace]);

  useEffect(() => {
    setInputDraft('{}');
    setFixtureKind('result');
    setFixtureDraft('{}');
    setFixtureEmpty(false);
    setExpectedKind('result');
    setExpectedDraft('{}');
    setExpectedEmpty(false);
    setReport(undefined);
    setMessage('');
  }, [documentId, operationId]);

  const run = async () => {
    if (!selected || !documentId || !operationId) return;
    let input: DataJsonValue;
    let fixtureValue: DataJsonValue | undefined;
    let expectedValue: DataJsonValue | undefined;
    try {
      input = parseJson(inputDraft);
      if (fixtureKind === 'result') fixtureValue = parseJson(fixtureDraft);
      if (expectedKind === 'result') expectedValue = parseJson(expectedDraft);
    } catch {
      setReport(undefined);
      setMessage(t('resourceManager.data.test.feedback.invalidJson'));
      return;
    }
    const fixtureErrorCode = fixtureDraft.trim();
    const expectedErrorCode = expectedDraft.trim();
    if (
      (fixtureKind === 'error' && !fixtureErrorCode) ||
      (expectedKind === 'error' && !expectedErrorCode)
    ) {
      setMessage(t('resourceManager.data.test.feedback.errorCodeRequired'));
      return;
    }
    const environment = createBrowserTestDataExecutionEnvironment({
      mock: {
        fixtureSetId: `test-operation:${documentId}:${operationId}`,
        emulatedAdapterIds: [selected.document.source.adapterId],
        fixtures: [
          {
            id: 'manual-test-fixture',
            operation: { documentId, operationId },
            operationKind: selected.operation.kind,
            input,
            behavior:
              fixtureKind === 'result'
                ? {
                    kind: 'result',
                    value: fixtureValue!,
                    empty: fixtureEmpty,
                  }
                : {
                    kind: 'error',
                    code: fixtureErrorCode,
                    retryable: false,
                  },
          },
        ],
      },
    });
    setRunning(true);
    setMessage('');
    sequence.current += 1;
    try {
      const next = await runDataOperationTest({
        test: {
          id: `manual-${operationId}`,
          operation: { documentId, operationId },
          input,
          expected:
            expectedKind === 'result'
              ? {
                  kind: 'result',
                  value: expectedValue!,
                  empty: expectedEmpty,
                }
              : { kind: 'error', code: expectedErrorCode },
        },
        runId: createWorkspaceClientOperationId('data-test-operation'),
        sequence: sequence.current,
        documentRevision: String(selected.workspaceDocument.contentRev),
        runtimeZone: selected.document.source.runtimeZone,
        execute: (invocation) =>
          environment.execute({
            invocation,
            document: selected.document,
            lifecycleChannel: createDataLifecycleChannel(),
            signal: new AbortController().signal,
          }),
      });
      setReport(next);
    } finally {
      environment.dispose();
      setRunning(false);
    }
  };

  return (
    <article className="rounded-2xl border border-black/8 bg-(--bg-canvas) p-5">
      <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] text-(--text-muted) uppercase">
        <FlaskConical size={14} />
        {t('resourceManager.data.test.badge')}
      </p>
      <h3 className="mt-2 text-sm font-medium text-(--text-primary)">
        {t('resourceManager.data.test.title')}
      </h3>
      <p className="mt-1 max-w-3xl text-xs text-(--text-secondary)">
        {t('resourceManager.data.test.description')}
      </p>
      {!selected ? (
        <p className="mt-4 rounded-xl border border-dashed border-black/10 p-4 text-sm text-(--text-secondary)">
          {t('resourceManager.data.test.noTarget')}
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          <div className="rounded-xl border border-black/8 px-3 py-2 text-xs text-(--text-secondary)">
            <strong className="text-(--text-primary)">{operationId}</strong>
            {' · '}mock-only{' · '}
            {selected.document.source.adapterId}
          </div>
          <label className="grid gap-1 text-xs text-(--text-secondary)">
            {t('resourceManager.data.test.input')}
            <textarea
              aria-label={t('resourceManager.data.test.input')}
              rows={5}
              value={inputDraft}
              spellCheck={false}
              className="rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2 font-mono text-xs"
              onChange={(event) => setInputDraft(event.target.value)}
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <section className="grid gap-2 rounded-xl border border-black/8 p-3">
              <label className="grid gap-1 text-xs text-(--text-secondary)">
                {t('resourceManager.data.test.fixtureKind')}
                <select
                  aria-label={t('resourceManager.data.test.fixtureKind')}
                  value={fixtureKind}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  onChange={(event) =>
                    setFixtureKind(event.target.value as OutcomeKind)
                  }
                >
                  <option value="result">result</option>
                  <option value="error">error</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-(--text-secondary)">
                {t(
                  fixtureKind === 'result'
                    ? 'resourceManager.data.test.fixtureValue'
                    : 'resourceManager.data.test.fixtureError'
                )}
                <textarea
                  aria-label={t('resourceManager.data.test.fixtureDraft')}
                  rows={5}
                  value={fixtureDraft}
                  spellCheck={false}
                  className="rounded-lg border border-black/10 bg-black/[0.015] px-2 py-1.5 font-mono text-xs"
                  onChange={(event) => setFixtureDraft(event.target.value)}
                />
              </label>
              {fixtureKind === 'result' ? (
                <label className="flex items-center gap-2 text-xs text-(--text-secondary)">
                  <input
                    type="checkbox"
                    checked={fixtureEmpty}
                    onChange={(event) => setFixtureEmpty(event.target.checked)}
                  />
                  {t('resourceManager.data.test.fixtureEmpty')}
                </label>
              ) : null}
            </section>
            <section className="grid gap-2 rounded-xl border border-black/8 p-3">
              <label className="grid gap-1 text-xs text-(--text-secondary)">
                {t('resourceManager.data.test.expectedKind')}
                <select
                  aria-label={t('resourceManager.data.test.expectedKind')}
                  value={expectedKind}
                  className="rounded-lg border border-black/10 bg-white px-2 py-1.5"
                  onChange={(event) =>
                    setExpectedKind(event.target.value as OutcomeKind)
                  }
                >
                  <option value="result">result</option>
                  <option value="error">error</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs text-(--text-secondary)">
                {t(
                  expectedKind === 'result'
                    ? 'resourceManager.data.test.expectedValue'
                    : 'resourceManager.data.test.expectedError'
                )}
                <textarea
                  aria-label={t('resourceManager.data.test.expectedDraft')}
                  rows={5}
                  value={expectedDraft}
                  spellCheck={false}
                  className="rounded-lg border border-black/10 bg-black/[0.015] px-2 py-1.5 font-mono text-xs"
                  onChange={(event) => setExpectedDraft(event.target.value)}
                />
              </label>
              {expectedKind === 'result' ? (
                <label className="flex items-center gap-2 text-xs text-(--text-secondary)">
                  <input
                    type="checkbox"
                    checked={expectedEmpty}
                    onChange={(event) => setExpectedEmpty(event.target.checked)}
                  />
                  {t('resourceManager.data.test.expectedEmpty')}
                </label>
              ) : null}
            </section>
          </div>
          <button
            type="button"
            disabled={running}
            className="w-fit rounded-xl border border-black bg-black px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            onClick={() => void run()}
          >
            {running
              ? t('resourceManager.data.test.running')
              : t('resourceManager.data.test.run')}
          </button>
          {report ? (
            <section
              aria-label={t('resourceManager.data.test.report')}
              className={`rounded-xl border p-3 text-xs ${report.status === 'passed' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-900'}`}
            >
              <p className="flex items-center gap-2 font-medium">
                {report.status === 'passed' ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <TriangleAlert size={14} />
                )}
                {t(`resourceManager.data.test.status.${report.status}`)}
              </p>
              <pre className="mt-2 overflow-auto font-mono text-[11px] whitespace-pre-wrap">
                {prettyActual(report.actual)}
              </pre>
              {report.issues.map((entry) => (
                <p key={entry.code} className="mt-2">
                  <strong>{entry.code}</strong> · {entry.message}
                </p>
              ))}
            </section>
          ) : null}
        </div>
      )}
      {message ? (
        <p role="alert" className="mt-3 text-xs text-red-800">
          {message}
        </p>
      ) : null}
    </article>
  );
}

const prettyActual = (actual: DataOperationTestReport['actual']): string =>
  JSON.stringify(actual, null, 2);

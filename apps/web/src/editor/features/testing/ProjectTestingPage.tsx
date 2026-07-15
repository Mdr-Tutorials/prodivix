import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle2,
  CircleDashed,
  Code2,
  FileCode2,
  FlaskConical,
  LoaderCircle,
  LocateFixed,
  Play,
  RotateCcw,
  Square,
  XCircle,
} from 'lucide-react';
import type {
  ExecutionSourceTrace,
  ExecutionTestStatus,
} from '@prodivix/runtime-core';
import {
  createWorkspaceExecutionSnapshotId,
  ExecutionCenter,
} from '@/editor/features/execution';
import { selectWorkspace, useEditorStore } from '@/editor/store/useEditorStore';
import { navigateToWorkspaceSemanticTarget } from '@/editor/navigation';
import { useProjectTestRunner } from './useProjectTestRunner';

const activeStatuses = new Set([
  'compiling',
  'queued',
  'starting',
  'running',
  'cancelling',
]);

const statusIcon = (status: ExecutionTestStatus) => {
  if (status === 'passed') return <CheckCircle2 size={14} />;
  if (status === 'failed') return <XCircle size={14} />;
  return <CircleDashed size={14} />;
};

const statusClass = (status: ExecutionTestStatus): string => {
  if (status === 'failed') return 'text-(--danger-color)';
  if (status === 'passed') return 'text-(--text-primary)';
  return 'text-(--text-muted)';
};

const formatDuration = (durationMs: number | undefined): string => {
  if (durationMs === undefined) return '—';
  if (durationMs < 1_000) return `${Math.round(durationMs)} ms`;
  return `${(durationMs / 1_000).toFixed(2)} s`;
};

export default function ProjectTestingPage() {
  const { t } = useTranslation('editor');
  const navigate = useNavigate();
  const workspace = useEditorStore(selectWorkspace);
  const runner = useProjectTestRunner(workspace);
  const counts = runner.report?.summary ?? {
    totalFiles: 0,
    failedFiles: 0,
    totalCases: 0,
    passedCases: 0,
    failedCases: 0,
    skippedCases: 0,
    todoCases: 0,
  };
  const reportIsCurrent = Boolean(
    workspace &&
    runner.reportSnapshotId === createWorkspaceExecutionSnapshotId(workspace)
  );
  const active = activeStatuses.has(runner.status);
  const executionFailed =
    runner.status === 'failed' || runner.status === 'timed-out';
  const consoleDiagnostics = useMemo(
    () =>
      runner.diagnostics.map((diagnostic) => ({
        code: diagnostic.code,
        severity: diagnostic.severity,
        message: diagnostic.message,
        path: diagnostic.path,
      })),
    [runner.diagnostics]
  );

  const actionClass =
    'inline-flex h-8 items-center gap-1.5 rounded-lg border border-(--border-default) bg-(--bg-canvas) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-raised) disabled:cursor-not-allowed disabled:opacity-40';
  const openSourceTrace = (trace: ExecutionSourceTrace | undefined): void => {
    if (!workspace || !trace) return;
    navigateToWorkspaceSemanticTarget({
      projectId: workspace.id,
      target: trace.sourceSpan
        ? { kind: 'source-span', sourceSpan: trace.sourceSpan }
        : { kind: 'diagnostic-target', targetRef: trace.sourceRef },
      navigate,
    });
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--bg-canvas) text-(--text-primary)">
      <header className="flex shrink-0 items-center gap-4 border-b border-(--border-default) px-6 py-4">
        <span className="inline-flex size-9 items-center justify-center rounded-xl bg-(--bg-raised) text-(--text-secondary)">
          <FlaskConical size={18} />
        </span>
        <div className="min-w-0">
          <h1 className="m-0 text-base font-semibold">{t('testing.title')}</h1>
          <p className="m-0 mt-1 text-xs text-(--text-muted)">
            {t('testing.subtitle')}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={actionClass}
            onClick={() =>
              workspace && navigate(`/editor/project/${workspace.id}/code`)
            }
            disabled={!workspace}
          >
            <Code2 size={13} />
            {t('testing.actions.openCode')}
          </button>
          {active ? (
            <button
              type="button"
              className={actionClass}
              onClick={() => void runner.stop()}
            >
              <Square size={12} />
              {t('testing.actions.stop')}
            </button>
          ) : (
            <button
              type="button"
              className={actionClass}
              onClick={() => void runner.run()}
              disabled={!workspace}
            >
              {runner.report ? <RotateCcw size={13} /> : <Play size={13} />}
              {runner.report
                ? t('testing.actions.rerun')
                : t('testing.actions.run')}
            </button>
          )}
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {(
              [
                ['files', counts.totalFiles],
                ['cases', counts.totalCases],
                ['passed', counts.passedCases],
                ['failed', counts.failedCases],
                ['skipped', counts.skippedCases],
                ['todo', counts.todoCases],
              ] as const
            ).map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-(--border-default) bg-(--bg-panel) px-4 py-3"
              >
                <div className="text-[10px] font-medium tracking-wide text-(--text-muted) uppercase">
                  {t(`testing.summary.${key}`)}
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums">
                  {value}
                </div>
                {key === 'failed' ? (
                  <div className="mt-0.5 text-[10px] text-(--text-muted)">
                    {t('testing.summary.failedFiles', {
                      count: counts.failedFiles,
                    })}
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          {active && !runner.report ? (
            <section className="flex min-h-52 items-center justify-center rounded-xl border border-(--border-default) bg-(--bg-panel)">
              <div className="flex flex-col items-center gap-3 text-center">
                <LoaderCircle
                  size={20}
                  className="animate-spin text-(--text-muted)"
                />
                <div className="text-sm font-medium">
                  {t('testing.running.title')}
                </div>
                <div className="max-w-md text-xs leading-5 text-(--text-muted)">
                  {runner.message ?? t('testing.running.description')}
                </div>
              </div>
            </section>
          ) : runner.report ? (
            <section className="overflow-hidden rounded-xl border border-(--border-default) bg-(--bg-panel)">
              <header className="flex items-center gap-3 border-b border-(--border-subtle) px-4 py-3">
                <div>
                  <div className="text-sm font-medium">
                    {t('testing.report.title')}
                  </div>
                  <div className="mt-0.5 text-[11px] text-(--text-muted)">
                    {runner.report.tool.name} ·{' '}
                    {formatDuration(runner.report.durationMs)}
                  </div>
                </div>
                <span className="ml-auto max-w-[45%] truncate font-mono text-[10px] text-(--text-muted)">
                  {t(
                    reportIsCurrent
                      ? 'testing.report.current'
                      : 'testing.report.outdated'
                  )}{' '}
                  · {runner.reportSnapshotId}
                </span>
              </header>
              {runner.report.failureMessages.map((message, index) => (
                <pre
                  key={`report-failure:${index}`}
                  className="m-3 overflow-auto rounded-md border border-(--border-subtle) bg-(--bg-canvas) p-2 font-mono text-[10px] leading-4 whitespace-pre-wrap text-(--danger-color)"
                >
                  {message}
                </pre>
              ))}
              <div className="divide-y divide-(--border-subtle)">
                {runner.report.files.map((file) => (
                  <article key={file.fileId} className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <FileCode2 size={14} className="text-(--text-muted)" />
                      <span className="min-w-0 flex-1 truncate font-mono">
                        {file.path}
                      </span>
                      <span className="text-[10px] font-normal text-(--text-muted)">
                        {formatDuration(file.durationMs)}
                      </span>
                    </div>
                    {file.failureMessages.map((message, index) => (
                      <pre
                        key={`${file.fileId}:failure:${index}`}
                        className="mt-2 overflow-auto rounded-md border border-(--border-subtle) bg-(--bg-canvas) p-2 font-mono text-[10px] leading-4 whitespace-pre-wrap text-(--danger-color)"
                      >
                        {message}
                      </pre>
                    ))}
                    <div className="mt-2 grid gap-1">
                      {file.cases.map((testCase) => (
                        <div
                          key={testCase.caseId}
                          className="rounded-lg bg-(--bg-canvas) px-3 py-2"
                        >
                          <div
                            className={`flex items-center gap-2 text-xs ${statusClass(testCase.status)}`}
                          >
                            {statusIcon(testCase.status)}
                            <span className="min-w-0 flex-1 truncate">
                              {testCase.fullName ?? testCase.name}
                            </span>
                            <span className="text-[10px] text-(--text-muted)">
                              {formatDuration(testCase.durationMs)}
                            </span>
                            {testCase.sourceTrace?.[0] ? (
                              <button
                                type="button"
                                className="inline-flex size-6 items-center justify-center rounded-md text-(--text-muted) hover:bg-(--bg-raised) hover:text-(--text-primary)"
                                title={t('testing.actions.openSource')}
                                aria-label={t('testing.actions.openSource')}
                                onClick={() =>
                                  openSourceTrace(testCase.sourceTrace?.[0])
                                }
                              >
                                <LocateFixed size={12} />
                              </button>
                            ) : null}
                          </div>
                          {testCase.failureMessages?.map((message, index) => (
                            <pre
                              key={`${testCase.caseId}:failure:${index}`}
                              className="mt-2 overflow-auto rounded-md border border-(--border-subtle) bg-(--bg-panel) p-2 font-mono text-[10px] leading-4 whitespace-pre-wrap text-(--danger-color)"
                            >
                              {message}
                            </pre>
                          ))}
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <section className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-(--border-default) bg-(--bg-panel)">
              <div className="flex max-w-md flex-col items-center gap-3 px-8 text-center">
                <FlaskConical size={20} className="text-(--text-muted)" />
                <div className="text-sm font-medium">
                  {runner.status === 'blocked'
                    ? t('testing.blocked.title')
                    : executionFailed
                      ? t('testing.failed.title')
                      : t('testing.empty.title')}
                </div>
                <div className="text-xs leading-5 text-(--text-muted)">
                  {runner.message ??
                    (runner.status === 'blocked'
                      ? t('testing.blocked.description')
                      : executionFailed
                        ? t('testing.failed.description')
                        : t('testing.empty.description'))}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <ExecutionCenter
        sessionId={runner.sessionId}
        status={runner.status}
        diagnostics={consoleDiagnostics}
        onRestart={() => void runner.run()}
        onStop={() => void runner.stop()}
      />
    </div>
  );
}

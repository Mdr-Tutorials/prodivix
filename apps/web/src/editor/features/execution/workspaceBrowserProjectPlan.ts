import {
  generateWorkspaceReactViteBundle,
  type CompileDiagnostic,
  type ExportSourceTrace,
} from '@prodivix/prodivix-compiler';
import {
  createBrowserProjectSnapshot,
  DEFAULT_BROWSER_PROJECT_TEST_REPORT_PATH,
  type BrowserProjectCommand,
  type BrowserProjectSnapshot,
} from '@prodivix/runtime-browser';
import type { DiagnosticTargetRef } from '@prodivix/diagnostics';
import type {
  ExecutionSourceTrace,
  ExecutionWorkspaceSnapshotRef,
} from '@prodivix/runtime-core';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { createWorkspaceExecutionSnapshotRef } from './workspaceExecutionIdentity';

export type WorkspaceBrowserProjectPlan =
  | Readonly<{
      status: 'ready';
      snapshot: BrowserProjectSnapshot;
      workspace: ExecutionWorkspaceSnapshotRef;
    }>
  | Readonly<{
      status: 'blocked';
      diagnostics: readonly CompileDiagnostic[];
    }>;

type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun';

const readPackageManager = (
  files: readonly Readonly<{ path: string; contents: string | Uint8Array }>[]
): PackageManagerName => {
  const packageFile = files.find((file) => file.path === 'package.json');
  if (!packageFile || typeof packageFile.contents !== 'string') return 'npm';
  try {
    const value = JSON.parse(packageFile.contents) as {
      packageManager?: unknown;
    };
    const name =
      typeof value.packageManager === 'string'
        ? value.packageManager.split('@')[0]
        : undefined;
    return name === 'pnpm' || name === 'yarn' || name === 'bun' ? name : 'npm';
  } catch {
    return 'npm';
  }
};

const packageManagerCommand = (
  packageManager: PackageManagerName,
  args: readonly string[]
): BrowserProjectCommand =>
  packageManager === 'npm' || packageManager === 'bun'
    ? Object.freeze({
        command: packageManager,
        args: Object.freeze([...args]),
      })
    : Object.freeze({
        command: 'corepack',
        args: Object.freeze([packageManager, ...args]),
      });

const executionTargetRef = (
  trace: ExportSourceTrace,
  workspaceId: string
): DiagnosticTargetRef => {
  switch (trace.sourceRef.domain) {
    case 'workspace':
      return { kind: 'workspace', workspaceId };
    case 'workspace-document':
      return {
        kind: 'document',
        workspaceId,
        documentId: trace.sourceRef.id,
      };
    case 'code':
    case 'code-artifact':
      return { kind: 'code-artifact', artifactId: trace.sourceRef.id };
    case 'route':
      return { kind: 'route', routeId: trace.sourceRef.id };
    default:
      return { kind: 'workspace', workspaceId };
  }
};

const executionSourceTrace = (
  trace: ExportSourceTrace,
  workspaceId: string
): ExecutionSourceTrace =>
  Object.freeze({
    sourceRef: Object.freeze(executionTargetRef(trace, workspaceId)),
    ...(trace.sourceSpan
      ? {
          sourceSpan: Object.freeze({
            artifactId: trace.artifactId ?? trace.sourceRef.id,
            ...trace.sourceSpan,
          }),
        }
      : {}),
    label:
      trace.sourceRef.path?.trim() ||
      `${trace.sourceRef.domain}:${trace.sourceRef.id}`,
  });

/** Produces the single standalone project snapshot consumed by Preview and Test. */
export const createWorkspaceBrowserProjectPlan = (
  workspace: WorkspaceSnapshot
): WorkspaceBrowserProjectPlan => {
  const bundle = generateWorkspaceReactViteBundle(workspace);
  const blockingDiagnostics =
    bundle.metadata?.blockingDiagnostics ??
    bundle.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');
  if (bundle.metadata?.exportBlocked || blockingDiagnostics.length) {
    return Object.freeze({
      status: 'blocked',
      diagnostics: Object.freeze([...blockingDiagnostics]),
    });
  }

  const packageManager = readPackageManager(bundle.files);
  const workspaceRef = createWorkspaceExecutionSnapshotRef(workspace);
  const snapshot = createBrowserProjectSnapshot({
    workspaceId: workspace.id,
    snapshotId: workspaceRef.snapshotId,
    files: bundle.files.map((file) => ({
      path: file.path,
      contents: file.contents,
      sourceTrace: file.sourceTrace.map((trace) =>
        executionSourceTrace(trace, workspace.id)
      ),
    })),
    installCommand: packageManagerCommand(packageManager, [
      'install',
      ...(packageManager === 'pnpm' ? ['--no-frozen-lockfile'] : []),
    ]),
    startCommand: packageManagerCommand(packageManager, [
      'run',
      'dev',
      '--',
      '--host',
      '0.0.0.0',
    ]),
    testPlan: {
      framework: 'vitest',
      command: packageManagerCommand(packageManager, [
        'run',
        'test',
        '--',
        '--reporter=default',
        '--reporter=json',
        `--outputFile.json=${DEFAULT_BROWSER_PROJECT_TEST_REPORT_PATH}`,
      ]),
      reportFilePath: DEFAULT_BROWSER_PROJECT_TEST_REPORT_PATH,
    },
  });
  return Object.freeze({
    status: 'ready',
    snapshot,
    workspace: workspaceRef,
  });
};

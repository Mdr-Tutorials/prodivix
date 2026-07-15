import type { ExecutionSourceTrace } from '@prodivix/runtime-core';

export type BrowserProjectFile = Readonly<{
  path: string;
  contents: string | Uint8Array;
  sourceTrace?: readonly ExecutionSourceTrace[];
}>;

export type BrowserProjectCommand = Readonly<{
  command: string;
  args?: readonly string[];
  environment?: Readonly<Record<string, string | number | boolean>>;
}>;

export type BrowserProjectTestPlan = Readonly<{
  framework: 'vitest';
  command: BrowserProjectCommand;
  reportFilePath: string;
}>;

export type BrowserProjectTestPlanInput = Readonly<{
  framework?: 'vitest';
  command?: BrowserProjectCommand;
  reportFilePath?: string;
}>;

export type BrowserProjectSnapshot = Readonly<{
  workspaceId: string;
  snapshotId: string;
  files: readonly BrowserProjectFile[];
  installCommand: BrowserProjectCommand;
  startCommand: BrowserProjectCommand;
  testPlan: BrowserProjectTestPlan;
}>;

export type BrowserProjectSnapshotInput = Omit<
  BrowserProjectSnapshot,
  'files' | 'installCommand' | 'startCommand' | 'testPlan'
> &
  Readonly<{
    files: readonly BrowserProjectFile[];
    installCommand?: BrowserProjectCommand;
    startCommand?: BrowserProjectCommand;
    testPlan?: BrowserProjectTestPlanInput;
  }>;

export type BrowserProjectFileTree = {
  [name: string]:
    | Readonly<{ file: Readonly<{ contents: string | Uint8Array }> }>
    | Readonly<{ directory: BrowserProjectFileTree }>;
};

const DEFAULT_INSTALL_COMMAND: BrowserProjectCommand = Object.freeze({
  command: 'npm',
  args: Object.freeze(['install']),
});

const DEFAULT_START_COMMAND: BrowserProjectCommand = Object.freeze({
  command: 'npm',
  args: Object.freeze(['run', 'dev', '--', '--host', '0.0.0.0']),
});

export const DEFAULT_BROWSER_PROJECT_TEST_REPORT_PATH =
  '.prodivix/test-report.json';

const createDefaultTestCommand = (
  reportFilePath: string
): BrowserProjectCommand =>
  Object.freeze({
    command: 'npm',
    args: Object.freeze([
      'run',
      'test',
      '--',
      '--reporter=default',
      '--reporter=json',
      `--outputFile.json=${reportFilePath}`,
    ]),
  });

const normalizeIdentifier = (value: string, label: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} must not be empty.`);
  return normalized;
};

export const normalizeBrowserProjectPath = (path: string): string => {
  if (path !== path.trim() || !path) {
    throw new TypeError('Browser project file paths must be normalized.');
  }
  if (
    path.startsWith('/') ||
    path.includes('\\') ||
    path.includes('\0') ||
    /^[a-zA-Z]:/.test(path)
  ) {
    throw new TypeError(`Browser project file path is not relative: ${path}`);
  }
  const segments = path.split('/');
  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === '.' ||
        segment === '..' ||
        segment !== segment.trim()
    )
  ) {
    throw new TypeError(`Browser project file path is not normalized: ${path}`);
  }
  return path;
};

const cloneFileContents = (
  contents: string | Uint8Array
): string | Uint8Array =>
  typeof contents === 'string' ? contents : new Uint8Array(contents);

const cloneSourceTrace = (
  sourceTrace: readonly ExecutionSourceTrace[] | undefined
): readonly ExecutionSourceTrace[] | undefined =>
  sourceTrace
    ? Object.freeze(
        sourceTrace.map((trace) =>
          Object.freeze({
            sourceRef: Object.freeze({ ...trace.sourceRef }),
            ...(trace.sourceSpan
              ? { sourceSpan: Object.freeze({ ...trace.sourceSpan }) }
              : {}),
            ...(trace.label ? { label: trace.label } : {}),
          })
        )
      )
    : undefined;

const normalizeCommand = (
  command: BrowserProjectCommand,
  label: string
): BrowserProjectCommand => {
  const executable = normalizeIdentifier(command.command, `${label} command`);
  const args = Object.freeze(
    (command.args ?? []).map((argument, index) => {
      if (argument.includes('\0')) {
        throw new TypeError(`${label} argument ${index} contains a null byte.`);
      }
      return argument;
    })
  );
  const environment = command.environment
    ? Object.freeze(
        Object.fromEntries(
          Object.entries(command.environment)
            .map(
              ([key, value]) =>
                [
                  normalizeIdentifier(key, `${label} environment key`),
                  value,
                ] as const
            )
            .sort(([left], [right]) => left.localeCompare(right))
        )
      )
    : undefined;
  return Object.freeze({
    command: executable,
    args,
    ...(environment ? { environment } : {}),
  });
};

const normalizeTestPlan = (
  input: BrowserProjectTestPlanInput | undefined
): BrowserProjectTestPlan => {
  const reportFilePath = normalizeBrowserProjectPath(
    input?.reportFilePath ?? DEFAULT_BROWSER_PROJECT_TEST_REPORT_PATH
  );
  return Object.freeze({
    framework: input?.framework ?? 'vitest',
    command: normalizeCommand(
      input?.command ?? createDefaultTestCommand(reportFilePath),
      'Browser project test'
    ),
    reportFilePath,
  });
};

const assertFileTopology = (paths: readonly string[]): void => {
  const pathSet = new Set(paths);
  paths.forEach((path) => {
    const segments = path.split('/');
    for (let index = 1; index < segments.length; index += 1) {
      const parentPath = segments.slice(0, index).join('/');
      if (pathSet.has(parentPath)) {
        throw new TypeError(
          `Browser project path is both a file and a directory: ${parentPath}`
        );
      }
    }
  });
};

/** Creates an immutable, provider-neutral executable project snapshot. */
export const createBrowserProjectSnapshot = (
  input: BrowserProjectSnapshotInput
): BrowserProjectSnapshot => {
  const seenPaths = new Set<string>();
  const files = input.files
    .map((file) => {
      const path = normalizeBrowserProjectPath(file.path);
      if (seenPaths.has(path)) {
        throw new TypeError(
          `Browser project contains a duplicate file: ${path}`
        );
      }
      seenPaths.add(path);
      const sourceTrace = cloneSourceTrace(file.sourceTrace);
      return Object.freeze({
        path,
        contents: cloneFileContents(file.contents),
        ...(sourceTrace ? { sourceTrace } : {}),
      });
    })
    .sort((left, right) => left.path.localeCompare(right.path));
  if (!files.length) {
    throw new TypeError(
      'Browser project snapshots must contain at least one file.'
    );
  }
  assertFileTopology(files.map((file) => file.path));
  const testPlan = normalizeTestPlan(input.testPlan);
  if (seenPaths.has(testPlan.reportFilePath)) {
    throw new TypeError(
      `Browser project test report path conflicts with a project file: ${testPlan.reportFilePath}`
    );
  }
  return Object.freeze({
    workspaceId: normalizeIdentifier(
      input.workspaceId,
      'Browser project workspaceId'
    ),
    snapshotId: normalizeIdentifier(
      input.snapshotId,
      'Browser project snapshotId'
    ),
    files: Object.freeze(files),
    installCommand: normalizeCommand(
      input.installCommand ?? DEFAULT_INSTALL_COMMAND,
      'Browser project install'
    ),
    startCommand: normalizeCommand(
      input.startCommand ?? DEFAULT_START_COMMAND,
      'Browser project start'
    ),
    testPlan,
  });
};

export const createBrowserProjectFileTree = (
  files: readonly BrowserProjectFile[]
): BrowserProjectFileTree => {
  const root: BrowserProjectFileTree = {};
  files.forEach((file) => {
    const path = normalizeBrowserProjectPath(file.path);
    const segments = path.split('/');
    let directory = root;
    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      const existing = directory[segment];
      if (isFile) {
        if (existing) {
          throw new TypeError(
            `Browser project tree contains a conflict at ${path}.`
          );
        }
        directory[segment] = Object.freeze({
          file: Object.freeze({ contents: cloneFileContents(file.contents) }),
        });
        return;
      }
      if (existing && !('directory' in existing)) {
        throw new TypeError(
          `Browser project path is both a file and a directory: ${segments
            .slice(0, index + 1)
            .join('/')}`
        );
      }
      if (!existing) {
        directory[segment] = { directory: {} };
      }
      directory = (directory[segment] as { directory: BrowserProjectFileTree })
        .directory;
    });
  });
  return root;
};

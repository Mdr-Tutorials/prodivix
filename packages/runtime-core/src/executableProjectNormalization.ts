import type { DiagnosticTargetRef, SourceSpan } from '@prodivix/diagnostics';
import {
  EXECUTION_PROVIDER_CAPABILITIES,
  type ExecutionProviderCapability,
  type ExecutionSourceTrace,
  type ExecutionWorkspaceSnapshotRef,
} from './execution.types';
import {
  DEFAULT_EXECUTABLE_PROJECT_TEST_REPORT_PATH,
  EXECUTABLE_PROJECT_COMMANDS,
  EXECUTABLE_PROJECT_LIMITS,
  type ExecutableProjectCacheHints,
  type ExecutableProjectCapabilityRequirements,
  type ExecutableProjectCommand,
  type ExecutableProjectCommandName,
  type ExecutableProjectEntrypoint,
  type ExecutableProjectFile,
  type ExecutableProjectPublicBuildConfigurationEntry,
  type ExecutableProjectResourceHints,
  type ExecutableProjectTarget,
  type ExecutableProjectTestPlan,
} from './executableProject.types';

const DEFAULT_INSTALL_COMMAND: ExecutableProjectCommand = Object.freeze({
  command: 'npm',
  args: Object.freeze(['install']),
});

const DEFAULT_PREVIEW_COMMAND: ExecutableProjectCommand = Object.freeze({
  command: 'npm',
  args: Object.freeze(['run', 'dev', '--', '--host', '0.0.0.0']),
});

const DEFAULT_BUILD_COMMAND: ExecutableProjectCommand = Object.freeze({
  command: 'npm',
  args: Object.freeze(['run', 'build']),
});

const createDefaultTestCommand = (
  reportFilePath: string
): ExecutableProjectCommand =>
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

const isPlainRecord = (value: unknown): value is Record<string, unknown> => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

export const assertExecutableProjectExactKeys = (
  value: unknown,
  allowedKeys: readonly string[],
  label: string
): Record<string, unknown> => {
  if (!isPlainRecord(value)) {
    throw new TypeError(`${label} must be a plain object.`);
  }
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(value).find((key) => !allowed.has(key));
  if (unexpected) {
    throw new TypeError(
      `${label} contains an unsupported field: ${unexpected}.`
    );
  }
  return value;
};

const normalizeIdentifier = (value: unknown, label: string): string => {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized || normalized !== value || normalized.includes('\0')) {
    throw new TypeError(`${label} must be a normalized non-empty string.`);
  }
  return normalized;
};

export const normalizeExecutableProjectPath = (value: unknown): string => {
  const path = normalizeIdentifier(value, 'Executable project file path');
  if (path.length > EXECUTABLE_PROJECT_LIMITS.maxPathLength) {
    throw new TypeError('Executable project file path exceeds the size limit.');
  }
  if (path.startsWith('/') || path.includes('\\') || /^[a-zA-Z]:/.test(path)) {
    throw new TypeError(
      `Executable project file path is not relative: ${path}`
    );
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
    throw new TypeError(
      `Executable project file path is not normalized: ${path}`
    );
  }
  return path;
};

const canonicalClone = (value: unknown, label: string, depth = 0): unknown => {
  if (depth > 16) throw new TypeError(`${label} exceeds the depth limit.`);
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((entry, index) =>
        canonicalClone(entry, `${label}[${index}]`, depth + 1)
      )
    );
  }
  if (!isPlainRecord(value)) {
    throw new TypeError(`${label} must contain transport-safe values.`);
  }
  const entries = Object.entries(value).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  return Object.freeze(
    Object.fromEntries(
      entries.map(([key, entry]) => [
        key,
        canonicalClone(entry, `${label}.${key}`, depth + 1),
      ])
    )
  );
};

export const cloneExecutableProjectSourceTrace = (
  value: unknown,
  label: string
): ExecutionSourceTrace => {
  const record = assertExecutableProjectExactKeys(
    value,
    ['sourceRef', 'sourceSpan', 'label'],
    label
  );
  if (!isPlainRecord(record.sourceRef)) {
    throw new TypeError(`${label}.sourceRef must be a plain object.`);
  }
  const sourceRef = canonicalClone(
    record.sourceRef,
    `${label}.sourceRef`
  ) as DiagnosticTargetRef;
  const sourceSpan =
    record.sourceSpan === undefined
      ? undefined
      : (canonicalClone(
          record.sourceSpan,
          `${label}.sourceSpan`
        ) as SourceSpan);
  const traceLabel =
    record.label === undefined
      ? undefined
      : normalizeIdentifier(record.label, `${label}.label`);
  return Object.freeze({
    sourceRef,
    ...(sourceSpan ? { sourceSpan } : {}),
    ...(traceLabel ? { label: traceLabel } : {}),
  });
};

export const normalizeExecutableProjectWorkspaceRef = (
  value: unknown
): ExecutionWorkspaceSnapshotRef => {
  const record = assertExecutableProjectExactKeys(
    value,
    ['workspaceId', 'snapshotId', 'partitionRevisions'],
    'Executable project workspace reference'
  );
  const partitionRevisions = record.partitionRevisions;
  if (partitionRevisions !== undefined && !isPlainRecord(partitionRevisions)) {
    throw new TypeError(
      'Executable project workspace partition revisions must be a plain object.'
    );
  }
  const normalizedPartitions = partitionRevisions
    ? Object.freeze(
        Object.fromEntries(
          Object.entries(partitionRevisions)
            .map(([key, revision]) => [
              normalizeIdentifier(key, 'Workspace partition key'),
              normalizeIdentifier(revision, `Workspace partition ${key}`),
            ])
            .sort(([left], [right]) => left.localeCompare(right))
        )
      )
    : undefined;
  return Object.freeze({
    workspaceId: normalizeIdentifier(record.workspaceId, 'Workspace id'),
    snapshotId: normalizeIdentifier(record.snapshotId, 'Workspace snapshot id'),
    ...(normalizedPartitions
      ? { partitionRevisions: normalizedPartitions }
      : {}),
  });
};

export const normalizeExecutableProjectTarget = (
  value: unknown
): ExecutableProjectTarget => {
  const record = assertExecutableProjectExactKeys(
    value,
    ['presetId', 'framework', 'runtime'],
    'Executable project target'
  );
  return Object.freeze({
    presetId: normalizeIdentifier(record.presetId, 'Target preset id'),
    framework: normalizeIdentifier(record.framework, 'Target framework'),
    runtime: normalizeIdentifier(record.runtime, 'Target runtime'),
  });
};

export const normalizeExecutableProjectCommand = (
  value: unknown,
  label: string
): ExecutableProjectCommand => {
  const record = assertExecutableProjectExactKeys(
    value,
    ['command', 'args'],
    label
  );
  const args = record.args ?? [];
  if (!Array.isArray(args))
    throw new TypeError(`${label}.args must be an array.`);
  if (args.length > EXECUTABLE_PROJECT_LIMITS.maxCommandArguments) {
    throw new TypeError(`${label} contains too many arguments.`);
  }
  const normalizedArgs = Object.freeze(
    args.map((argument, index) => {
      if (typeof argument !== 'string' || argument.includes('\0')) {
        throw new TypeError(
          `${label} argument ${index} must be a safe string.`
        );
      }
      if (
        argument.length > EXECUTABLE_PROJECT_LIMITS.maxCommandArgumentLength
      ) {
        throw new TypeError(
          `${label} argument ${index} exceeds the size limit.`
        );
      }
      return argument;
    })
  );
  const command = normalizeIdentifier(record.command, `${label} command`);
  if (!(EXECUTABLE_PROJECT_COMMANDS as readonly string[]).includes(command)) {
    throw new TypeError(`${label} command is not allowlisted: ${command}.`);
  }
  return Object.freeze({
    command: command as ExecutableProjectCommandName,
    args: normalizedArgs,
  });
};

export const normalizeExecutableProjectEntrypoints = (
  value: unknown,
  files: readonly ExecutableProjectFile[]
): readonly ExecutableProjectEntrypoint[] => {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(
      'Executable project entrypoints must be a non-empty array.'
    );
  }
  if (value.length > EXECUTABLE_PROJECT_LIMITS.maxEntrypoints) {
    throw new TypeError('Executable project contains too many entrypoints.');
  }
  const filePaths = new Set(files.map((file) => file.path));
  const seen = new Set<string>();
  const entrypoints = value.map((entry, index) => {
    const record = assertExecutableProjectExactKeys(
      entry,
      ['kind', 'path'],
      `Executable project entrypoint ${index}`
    );
    const kind = record.kind;
    if (kind !== 'preview' && kind !== 'build' && kind !== 'test') {
      throw new TypeError(
        `Unsupported executable project entrypoint kind: ${kind}`
      );
    }
    const path = normalizeExecutableProjectPath(record.path);
    const identity = `${kind}:${path}`;
    if (seen.has(identity)) {
      throw new TypeError(
        `Duplicate executable project entrypoint: ${identity}`
      );
    }
    if (!filePaths.has(path)) {
      throw new TypeError(
        `Executable project entrypoint does not exist: ${path}`
      );
    }
    seen.add(identity);
    return Object.freeze({ kind, path });
  });
  entrypoints.sort((left, right) =>
    left.kind === right.kind
      ? left.path.localeCompare(right.path)
      : left.kind.localeCompare(right.kind)
  );
  return Object.freeze(entrypoints);
};

const normalizeCapabilities = (
  value: unknown,
  label: string
): readonly ExecutionProviderCapability[] => {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array.`);
  const allowed = new Set<string>(EXECUTION_PROVIDER_CAPABILITIES);
  const seen = new Set<string>();
  const capabilities = value.map((capability) => {
    if (typeof capability !== 'string' || !allowed.has(capability)) {
      throw new TypeError(
        `${label} contains an unsupported capability: ${capability}`
      );
    }
    if (seen.has(capability)) {
      throw new TypeError(
        `${label} contains a duplicate capability: ${capability}`
      );
    }
    seen.add(capability);
    return capability as ExecutionProviderCapability;
  });
  capabilities.sort((left, right) => left.localeCompare(right));
  return Object.freeze(capabilities);
};

export const normalizeExecutableProjectCapabilityRequirements = (
  value: unknown
): ExecutableProjectCapabilityRequirements => {
  const record = assertExecutableProjectExactKeys(
    value,
    ['preview', 'build', 'test'],
    'Executable project capability requirements'
  );
  return Object.freeze({
    preview: normalizeCapabilities(record.preview, 'Preview capabilities'),
    build: normalizeCapabilities(record.build, 'Build capabilities'),
    test: normalizeCapabilities(record.test, 'Test capabilities'),
  });
};

export const normalizeExecutableProjectPublicBuildConfiguration = (
  value: unknown
): readonly ExecutableProjectPublicBuildConfigurationEntry[] => {
  if (!Array.isArray(value)) {
    throw new TypeError(
      'Executable project public build configuration must be an array.'
    );
  }
  if (
    value.length > EXECUTABLE_PROJECT_LIMITS.maxPublicBuildConfigurationEntries
  ) {
    throw new TypeError(
      'Executable project public build configuration is too large.'
    );
  }
  const seen = new Set<string>();
  const entries = value.map((entry, index) => {
    const record = assertExecutableProjectExactKeys(
      entry,
      ['name', 'value', 'classification'],
      `Executable project public build configuration ${index}`
    );
    const name = normalizeIdentifier(
      record.name,
      `Executable project public build configuration ${index} name`
    );
    if (seen.has(name)) {
      throw new TypeError(`Duplicate public build configuration name: ${name}`);
    }
    if (typeof record.value !== 'string' || record.value.includes('\0')) {
      throw new TypeError(
        `Public build configuration ${name} must be a safe string.`
      );
    }
    if (record.classification !== 'public-build') {
      throw new TypeError(
        `Public build configuration ${name} must be explicitly classified public-build.`
      );
    }
    seen.add(name);
    return Object.freeze({
      name,
      value: record.value,
      classification: 'public-build' as const,
    });
  });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  return Object.freeze(entries);
};

const normalizePositiveHint = (value: unknown, label: string): number => {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new TypeError(`${label} must be a positive safe integer.`);
  }
  return value as number;
};

export const normalizeExecutableProjectResourceHints = (
  value: unknown
): ExecutableProjectResourceHints => {
  const record = assertExecutableProjectExactKeys(
    value ?? {},
    ['cpuCores', 'memoryMb', 'diskMb', 'timeoutMs', 'maxOutputBytes'],
    'Executable project resource hints'
  );
  return Object.freeze({
    ...(record.cpuCores === undefined
      ? {}
      : { cpuCores: normalizePositiveHint(record.cpuCores, 'CPU cores') }),
    ...(record.memoryMb === undefined
      ? {}
      : { memoryMb: normalizePositiveHint(record.memoryMb, 'Memory MB') }),
    ...(record.diskMb === undefined
      ? {}
      : { diskMb: normalizePositiveHint(record.diskMb, 'Disk MB') }),
    ...(record.timeoutMs === undefined
      ? {}
      : { timeoutMs: normalizePositiveHint(record.timeoutMs, 'Timeout') }),
    ...(record.maxOutputBytes === undefined
      ? {}
      : {
          maxOutputBytes: normalizePositiveHint(
            record.maxOutputBytes,
            'Maximum output bytes'
          ),
        }),
  });
};

export const normalizeExecutableProjectCacheHints = (
  value: unknown
): ExecutableProjectCacheHints => {
  const record = assertExecutableProjectExactKeys(
    value ?? { dependencyInstall: 'reuse-if-matched' },
    ['dependencyInstall'],
    'Executable project cache hints'
  );
  if (
    record.dependencyInstall !== 'reuse-if-matched' &&
    record.dependencyInstall !== 'isolated'
  ) {
    throw new TypeError(
      'Unsupported executable project dependency cache policy.'
    );
  }
  return Object.freeze({ dependencyInstall: record.dependencyInstall });
};

export const normalizeExecutableProjectTestPlan = (
  value: unknown
): ExecutableProjectTestPlan => {
  const record = assertExecutableProjectExactKeys(
    value ?? {},
    ['framework', 'command', 'reportFilePath'],
    'Executable project test plan'
  );
  const framework = record.framework ?? 'vitest';
  if (framework !== 'vitest') {
    throw new TypeError(
      `Unsupported executable project test framework: ${framework}`
    );
  }
  const reportFilePath = normalizeExecutableProjectPath(
    record.reportFilePath ?? DEFAULT_EXECUTABLE_PROJECT_TEST_REPORT_PATH
  );
  return Object.freeze({
    framework,
    command: normalizeExecutableProjectCommand(
      record.command ?? createDefaultTestCommand(reportFilePath),
      'Executable project test command'
    ),
    reportFilePath,
  });
};

export const normalizeExecutableProjectCommands = (
  record: Record<string, unknown>
) =>
  Object.freeze({
    installCommand: normalizeExecutableProjectCommand(
      record.installCommand ?? DEFAULT_INSTALL_COMMAND,
      'Executable project install command'
    ),
    previewCommand: normalizeExecutableProjectCommand(
      record.previewCommand ?? DEFAULT_PREVIEW_COMMAND,
      'Executable project preview command'
    ),
    buildCommand: normalizeExecutableProjectCommand(
      record.buildCommand ?? DEFAULT_BUILD_COMMAND,
      'Executable project build command'
    ),
  });

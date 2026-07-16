import type {
  ExecutionProviderCapability,
  ExecutionSourceTrace,
  ExecutionWorkspaceSnapshotRef,
} from './execution.types';

export const EXECUTABLE_PROJECT_SNAPSHOT_FORMAT =
  'prodivix.executable-project.v1' as const;

export const EXECUTABLE_PROJECT_LIMITS = Object.freeze({
  maxFiles: 20_000,
  maxFileBytes: 32 * 1024 * 1024,
  maxTotalFileBytes: 256 * 1024 * 1024,
  maxPathLength: 1_024,
  maxCommandArguments: 256,
  maxCommandArgumentLength: 16_384,
  maxSourceTracesPerFile: 256,
  maxEntrypoints: 32,
  maxPublicBuildConfigurationEntries: 128,
});

export const EXECUTABLE_PROJECT_COMMANDS = Object.freeze([
  'npm',
  'pnpm',
  'yarn',
  'bun',
  'corepack',
  'node',
] as const);

export const DEFAULT_EXECUTABLE_PROJECT_TEST_REPORT_PATH =
  '.prodivix/test-report.json';

export type ExecutableProjectCommandName =
  (typeof EXECUTABLE_PROJECT_COMMANDS)[number];

export type ExecutableProjectFile = Readonly<{
  path: string;
  contents: string | Uint8Array;
  sourceTrace?: readonly ExecutionSourceTrace[];
}>;

export type ExecutableProjectCommand = Readonly<{
  command: ExecutableProjectCommandName;
  args?: readonly string[];
}>;

export type ExecutableProjectTarget = Readonly<{
  presetId: string;
  framework: string;
  runtime: string;
}>;

export type ExecutableProjectDependencyPlan = Readonly<{
  manifestFilePath: string;
  lockFilePath?: string;
  installFingerprint: string;
}>;

export type ExecutableProjectDependencyPlanInput = Readonly<{
  manifestFilePath: string;
  lockFilePath?: string;
}>;

export type ExecutableProjectEntrypointKind = 'preview' | 'build' | 'test';

export type ExecutableProjectEntrypoint = Readonly<{
  kind: ExecutableProjectEntrypointKind;
  path: string;
}>;

export type ExecutableProjectCapabilityRequirements = Readonly<{
  preview: readonly ExecutionProviderCapability[];
  build: readonly ExecutionProviderCapability[];
  test: readonly ExecutionProviderCapability[];
}>;

export type ExecutableProjectPublicBuildConfigurationEntry = Readonly<{
  name: string;
  value: string;
  classification: 'public-build';
}>;

export type ExecutableProjectResourceHints = Readonly<{
  cpuCores?: number;
  memoryMb?: number;
  diskMb?: number;
  timeoutMs?: number;
  maxOutputBytes?: number;
}>;

export type ExecutableProjectCacheHints = Readonly<{
  dependencyInstall: 'reuse-if-matched' | 'isolated';
}>;

export type ExecutableProjectTestPlan = Readonly<{
  framework: 'vitest';
  command: ExecutableProjectCommand;
  reportFilePath: string;
}>;

export type ExecutableProjectTestPlanInput = Readonly<{
  framework?: 'vitest';
  command?: ExecutableProjectCommand;
  reportFilePath?: string;
}>;

export type ExecutableProjectSnapshot = Readonly<{
  format: typeof EXECUTABLE_PROJECT_SNAPSHOT_FORMAT;
  workspace: ExecutionWorkspaceSnapshotRef;
  target: ExecutableProjectTarget;
  contentDigest: string;
  files: readonly ExecutableProjectFile[];
  dependencyPlan: ExecutableProjectDependencyPlan;
  entrypoints: readonly ExecutableProjectEntrypoint[];
  capabilityRequirements: ExecutableProjectCapabilityRequirements;
  publicBuildConfiguration: readonly ExecutableProjectPublicBuildConfigurationEntry[];
  resourceHints: ExecutableProjectResourceHints;
  cacheHints: ExecutableProjectCacheHints;
  installCommand: ExecutableProjectCommand;
  previewCommand: ExecutableProjectCommand;
  buildCommand: ExecutableProjectCommand;
  testPlan: ExecutableProjectTestPlan;
}>;

export type ExecutableProjectSnapshotInput = Readonly<{
  workspace: ExecutionWorkspaceSnapshotRef;
  target: ExecutableProjectTarget;
  files: readonly ExecutableProjectFile[];
  dependencyPlan: ExecutableProjectDependencyPlanInput;
  entrypoints: readonly ExecutableProjectEntrypoint[];
  capabilityRequirements: ExecutableProjectCapabilityRequirements;
  publicBuildConfiguration?: readonly ExecutableProjectPublicBuildConfigurationEntry[];
  resourceHints?: ExecutableProjectResourceHints;
  cacheHints?: ExecutableProjectCacheHints;
  installCommand?: ExecutableProjectCommand;
  previewCommand?: ExecutableProjectCommand;
  buildCommand?: ExecutableProjectCommand;
  testPlan?: ExecutableProjectTestPlanInput;
}>;

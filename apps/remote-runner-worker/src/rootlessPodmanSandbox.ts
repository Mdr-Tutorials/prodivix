import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import type {
  ExecutableProjectCommand,
  ExecutableProjectSnapshot,
} from '@prodivix/runtime-core';
import type {
  RemoteWorkerSandbox,
  RemoteWorkerSandboxResult,
} from './worker.types';

const execFileAsync = promisify(execFile);

export type RootlessPodmanSandboxLimits = Readonly<{
  maximumCpuCores: number;
  maximumMemoryMb: number;
  maximumDiskMb: number;
  maximumPids: number;
  maximumOpenFiles: number;
  temporaryDirectoryMb: number;
}>;

export type CreateRootlessPodmanSandboxOptions = Readonly<{
  imageReference: string;
  podmanCommand?: string;
  limits: RootlessPodmanSandboxLimits;
  allowUnpinnedImageForGate?: boolean;
}>;

const imageIsImmutable = (value: string): boolean =>
  /^sha256:[a-f0-9]{64}$/u.test(value) || /@sha256:[a-f0-9]{64}$/u.test(value);

const positive = (value: number, label: string): number => {
  if (!Number.isFinite(value) || value <= 0)
    throw new TypeError(`${label} must be positive.`);
  return value;
};

const profileCommand = (
  snapshot: ExecutableProjectSnapshot,
  profile: 'preview' | 'test' | 'build'
): ExecutableProjectCommand =>
  profile === 'preview'
    ? snapshot.previewCommand
    : profile === 'test'
      ? snapshot.testPlan.command
      : snapshot.buildCommand;

const redact = (value: string, secrets: readonly string[]): string =>
  secrets
    .filter((secret) => secret.length >= 4)
    .reduce((output, secret) => output.split(secret).join('[REDACTED]'), value);

const rootlessFromInfo = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const host = (value as { host?: unknown }).host;
  if (!host || typeof host !== 'object') return false;
  const security = (host as { security?: unknown }).security;
  return (
    !!security &&
    typeof security === 'object' &&
    (security as { rootless?: unknown }).rootless === true
  );
};

export const verifyRootlessPodmanEngine = async (
  podmanCommand = 'podman'
): Promise<void> => {
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(podmanCommand, [
      'info',
      '--format',
      'json',
    ]));
  } catch {
    throw new Error('Rootless Podman is required but is not available.');
  }
  let info: unknown;
  try {
    info = JSON.parse(stdout) as unknown;
  } catch {
    throw new Error('Podman returned an invalid engine descriptor.');
  }
  if (!rootlessFromInfo(info))
    throw new Error('Podman engine is not running rootless.');
};

export const createRootlessPodmanRunArguments = (
  input: Readonly<{
    name: string;
    imageReference: string;
    uid: number;
    gid: number;
    cpuCores: number;
    memoryMb: number;
    diskMb: number;
    pids: number;
    openFiles: number;
    temporaryDirectoryMb: number;
    executionId?: string;
  }>
): readonly string[] =>
  Object.freeze([
    'run',
    '--rm',
    '--pull=never',
    `--name=${input.name}`,
    `--label=prodivix.remote-execution=${input.executionId ?? input.name}`,
    '--network=none',
    '--read-only',
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '--userns=keep-id',
    `--user=${input.uid}:${input.gid}`,
    '--ipc=private',
    '--uts=private',
    '--log-driver=none',
    `--cpus=${input.cpuCores}`,
    `--memory=${input.memoryMb}m`,
    `--memory-swap=${input.memoryMb}m`,
    `--pids-limit=${input.pids}`,
    `--ulimit=nofile=${input.openFiles}:${input.openFiles}`,
    '--ulimit=core=0:0',
    `--tmpfs=/workspace:rw,nosuid,nodev,size=${input.diskMb}m,mode=0700,uid=${input.uid},gid=${input.gid}`,
    `--tmpfs=/tmp:rw,noexec,nosuid,nodev,size=${input.temporaryDirectoryMb}m,mode=0700,uid=${input.uid},gid=${input.gid}`,
    '--workdir=/workspace',
    input.imageReference,
  ]);

type Output = {
  stdout: string;
  stderr: string;
  usedBytes: number;
  truncated: boolean;
};

const appendOutput = (
  output: Output,
  stream: 'stdout' | 'stderr',
  chunk: Buffer,
  maximumBytes: number
): void => {
  const remaining = Math.max(0, maximumBytes - output.usedBytes);
  const accepted = chunk.subarray(0, remaining);
  output[stream] += accepted.toString('utf8');
  output.usedBytes += accepted.byteLength;
  if (accepted.byteLength < chunk.byteLength) output.truncated = true;
};

const payload = (
  snapshot: ExecutableProjectSnapshot,
  profile: 'preview' | 'test' | 'build'
) =>
  JSON.stringify({
    files: snapshot.files.map((file) => ({
      path: file.path,
      contents: Buffer.from(file.contents).toString('base64'),
    })),
    publicEnvironment: snapshot.publicBuildConfiguration.map((entry) => ({
      name: entry.name,
      value: entry.value,
    })),
    installCommand: {
      command: snapshot.installCommand.command,
      args: [...(snapshot.installCommand.args ?? [])],
    },
    command: {
      command: profileCommand(snapshot, profile).command,
      args: [...(profileCommand(snapshot, profile).args ?? [])],
    },
  });

/** Runs exact snapshots in a rootless OCI boundary without host mounts or inherited credentials. */
export const createRootlessPodmanSandbox = (
  options: CreateRootlessPodmanSandboxOptions
): RemoteWorkerSandbox => {
  if (
    !options.allowUnpinnedImageForGate &&
    !imageIsImmutable(options.imageReference)
  )
    throw new TypeError(
      'Production sandbox image must use an immutable digest.'
    );
  const limits = Object.freeze({
    maximumCpuCores: positive(
      options.limits.maximumCpuCores,
      'Sandbox CPU limit'
    ),
    maximumMemoryMb: positive(
      options.limits.maximumMemoryMb,
      'Sandbox memory limit'
    ),
    maximumDiskMb: positive(options.limits.maximumDiskMb, 'Sandbox disk limit'),
    maximumPids: positive(options.limits.maximumPids, 'Sandbox PID limit'),
    maximumOpenFiles: positive(
      options.limits.maximumOpenFiles,
      'Sandbox open-file limit'
    ),
    temporaryDirectoryMb: positive(
      options.limits.temporaryDirectoryMb,
      'Sandbox temporary-directory limit'
    ),
  });
  const podmanCommand = options.podmanCommand ?? 'podman';
  return Object.freeze({
    async execute(input): Promise<RemoteWorkerSandboxResult> {
      if (process.platform !== 'linux' || !process.getuid || !process.getgid)
        throw new Error('Rootless Podman sandbox requires Linux.');
      const uid = process.getuid();
      const gid = process.getgid();
      if (uid === 0)
        throw new Error('Rootless sandbox worker must not run as root.');
      const name = `prodivix-${input.executionId.replace(/[^a-zA-Z0-9_.-]/gu, '-').slice(0, 40)}-${randomUUID().slice(0, 8)}`;
      const cpuCores = Math.min(
        input.snapshot.resourceHints.cpuCores ?? limits.maximumCpuCores,
        limits.maximumCpuCores
      );
      const memoryMb = Math.min(
        input.snapshot.resourceHints.memoryMb ?? limits.maximumMemoryMb,
        limits.maximumMemoryMb
      );
      const diskMb = Math.min(
        input.snapshot.resourceHints.diskMb ?? limits.maximumDiskMb,
        limits.maximumDiskMb
      );
      const args = createRootlessPodmanRunArguments({
        name,
        imageReference: options.imageReference,
        uid,
        gid,
        cpuCores,
        memoryMb,
        diskMb,
        pids: limits.maximumPids,
        openFiles: limits.maximumOpenFiles,
        temporaryDirectoryMb: limits.temporaryDirectoryMb,
        executionId: input.executionId,
      });
      const output: Output = {
        stdout: '',
        stderr: '',
        usedBytes: 0,
        truncated: false,
      };
      const child = spawn(podmanCommand, [...args], {
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { PATH: process.env.PATH },
      });
      let timedOut = false;
      let aborted = input.signal.aborted;
      let stopping = false;
      const stop = (): void => {
        if (stopping) return;
        stopping = true;
        void execFileAsync(podmanCommand, ['stop', '--time=1', name])
          .catch(() => execFileAsync(podmanCommand, ['kill', name]))
          .catch(() => undefined);
      };
      const timer = setTimeout(() => {
        timedOut = true;
        stop();
      }, input.timeoutMs);
      const onAbort = () => {
        aborted = true;
        stop();
      };
      input.signal.addEventListener('abort', onAbort, { once: true });
      child.stdout.on('data', (chunk: Buffer) =>
        appendOutput(output, 'stdout', chunk, input.maximumOutputBytes)
      );
      child.stderr.on('data', (chunk: Buffer) =>
        appendOutput(output, 'stderr', chunk, input.maximumOutputBytes)
      );
      child.stdin.end(payload(input.snapshot, input.profile));
      const exitCode = await new Promise<number>((resolveExit, rejectExit) => {
        child.once('error', rejectExit);
        child.once('close', (code) => resolveExit(code ?? 1));
        if (aborted) stop();
      }).finally(() => {
        clearTimeout(timer);
        input.signal.removeEventListener('abort', onAbort);
      });
      return Object.freeze({
        status: aborted
          ? 'cancelled'
          : timedOut
            ? 'timed-out'
            : exitCode === 0
              ? 'succeeded'
              : 'failed',
        exitCode,
        stdout: redact(output.stdout, input.redactValues),
        stderr: redact(output.stderr, input.redactValues),
        outputTruncated: output.truncated,
      });
    },
  });
};

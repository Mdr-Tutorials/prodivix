import { execFile } from 'node:child_process';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { createExecutableProjectSnapshot } from '@prodivix/runtime-core';
import {
  createRootlessPodmanSandbox,
  verifyRootlessPodmanEngine,
} from '../src/rootlessPodmanSandbox';

const execFileAsync = promisify(execFile);
const podman = process.env.PRODIVIX_ROOTLESS_PODMAN_COMMAND ?? 'podman';
const baseImage =
  process.env.PRODIVIX_ROOTLESS_BASE_IMAGE ??
  'docker.io/library/node:22-bookworm-slim';
const gateImage = 'localhost/prodivix-remote-sandbox:gate';
const repositoryRoot = resolve(import.meta.dirname, '../../..');

const command = async (args: readonly string[]): Promise<string> => {
  const { stdout } = await execFileAsync(podman, [...args], {
    cwd: repositoryRoot,
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout.trim();
};

const imageDigest = async (reference: string): Promise<string> => {
  const digest = await command([
    'image',
    'inspect',
    '--format',
    '{{.Digest}}',
    reference,
  ]);
  if (!/^sha256:[a-f0-9]{64}$/u.test(digest))
    throw new Error(`Container image has no immutable digest: ${reference}.`);
  return digest;
};

const probeSource = String.raw`
const fs = require('node:fs');
const net = require('node:net');
const read = (path) => { try { return fs.readFileSync(path, 'utf8').trim(); } catch { return ''; } };
let rootReadOnly = false;
try { fs.writeFileSync('/prodivix-root-write-probe', 'denied'); } catch { rootReadOnly = true; }
fs.writeFileSync('/workspace/write-probe', 'ok');
const status = read('/proc/self/status');
const capEff = /^CapEff:\s*([0-9a-f]+)/mi.exec(status)?.[1] ?? '';
const noNewPrivs = /^NoNewPrivs:\s*(\d+)/mi.exec(status)?.[1] ?? '';
const mountInfo = read('/proc/self/mountinfo');
const workspaceMount = mountInfo.split('\n').find((line) => line.includes(' /workspace ')) ?? '';
const stat = fs.statfsSync('/workspace');
const workspaceBytes = Number(stat.blocks) * Number(stat.bsize);
const cpu = read('/sys/fs/cgroup/cpu.max');
const memory = read('/sys/fs/cgroup/memory.max');
const pids = read('/sys/fs/cgroup/pids.max');
const networkDenied = await new Promise((resolve) => {
  const socket = net.connect({ host: '1.1.1.1', port: 53 });
  const finish = (value) => { socket.destroy(); resolve(value); };
  socket.once('connect', () => finish(false));
  socket.once('error', () => finish(true));
  setTimeout(() => finish(true), 1500).unref();
});
console.log(JSON.stringify({
  uid: process.getuid(),
  gid: process.getgid(),
  rootReadOnly,
  workspaceWritable: read('/workspace/write-probe') === 'ok',
  workspaceIsTmpfs: workspaceMount.includes(' - tmpfs '),
  workspaceNoSuid: workspaceMount.includes('nosuid'),
  workspaceNoDev: workspaceMount.includes('nodev'),
  workspaceBytes,
  capEff,
  noNewPrivs,
  networkDenied,
  containerSocketAbsent: !fs.existsSync('/var/run/docker.sock') && !fs.existsSync('/run/podman/podman.sock'),
  hostPathAbsent: !fs.existsSync('/host'),
  workerSecretAbsent: process.env.REMOTE_WORKER_TOKEN === undefined,
  cpu,
  memory,
  pids,
}));
`;

const snapshot = (executionId: string, source: string) =>
  createExecutableProjectSnapshot({
    workspace: {
      workspaceId: `workspace-${executionId}`,
      snapshotId: `snapshot-${executionId}`,
      partitionRevisions: { workspace: '1' },
    },
    target: { presetId: 'rootless-gate', framework: 'node', runtime: 'node' },
    files: [{ path: 'package.json', contents: '{"private":true}' }],
    dependencyPlan: { manifestFilePath: 'package.json' },
    entrypoints: [{ kind: 'build', path: 'package.json' }],
    capabilityRequirements: {
      preview: ['filesystem'],
      build: ['filesystem', 'build'],
      test: ['filesystem', 'test'],
    },
    publicBuildConfiguration: [],
    resourceHints: { cpuCores: 1, memoryMb: 256, diskMb: 64 },
    cacheHints: { dependencyInstall: 'isolated' },
    installCommand: { command: 'node', args: ['-e', 'process.exit(0)'] },
    buildCommand: {
      command: 'node',
      args: ['--input-type=module', '-e', source],
    },
  });

const numberLimit = (value: string, label: string): number => {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`${label} is not enforced.`);
  return result;
};

const assertProbe = (value: unknown): void => {
  if (!value || typeof value !== 'object')
    throw new Error('Sandbox security probe did not return an object.');
  const probe = value as Record<string, unknown>;
  for (const property of [
    'rootReadOnly',
    'workspaceWritable',
    'workspaceIsTmpfs',
    'workspaceNoSuid',
    'workspaceNoDev',
    'networkDenied',
    'containerSocketAbsent',
    'hostPathAbsent',
    'workerSecretAbsent',
  ]) {
    if (probe[property] !== true)
      throw new Error(`Sandbox security property failed: ${property}.`);
  }
  if (probe.uid === 0 || probe.gid === 0)
    throw new Error('Sandbox command ran as root.');
  if (probe.capEff !== '0000000000000000')
    throw new Error('Sandbox retained Linux capabilities.');
  if (probe.noNewPrivs !== '1')
    throw new Error('Sandbox no-new-privileges is not active.');
  if (
    numberLimit(String(probe.workspaceBytes), 'Workspace tmpfs') >
    72 * 1024 * 1024
  )
    throw new Error('Sandbox workspace disk limit is not enforced.');
  if (numberLimit(String(probe.memory), 'Memory') > 256 * 1024 * 1024)
    throw new Error('Sandbox memory limit is not enforced.');
  if (numberLimit(String(probe.pids), 'PID') > 32)
    throw new Error('Sandbox PID limit is not enforced.');
  const [quota, period] = String(probe.cpu).split(' ').map(Number);
  if (!quota || !period || quota / period > 1)
    throw new Error('Sandbox CPU limit is not enforced.');
};

await verifyRootlessPodmanEngine(podman);
await command(['pull', baseImage]);
const baseDigest = await imageDigest(baseImage);
const baseRepository = baseImage.includes('@')
  ? baseImage.slice(0, baseImage.indexOf('@'))
  : baseImage.includes(':')
    ? baseImage.slice(0, baseImage.lastIndexOf(':'))
    : baseImage;
await command([
  'build',
  '--pull=never',
  '--build-arg',
  `NODE_IMAGE=${baseRepository}@${baseDigest}`,
  '--file',
  'apps/remote-runner-worker/sandbox/Dockerfile',
  '--tag',
  gateImage,
  '.',
]);
const sandboxDigest = await imageDigest(gateImage);
const sandbox = createRootlessPodmanSandbox({
  imageReference: sandboxDigest,
  podmanCommand: podman,
  limits: {
    maximumCpuCores: 1,
    maximumMemoryMb: 256,
    maximumDiskMb: 64,
    maximumPids: 32,
    maximumOpenFiles: 128,
    temporaryDirectoryMb: 32,
  },
});

const probeResult = await sandbox.execute({
  executionId: 'gate-security',
  snapshot: snapshot('gate-security', probeSource),
  profile: 'build',
  timeoutMs: 15_000,
  maximumOutputBytes: 256 * 1024,
  redactValues: [],
  signal: new AbortController().signal,
});
if (probeResult.status !== 'succeeded')
  throw new Error(`Rootless security probe failed: ${probeResult.stderr}`);
const probeLine = probeResult.stdout.trim().split(/\r?\n/u).at(-1);
if (!probeLine) throw new Error('Rootless security probe produced no result.');
assertProbe(JSON.parse(probeLine) as unknown);

const cancellation = new AbortController();
setTimeout(() => cancellation.abort('gate-cancel'), 500);
const cancelled = await sandbox.execute({
  executionId: 'gate-cancel',
  snapshot: snapshot(
    'gate-cancel',
    'await new Promise((resolve) => setTimeout(resolve, 30000));'
  ),
  profile: 'build',
  timeoutMs: 10_000,
  maximumOutputBytes: 64 * 1024,
  redactValues: [],
  signal: cancellation.signal,
});
if (cancelled.status !== 'cancelled')
  throw new Error('Rootless cancellation did not stop the sandbox.');

for (let attempt = 0; attempt < 20; attempt += 1) {
  const names = await command([
    'ps',
    '--all',
    '--filter',
    'label=prodivix.remote-execution=gate-cancel',
    '--format',
    '{{.Names}}',
  ]);
  if (!names) break;
  if (attempt === 19)
    throw new Error('Cancelled sandbox left an orphan container.');
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
}

process.stdout.write(
  `${JSON.stringify({
    gate: 'g2-rootless-sandbox',
    engine: 'podman-rootless',
    baseImage: `${baseRepository}@${baseDigest}`,
    sandboxImage: sandboxDigest,
    securityProbe: 'passed',
    cancellationCleanup: 'passed',
  })}\n`
);

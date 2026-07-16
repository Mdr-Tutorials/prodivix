import { describe, expect, it } from 'vitest';
import {
  createRootlessPodmanRunArguments,
  createRootlessPodmanSandbox,
  verifyRootlessPodmanEngine,
} from './rootlessPodmanSandbox';

describe('rootless Podman sandbox contract', () => {
  it('requires an immutable production image', () => {
    expect(() =>
      createRootlessPodmanSandbox({
        imageReference: 'localhost/prodivix-sandbox:latest',
        limits: {
          maximumCpuCores: 1,
          maximumMemoryMb: 256,
          maximumDiskMb: 64,
          maximumPids: 32,
          maximumOpenFiles: 128,
          temporaryDirectoryMb: 32,
        },
      })
    ).toThrow(/immutable digest/u);
  });

  it('fails closed when the rootless engine is unavailable', async () => {
    await expect(
      verifyRootlessPodmanEngine('prodivix-missing-podman-command')
    ).rejects.toThrow('Rootless Podman is required');
  });

  it('constructs a no-mount, no-network, least-privilege OCI invocation', () => {
    const args = createRootlessPodmanRunArguments({
      name: 'prodivix-gate',
      executionId: 'gate-security',
      imageReference: `sha256:${'a'.repeat(64)}`,
      uid: 1001,
      gid: 1001,
      cpuCores: 1,
      memoryMb: 256,
      diskMb: 64,
      pids: 32,
      openFiles: 128,
      temporaryDirectoryMb: 32,
    });
    expect(args).toEqual(
      expect.arrayContaining([
        '--network=none',
        '--read-only',
        '--cap-drop=ALL',
        '--security-opt=no-new-privileges',
        '--userns=keep-id',
        '--user=1001:1001',
        '--ipc=private',
        '--uts=private',
        '--memory=256m',
        '--memory-swap=256m',
        '--pids-limit=32',
        '--ulimit=nofile=128:128',
        '--ulimit=core=0:0',
        '--log-driver=none',
      ])
    );
    expect(args.some((arg) => arg === '-v' || arg.startsWith('--volume'))).toBe(
      false
    );
    expect(args.some((arg) => arg.startsWith('--privileged'))).toBe(false);
  });
});

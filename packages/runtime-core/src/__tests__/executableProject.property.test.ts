import { describe, expect, it } from 'vitest';
import {
  assertExecutableProjectCapabilitySupport,
  createExecutableProjectSnapshot,
  EXECUTABLE_PROJECT_SNAPSHOT_FORMAT,
  type ExecutableProjectSnapshotInput,
} from '../executableProject';

const createInput = (): ExecutableProjectSnapshotInput => ({
  workspace: {
    workspaceId: 'workspace-1',
    snapshotId: 'snapshot-1',
    partitionRevisions: {
      route: '2',
      workspace: '1',
    },
  },
  target: {
    presetId: 'react-vite',
    framework: 'react',
    runtime: 'vite',
  },
  files: [
    {
      path: 'src/main.ts',
      contents: 'export const value = 1;',
      sourceTrace: [
        {
          sourceRef: { kind: 'workspace', workspaceId: 'workspace-1' } as const,
          label: 'main',
        },
      ],
    },
    { path: 'package.json', contents: '{"private":true}' },
  ],
  dependencyPlan: { manifestFilePath: 'package.json' },
  entrypoints: [{ kind: 'preview' as const, path: 'src/main.ts' }],
  capabilityRequirements: {
    preview: ['filesystem', 'dependency-install'] as const,
    build: ['filesystem', 'build'] as const,
    test: ['filesystem', 'test'] as const,
  },
  publicBuildConfiguration: [],
  resourceHints: { timeoutMs: 30_000 },
  cacheHints: { dependencyInstall: 'reuse-if-matched' as const },
  installCommand: { command: 'corepack', args: ['pnpm', 'install'] },
  previewCommand: { command: 'pnpm', args: ['run', 'dev'] },
  buildCommand: { command: 'pnpm', args: ['run', 'build'] },
  testPlan: {
    framework: 'vitest' as const,
    command: { command: 'pnpm', args: ['run', 'test'] },
    reportFilePath: '.prodivix/report.json',
  },
});

describe('executable project snapshot properties', () => {
  it('normalizes order and derives one deterministic SHA-256 content digest', () => {
    const input = createInput();
    const left = createExecutableProjectSnapshot(input);
    const right = createExecutableProjectSnapshot({
      ...input,
      workspace: {
        ...input.workspace,
        partitionRevisions: {
          workspace: '1',
          route: '2',
        },
      },
      files: [...input.files].reverse(),
    });

    expect(left).toEqual(right);
    expect(left.format).toBe(EXECUTABLE_PROJECT_SNAPSHOT_FORMAT);
    expect(left.contentDigest).toMatch(/^sha256-[a-f0-9]{64}$/u);
    expect(left.files.map((file) => file.path)).toEqual([
      'package.json',
      'src/main.ts',
    ]);
    expect(Object.isFrozen(left)).toBe(true);
    expect(Object.isFrozen(left.files)).toBe(true);
  });

  it('changes the digest for executable content, commands, target, or source trace', () => {
    const input = createInput();
    const baseline = createExecutableProjectSnapshot(input).contentDigest;
    const variants = [
      {
        ...input,
        files: input.files.map((file) =>
          file.path === 'package.json' ? { ...file, contents: '{}' } : file
        ),
      },
      {
        ...input,
        previewCommand: {
          command: 'pnpm' as const,
          args: ['run', 'preview'],
        },
      },
      { ...input, target: { ...input.target, framework: 'vue' } },
      {
        ...input,
        files: input.files.map((file) =>
          file.path === 'src/main.ts'
            ? {
                ...file,
                sourceTrace: [
                  {
                    sourceRef: {
                      kind: 'workspace' as const,
                      workspaceId: 'workspace-2',
                    },
                  },
                ],
              }
            : file
        ),
      },
    ];

    variants.forEach((variant) => {
      expect(createExecutableProjectSnapshot(variant).contentDigest).not.toBe(
        baseline
      );
    });
  });

  it('clones binary contents before publishing the immutable snapshot', () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const snapshot = createExecutableProjectSnapshot({
      ...createInput(),
      files: [...createInput().files, { path: 'asset.bin', contents: bytes }],
    });

    bytes[0] = 9;
    expect(snapshot.files[0]?.contents).toEqual(new Uint8Array([1, 2, 3]));
  });

  it.each([
    '../escape.ts',
    '/absolute.ts',
    'C:/drive.ts',
    'src\\windows.ts',
    'src//empty.ts',
  ])('rejects unsafe project path %s', (path) => {
    expect(() =>
      createExecutableProjectSnapshot({
        ...createInput(),
        files: [...createInput().files, { path, contents: '' }],
      })
    ).toThrow(TypeError);
  });

  it('rejects duplicate topology and literal environment escape hatches', () => {
    expect(() =>
      createExecutableProjectSnapshot({
        ...createInput(),
        files: [...createInput().files, { path: 'src', contents: '' }],
      })
    ).toThrow(/both a file and a directory/u);

    expect(() =>
      createExecutableProjectSnapshot({
        ...createInput(),
        previewCommand: {
          command: 'pnpm',
          args: ['run', 'dev'],
          environment: { SECRET: 'material' },
        } as never,
      })
    ).toThrow(/unsupported field: environment/u);

    expect(() =>
      createExecutableProjectSnapshot({
        ...createInput(),
        previewCommand: { command: 'powershell', args: ['-Command', 'echo'] },
      } as never)
    ).toThrow(/not allowlisted/u);
  });

  it('fails closed when an adapter cannot satisfy the operation capabilities', () => {
    const snapshot = createExecutableProjectSnapshot(createInput());
    expect(() =>
      assertExecutableProjectCapabilitySupport(snapshot, 'preview', [
        'filesystem',
      ])
    ).toThrow(/dependency-install/u);
    expect(() =>
      assertExecutableProjectCapabilitySupport(snapshot, 'preview', [
        'dependency-install',
        'filesystem',
      ])
    ).not.toThrow();
  });
});

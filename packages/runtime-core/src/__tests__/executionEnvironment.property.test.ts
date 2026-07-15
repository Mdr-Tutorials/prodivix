import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  createEnvironmentBindingReference,
  createExecutionEnvironmentSnapshotRef,
  createExecutionProviderDescriptor,
  createExecutionRequest,
  createSecretRef,
  getExecutionProviderCompatibility,
  type ExecutionEnvironmentMode,
} from '..';

const propertyParameters = Object.freeze({
  numRuns: 100,
  seed: 0x20_07_2026,
});

const canonicalIdentifier = fc.stringMatching(/^[a-z][a-z0-9._:-]{0,30}$/);

describe('execution environment properties', () => {
  it('creates immutable references and clones environment identity into requests', () => {
    fc.assert(
      fc.property(
        canonicalIdentifier,
        canonicalIdentifier,
        fc.constantFrom<ExecutionEnvironmentMode>('mock', 'live'),
        (environmentId, revision, mode) => {
          const source = { environmentId, revision, mode };
          const environment = createExecutionEnvironmentSnapshotRef(source);
          const binding = createEnvironmentBindingReference({
            bindingId: environmentId,
          });
          const secret = createSecretRef({ bindingId: revision });
          const request = createExecutionRequest({
            requestId: 'request-1',
            profile: 'preview',
            runtimeZone: 'client',
            workspace: {
              workspaceId: 'workspace-1',
              snapshotId: 'snapshot-1',
            },
            environment: source,
            invocation: {
              kind: 'workspace',
              targetRef: {
                kind: 'workspace',
                workspaceId: 'workspace-1',
              },
            },
          });

          expect(environment).toEqual(source);
          expect(request.environment).toEqual(source);
          expect(request.environment).not.toBe(source);
          expect(request.requiredCapabilities).toContain('environment-binding');
          expect(Object.isFrozen(environment)).toBe(true);
          expect(Object.isFrozen(request.environment)).toBe(true);
          expect(Object.isFrozen(binding)).toBe(true);
          expect(Object.isFrozen(secret)).toBe(true);
        }
      ),
      propertyParameters
    );
  });

  it('rejects non-canonical identities, unsupported modes and value-bearing fields', () => {
    const invalidReferences: readonly unknown[] = [
      { environmentId: '', revision: '1', mode: 'mock' },
      { environmentId: ' env', revision: '1', mode: 'mock' },
      { environmentId: 'env', revision: '1 ', mode: 'mock' },
      { environmentId: 'env', revision: '1', mode: 'preview' },
      { environmentId: 'env', revision: '1', mode: 'live', value: 'secret' },
    ];
    invalidReferences.forEach((reference) => {
      expect(() =>
        createExecutionEnvironmentSnapshotRef(
          reference as Parameters<
            typeof createExecutionEnvironmentSnapshotRef
          >[0]
        )
      ).toThrow(TypeError);
    });

    expect(() =>
      createSecretRef({ bindingId: 'token', value: 'secret' } as never)
    ).toThrow(TypeError);
    expect(() =>
      createEnvironmentBindingReference({ bindingId: ' token' })
    ).toThrow(TypeError);
    expect(() =>
      createExecutionRequest({
        requestId: 'request-1',
        profile: 'preview',
        runtimeZone: 'client',
        workspace: {
          workspaceId: 'workspace-1',
          snapshotId: 'snapshot-1',
        },
        environment: {
          environmentId: 'env',
          revision: '1',
          mode: 'live',
          value: 'secret',
        } as never,
        invocation: {
          kind: 'workspace',
          targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
        },
      })
    ).toThrow(TypeError);
  });

  it('requires environment support even for requests not created by the factory', () => {
    const base = createExecutionRequest({
      requestId: 'request-1',
      profile: 'preview',
      runtimeZone: 'client',
      workspace: { workspaceId: 'workspace-1', snapshotId: 'snapshot-1' },
      invocation: {
        kind: 'workspace',
        targetRef: { kind: 'workspace', workspaceId: 'workspace-1' },
      },
    });
    const compatibility = getExecutionProviderCompatibility(
      createExecutionProviderDescriptor({
        id: 'preview-provider',
        version: '1',
        isolation: 'same-context',
        profiles: ['preview'],
        runtimeZones: ['client'],
        invocationKinds: ['workspace'],
      }),
      {
        ...base,
        environment: createExecutionEnvironmentSnapshotRef({
          environmentId: 'environment-1',
          revision: '1',
          mode: 'mock',
        }),
        requiredCapabilities: [],
      }
    );

    expect(compatibility).toMatchObject({
      compatible: false,
      reasons: [{ kind: 'capability', capability: 'environment-binding' }],
    });
  });
});

import { describe, expect, it, vi } from 'vitest';
import {
  canResolveExecutionSecret,
  createExecutionEnvironmentPrincipalPartitionId,
  createExecutionEnvironmentResolutionService,
  EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES,
  ExecutionEnvironmentResolutionError,
  type ExecutionEnvironmentExecutionClass,
  type ExecutionEnvironmentResolutionRequest,
  type ExecutionEnvironmentSnapshot,
  type ExecutionProviderIsolation,
  type RuntimeZone,
} from '..';

const environment: ExecutionEnvironmentSnapshot = Object.freeze({
  environmentId: 'environment-main',
  revision: 'revision-7',
  mode: 'live',
  publicBindingsById: Object.freeze({
    endpoint: 'https://api.example.test',
    feature: Object.freeze({ enabled: true }),
  }),
  secretBindingIds: Object.freeze(['access-token']),
});

const baseRequest = (
  overrides: Partial<ExecutionEnvironmentResolutionRequest> = {}
): ExecutionEnvironmentResolutionRequest => ({
  leaseId: 'lease-1',
  workspaceId: 'workspace-1',
  principal: {
    principalId: 'principal-1',
    sessionId: 'session-1',
  },
  providerId: 'remote-provider',
  providerIsolation: 'remote-isolated',
  executionClass: 'isolated-runner',
  profile: 'production',
  runtimeZone: 'server',
  environment: {
    environmentId: 'environment-main',
    revision: 'revision-7',
    mode: 'live',
  },
  purpose: {
    kind: 'data-operation',
    resourceId: 'data-products:list',
    adapterId: 'core.http',
  },
  bindings: [
    { bindingId: 'endpoint', kind: 'public', field: 'baseUrl' },
    { bindingId: 'feature', kind: 'public', field: 'feature' },
    { bindingId: 'access-token', kind: 'secret', field: 'authorization' },
  ],
  ...overrides,
});

const createService = (
  input: Readonly<{
    snapshot?: ExecutionEnvironmentSnapshot;
    allowed?: boolean;
    now?: () => number;
    secret?: string;
    publishAudit?: (event: object) => void;
  }> = {}
) =>
  createExecutionEnvironmentResolutionService({
    snapshots: {
      load: () => input.snapshot ?? environment,
    },
    permissions: {
      authorize: () =>
        input.allowed === false
          ? { allowed: false }
          : {
              allowed: true,
              grantId: 'grant-1',
              permissionRevision: 'permission-3',
              expiresAt: 1_100,
            },
    },
    secrets: {
      read: () => input.secret ?? 'canary-secret-value',
    },
    now: input.now ?? (() => 1_000),
    publishAudit: input.publishAudit,
  });

describe('execution environment resolution', () => {
  it('resolves exact public bindings and consumes Secret material only inside the scoped callback', async () => {
    const audits: object[] = [];
    const service = createService({
      publishAudit: (event) => audits.push(event),
    });
    const lease = await service.resolve(baseRequest());
    const publicValue = lease.readPublicBinding(
      { bindingId: 'feature' },
      'feature'
    );
    let injected = '';

    await lease.useSecret(
      { bindingId: 'access-token' },
      'authorization',
      (material) => {
        injected = `Bearer ${material}`;
      }
    );

    expect(publicValue).toEqual({ enabled: true });
    expect(Object.isFrozen(publicValue)).toBe(true);
    expect(() =>
      lease.readPublicBinding({ bindingId: 'endpoint' }, 'operation.path')
    ).toThrowError(
      expect.objectContaining({
        code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.bindingMissing,
      })
    );
    expect(injected).toBe('Bearer canary-secret-value');
    expect(lease.metadata).toEqual({
      leaseId: 'lease-1',
      principal: {
        principalId: 'principal-1',
        sessionId: 'session-1',
      },
      environment: {
        environmentId: 'environment-main',
        revision: 'revision-7',
        mode: 'live',
      },
      grantId: 'grant-1',
      permissionRevision: 'permission-3',
      expiresAt: 1_100,
    });
    expect(audits.map((event) => (event as { kind: string }).kind)).toEqual([
      'lease-issued',
      'public-binding-read',
      'secret-binding-used',
    ]);
    expect(
      audits.every(
        (event) =>
          (event as { principalId: string }).principalId === 'principal-1' &&
          (event as { sessionId: string }).sessionId === 'session-1'
      )
    ).toBe(true);
    expect(JSON.stringify({ lease, audits })).not.toContain(
      'canary-secret-value'
    );
  });

  it('derives a non-reversible cache partition from the exact principal and session', () => {
    const first = createExecutionEnvironmentPrincipalPartitionId({
      principalId: 'principal-1',
      sessionId: 'session-1',
    });
    expect(first).toBe(
      createExecutionEnvironmentPrincipalPartitionId({
        principalId: 'principal-1',
        sessionId: 'session-1',
      })
    );
    expect(first).not.toBe(
      createExecutionEnvironmentPrincipalPartitionId({
        principalId: 'principal-1',
        sessionId: 'session-2',
      })
    );
    expect(first).not.toContain('principal-1');
    expect(first).not.toContain('session-1');
  });

  it('enforces the explicit Secret runtime-zone and provider isolation matrix', () => {
    const runtimeZones: readonly RuntimeZone[] = [
      'client',
      'worker',
      'server',
      'edge',
      'build',
      'test',
    ];
    const isolations: readonly ExecutionProviderIsolation[] = [
      'same-context',
      'worker',
      'sandboxed',
      'remote-isolated',
    ];
    const executionClasses: readonly ExecutionEnvironmentExecutionClass[] = [
      'browser',
      'shared-worker',
      'trusted-service',
      'isolated-runner',
      'build',
    ];

    for (const runtimeZone of runtimeZones) {
      for (const providerIsolation of isolations) {
        for (const executionClass of executionClasses) {
          const expected =
            (runtimeZone === 'worker' &&
              providerIsolation === 'remote-isolated' &&
              executionClass === 'isolated-runner') ||
            ((runtimeZone === 'server' || runtimeZone === 'edge') &&
              (providerIsolation === 'sandboxed' ||
                providerIsolation === 'remote-isolated') &&
              (executionClass === 'trusted-service' ||
                executionClass === 'isolated-runner')) ||
            (runtimeZone === 'test' &&
              (providerIsolation === 'sandboxed' ||
                providerIsolation === 'remote-isolated') &&
              executionClass === 'isolated-runner');
          expect(
            canResolveExecutionSecret({
              runtimeZone,
              providerIsolation,
              executionClass,
            }),
            `${runtimeZone}/${providerIsolation}/${executionClass}`
          ).toBe(expected);
        }
      }
    }
  });

  it.each([
    {
      label: 'missing snapshot',
      service: () =>
        createExecutionEnvironmentResolutionService({
          snapshots: { load: () => undefined },
          permissions: {
            authorize: () => {
              throw new Error('must not authorize');
            },
          },
          secrets: { read: () => undefined },
        }),
      request: () => baseRequest(),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.snapshotMissing,
    },
    {
      label: 'stale revision',
      service: () => createService(),
      request: () =>
        baseRequest({
          environment: {
            environmentId: 'environment-main',
            revision: 'revision-stale',
            mode: 'live',
          },
        }),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.revisionMismatch,
    },
    {
      label: 'mode mismatch',
      service: () => createService(),
      request: () =>
        baseRequest({
          environment: {
            environmentId: 'environment-main',
            revision: 'revision-7',
            mode: 'mock',
          },
        }),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.modeMismatch,
    },
    {
      label: 'binding missing',
      service: () => createService(),
      request: () =>
        baseRequest({
          bindings: [
            { bindingId: 'unknown', kind: 'public', field: 'baseUrl' },
          ],
        }),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.bindingMissing,
    },
    {
      label: 'binding kind drift',
      service: () => createService(),
      request: () =>
        baseRequest({
          bindings: [
            { bindingId: 'access-token', kind: 'public', field: 'token' },
          ],
        }),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.bindingKindMismatch,
    },
    {
      label: 'client Secret',
      service: () => createService(),
      request: () => baseRequest({ runtimeZone: 'client' }),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.secretZoneDenied,
    },
    {
      label: 'permission denial',
      service: () => createService({ allowed: false }),
      request: () => baseRequest(),
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.permissionDenied,
    },
  ])('fails closed before issuing a lease for $label', async (entry) => {
    await expect(
      entry.service().resolve(entry.request())
    ).rejects.toMatchObject({
      code: entry.code,
      message: 'Execution environment resolution was denied.',
    });
  });

  it('expires and revokes leases without exposing Secret material in errors or audit', async () => {
    let currentTime = 1_000;
    const audit = vi.fn();
    const lease = await createService({
      now: () => currentTime,
      publishAudit: audit,
    }).resolve(baseRequest());

    currentTime = 1_101;
    expect(() =>
      lease.readPublicBinding({ bindingId: 'endpoint' }, 'baseUrl')
    ).toThrowError(
      expect.objectContaining({
        code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.leaseExpired,
      })
    );

    currentTime = 1_050;
    lease.revoke();
    await expect(
      lease.useSecret(
        { bindingId: 'access-token' },
        'authorization',
        () => undefined
      )
    ).rejects.toMatchObject({
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.leaseRevoked,
    });
    const serialized = JSON.stringify({
      audits: audit.mock.calls,
      error: new ExecutionEnvironmentResolutionError(
        EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.secretUnavailable
      ),
    });
    expect(serialized).not.toContain('canary-secret-value');
  });

  it('rechecks lease activity after asynchronous Secret loading', async () => {
    let currentTime = 1_000;
    let resolveMaterial!: (value: string) => void;
    const material = new Promise<string>((resolve) => {
      resolveMaterial = resolve;
    });
    const consumer = vi.fn();
    const service = createExecutionEnvironmentResolutionService({
      snapshots: { load: () => environment },
      permissions: {
        authorize: () => ({
          allowed: true,
          grantId: 'grant-1',
          permissionRevision: 'permission-3',
          expiresAt: 1_100,
        }),
      },
      secrets: { read: () => material },
      now: () => currentTime,
    });
    const lease = await service.resolve(baseRequest());
    const use = lease.useSecret(
      { bindingId: 'access-token' },
      'authorization',
      consumer
    );
    currentTime = 1_101;
    resolveMaterial('canary-secret-value');

    await expect(use).rejects.toMatchObject({
      code: EXECUTION_ENVIRONMENT_RESOLUTION_ERROR_CODES.leaseExpired,
    });
    expect(consumer).not.toHaveBeenCalled();
  });
});

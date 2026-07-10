import { describe, expect, it, vi } from 'vitest';
import type {
  CapabilityRequest,
  PluginManifestV1,
  PluginDiagnostic,
} from '@prodivix/plugin-contracts';
import {
  capabilityIdentityFromRequest,
  createPluginOwnerRef,
  pluginHostFailure,
  pluginHostSuccess,
  type HostContributionPointMap,
  type LivePermissionGuard,
  type PermissionSnapshot,
  type PluginOwnerRef,
  type PluginRuntimeActivationInput,
} from '@prodivix/plugin-host';
import {
  createBrowserGatewaySessionFactory,
  createBuiltInGatewayContractRegistry,
  createInMemoryGatewayAuditStore,
  redactGatewayAuditMetadata,
  type BuiltInGatewayServicePorts,
  type BrowserGatewayQuotaPolicy,
  type GatewayDocumentPatchResponse,
  type GatewayAuditStore,
  type GatewayWorkspaceSummary,
} from '#browser/index';

type PermissionHarness = Readonly<{
  guard: LivePermissionGuard;
  setSnapshot(snapshot: PermissionSnapshot | undefined): void;
}>;

const createSnapshot = (
  owner: PluginOwnerRef,
  manifest: PluginManifestV1,
  revision: number,
  granted: boolean
): PermissionSnapshot => {
  const decisions = manifest.capabilities.map((request) =>
    Object.freeze({
      capability: capabilityIdentityFromRequest(request),
      decision: granted ? ('grant' as const) : ('deny' as const),
      source: 'user' as const,
      reasonCode: granted ? 'test-grant' : 'test-deny',
      optional: request.optional ?? false,
    })
  );
  return Object.freeze({
    owner,
    pluginVersion: manifest.version,
    permissionRevision: revision,
    policyRevision: `policy-${revision}`,
    policySource: 'test',
    decisions: Object.freeze(decisions),
    granted: Object.freeze(
      decisions
        .filter(({ decision }) => decision === 'grant')
        .map(({ capability }) => capability)
    ),
    deniedRequired: Object.freeze(
      decisions
        .filter(({ decision, optional }) => decision === 'deny' && !optional)
        .map(({ capability }) => capability)
    ),
    deniedOptional: Object.freeze(
      decisions
        .filter(({ decision, optional }) => decision === 'deny' && optional)
        .map(({ capability }) => capability)
    ),
  });
};

const createPermissionHarness = (
  initial: PermissionSnapshot
): PermissionHarness => {
  let current: PermissionSnapshot | undefined = initial;
  const listeners = new Set<
    (snapshot: PermissionSnapshot | undefined) => void
  >();
  return {
    guard: {
      getSnapshot: () => current,
      isGranted: (capability) =>
        Boolean(
          current?.granted.some(
            (entry) =>
              entry.id === capability.id && entry.scope === capability.scope
          )
        ),
      subscribe: (listener) => {
        listeners.add(listener);
        return { dispose: () => listeners.delete(listener) };
      },
    },
    setSnapshot: (snapshot) => {
      current = snapshot;
      for (const listener of [...listeners]) listener(snapshot);
    },
  };
};

const createManifest = (
  capabilities: readonly CapabilityRequest[]
): PluginManifestV1 => ({
  schemaVersion: '1.0',
  id: '@test/gateway',
  displayName: 'Gateway fixture',
  version: '1.0.0',
  publisher: 'test',
  engines: { prodivix: '^0.1.0' },
  entrypoints: { runtime: { path: 'dist/runtime.js' } },
  capabilities: [...capabilities],
  contributes: [],
});

const createActivation = (
  capabilities: readonly CapabilityRequest[],
  granted = true
): Readonly<{
  activation: PluginRuntimeActivationInput<HostContributionPointMap>;
  permission: PermissionHarness;
}> => {
  const manifest = createManifest(capabilities);
  const owner = createPluginOwnerRef(manifest.id, 'installation-1', 1);
  const permission = createPermissionHarness(
    createSnapshot(owner, manifest, 1, granted)
  );
  return {
    activation: {
      owner,
      manifest,
      runtimeArtifact: {
        path: 'dist/runtime.js',
        bytes: new Uint8Array(),
        digest: 'sha256-runtime',
        packageDigest: 'sha256-package',
      },
      event: { type: 'manual' },
      operationId: 'operation-1',
      sessionToken: 'session-1',
      permission: permission.guard,
      contributions: { stage: () => pluginHostSuccess(undefined) },
    },
    permission,
  };
};

const defaultServices = (): BuiltInGatewayServicePorts => ({
  telemetry: { emit: async () => pluginHostSuccess(undefined) },
  workspace: {
    readSummary: async () =>
      pluginHostSuccess({
        workspaceId: 'workspace-1',
        revision: 4,
        documentCount: 2,
        routeCount: 1,
        componentCount: 3,
      }),
    dispatchIntent: async () =>
      pluginHostSuccess({
        accepted: true,
        operationId: 'intent-operation-1',
        revision: 5,
      }),
  },
  documents: {
    read: async (_context, request) =>
      pluginHostSuccess({
        documentId: request.documentId,
        revision: 3,
        content: { kind: 'fixture' },
      }),
    applyPatch: async (_context, request) =>
      pluginHostSuccess({
        documentId: request.documentId,
        revision: request.baseRevision + 1,
        applied: true,
      }),
  },
});

const createSession = async (
  activation: PluginRuntimeActivationInput<HostContributionPointMap>,
  services: BuiltInGatewayServicePorts,
  options: Readonly<{
    audit?: GatewayAuditStore;
    maxTimeoutMs?: number;
    quota?: Partial<BrowserGatewayQuotaPolicy>;
    onDiagnostic?: (diagnostic: PluginDiagnostic) => void;
  }> = {}
) => {
  const contracts = createBuiltInGatewayContractRegistry(services);
  if (!contracts.ok) throw new Error('Expected built-in Gateway contracts.');
  const factory = createBrowserGatewaySessionFactory<HostContributionPointMap>({
    contracts: contracts.value,
    ...(options.audit ? { auditStore: options.audit } : {}),
    ...(options.onDiagnostic ? { onDiagnostic: options.onDiagnostic } : {}),
    ...(options.maxTimeoutMs || options.quota
      ? {
          quotaPolicy: {
            ...options.quota,
            ...(options.maxTimeoutMs
              ? { maxTimeoutMs: options.maxTimeoutMs }
              : {}),
          },
        }
      : {}),
    createEventId: (() => {
      let id = 0;
      return () => `audit-${++id}`;
    })(),
    now: Date.now,
    wallClock: Date.now,
  });
  const created = await factory.create(activation);
  if (!created.ok) throw new Error(created.diagnostics[0].message);
  return created.value;
};

describe('browser Gateway dispatcher', () => {
  it('validates requests and executes an exact granted contract', async () => {
    const fixture = createActivation([
      { id: 'telemetry.emit', reason: 'Emit bounded fixture telemetry.' },
    ]);
    const session = await createSession(fixture.activation, defaultServices());

    const accepted = await session.dispatch(
      {
        method: 'telemetry/emit',
        contractVersion: '1.0',
        payload: { name: 'fixture.event', level: 'info' },
      },
      new AbortController().signal
    );
    const invalid = await session.dispatch(
      {
        method: 'telemetry/emit',
        contractVersion: '1.0',
        payload: { name: 'fixture.event', level: 'verbose' },
      },
      new AbortController().signal
    );

    expect(accepted).toMatchObject({ ok: true, value: { accepted: true } });
    expect(invalid.ok).toBe(false);
    expect(invalid.diagnostics[0].code).toBe('PLG-4032');
  });

  it('distinguishes unrequested and currently denied capabilities', async () => {
    const unrequested = createActivation([]);
    const unrequestedSession = await createSession(
      unrequested.activation,
      defaultServices()
    );
    const denied = createActivation(
      [{ id: 'workspace.read', reason: 'Read workspace summary.' }],
      false
    );
    const deniedSession = await createSession(
      denied.activation,
      defaultServices()
    );

    const first = await unrequestedSession.dispatch(
      {
        method: 'workspace/read-summary',
        contractVersion: '1.0',
        payload: {},
      },
      new AbortController().signal
    );
    const second = await deniedSession.dispatch(
      {
        method: 'workspace/read-summary',
        contractVersion: '1.0',
        payload: {},
      },
      new AbortController().signal
    );

    expect(first.diagnostics[0].code).toBe('PLG-4030');
    expect(second.diagnostics[0].code).toBe('PLG-4031');
  });

  it('fails closed before a sensitive service when audit is unavailable', async () => {
    const fixture = createActivation([
      { id: 'workspace.read', reason: 'Read workspace summary.' },
    ]);
    const readSummary = vi.fn(async () =>
      pluginHostSuccess({
        workspaceId: 'workspace-1',
        revision: 1,
        documentCount: 0,
        routeCount: 0,
        componentCount: 0,
      })
    );
    const services = {
      ...defaultServices(),
      workspace: {
        ...defaultServices().workspace!,
        readSummary,
      },
    };
    const session = await createSession(fixture.activation, services);

    const result = await session.dispatch(
      {
        method: 'workspace/read-summary',
        contractVersion: '1.0',
        payload: {},
      },
      new AbortController().signal
    );

    expect(result.diagnostics[0].code).toBe('PLG-4060');
    expect(readSummary).not.toHaveBeenCalled();
  });

  it('aborts a document effect and suppresses its result when permission is revoked mid-flight', async () => {
    const capability = {
      id: 'document.write' as const,
      scope: 'workspace/source',
      reason: 'Apply a validated document patch.',
    };
    const fixture = createActivation([capability]);
    const audit = createInMemoryGatewayAuditStore();
    let signalStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      signalStarted = resolve;
    });
    let effectApplied = false;
    const services = {
      ...defaultServices(),
      documents: {
        ...defaultServices().documents!,
        applyPatch: async (
          context: Parameters<
            NonNullable<BuiltInGatewayServicePorts['documents']>['applyPatch']
          >[0],
          request: Parameters<
            NonNullable<BuiltInGatewayServicePorts['documents']>['applyPatch']
          >[1]
        ) => {
          signalStarted();
          await new Promise<void>((resolve) =>
            context.signal.addEventListener('abort', () => resolve(), {
              once: true,
            })
          );
          if (!context.signal.aborted) effectApplied = true;
          return pluginHostSuccess<GatewayDocumentPatchResponse>({
            documentId: request.documentId,
            revision: request.baseRevision + 1,
            applied: true,
          });
        },
      },
    };
    const session = await createSession(fixture.activation, services, {
      audit,
    });
    const pending = session.dispatch(
      {
        method: 'document/apply-patch',
        contractVersion: '1.0',
        payload: {
          documentId: 'document-1',
          scope: capability.scope,
          baseRevision: 1,
          patch: { value: 'secret-token-must-not-be-audited' },
        },
      },
      new AbortController().signal
    );
    await started;
    fixture.permission.setSnapshot(
      createSnapshot(
        fixture.activation.owner,
        fixture.activation.manifest,
        2,
        false
      )
    );

    const result = await pending;

    expect(result.diagnostics[0].code).toBe('PLG-4031');
    expect(effectApplied).toBe(false);
    expect(JSON.stringify(audit.snapshot())).not.toContain('secret-token');
  });

  it('aborts a handler at the bounded Gateway deadline', async () => {
    const capability = {
      id: 'document.write' as const,
      scope: 'workspace/source',
      reason: 'Apply a validated document patch.',
    };
    const fixture = createActivation([capability]);
    const audit = createInMemoryGatewayAuditStore();
    const services = {
      ...defaultServices(),
      documents: {
        ...defaultServices().documents!,
        applyPatch: async (
          context: Parameters<
            NonNullable<BuiltInGatewayServicePorts['documents']>['applyPatch']
          >[0]
        ) => {
          await new Promise<void>((resolve) =>
            context.signal.addEventListener('abort', () => resolve(), {
              once: true,
            })
          );
          return pluginHostFailure<GatewayDocumentPatchResponse>([
            {
              code: 'PLG-4039',
              severity: 'error',
              domain: 'plugin',
              message: 'Canceled fixture.',
              hint: 'Fixture.',
              docsUrl: '/reference/diagnostics/plg-4039',
              retryable: true,
              meta: { stage: 'gateway' },
            },
          ]);
        },
      },
    };
    const session = await createSession(fixture.activation, services, {
      audit,
      maxTimeoutMs: 20,
    });

    const result = await session.dispatch(
      {
        method: 'document/apply-patch',
        contractVersion: '1.0',
        payload: {
          documentId: 'document-1',
          scope: capability.scope,
          baseRevision: 1,
          patch: null,
        },
      },
      new AbortController().signal
    );

    expect(result.diagnostics[0].code).toBe('PLG-4035');
  });

  it('invalidates in-flight work when the bound plugin generation changes', async () => {
    const fixture = createActivation([
      {
        id: 'workspace.intent.dispatch',
        reason: 'Dispatch a validated workspace intent.',
      },
    ]);
    const audit = createInMemoryGatewayAuditStore();
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    let effectApplied = false;
    const services = {
      ...defaultServices(),
      workspace: {
        ...defaultServices().workspace!,
        dispatchIntent: async (
          context: Parameters<
            NonNullable<
              BuiltInGatewayServicePorts['workspace']
            >['dispatchIntent']
          >[0]
        ) => {
          markStarted();
          await new Promise<void>((resolve) =>
            context.signal.addEventListener('abort', () => resolve(), {
              once: true,
            })
          );
          if (!context.signal.aborted) effectApplied = true;
          return pluginHostSuccess({
            accepted: true as const,
            operationId: 'stale-operation',
            revision: 2,
          });
        },
      },
    };
    const session = await createSession(fixture.activation, services, {
      audit,
    });
    const pending = session.dispatch(
      {
        method: 'workspace/dispatch-intent',
        contractVersion: '1.0',
        payload: { intentId: 'fixture.intent', payload: null },
      },
      new AbortController().signal
    );
    await started;
    fixture.permission.setSnapshot(
      createSnapshot(
        createPluginOwnerRef(
          fixture.activation.owner.pluginId,
          fixture.activation.owner.installationId,
          2
        ),
        fixture.activation.manifest,
        2,
        true
      )
    );

    const result = await pending;

    expect(result.diagnostics[0].code).toBe('PLG-4036');
    expect(effectApplied).toBe(false);
  });

  it('rejects a Host response that violates the method-specific Schema', async () => {
    const fixture = createActivation([
      { id: 'workspace.read', reason: 'Read workspace summary.' },
    ]);
    const audit = createInMemoryGatewayAuditStore();
    const invalidSummary = {
      workspaceId: 'workspace-1',
      revision: 1,
      documentCount: 0,
      routeCount: 0,
    } as unknown as GatewayWorkspaceSummary;
    const services = {
      ...defaultServices(),
      workspace: {
        ...defaultServices().workspace!,
        readSummary: async () => pluginHostSuccess(invalidSummary),
      },
    };
    const session = await createSession(fixture.activation, services, {
      audit,
    });

    const result = await session.dispatch(
      {
        method: 'workspace/read-summary',
        contractVersion: '1.0',
        payload: {},
      },
      new AbortController().signal
    );

    expect(result.diagnostics[0].code).toBe('PLG-4033');
  });

  it('enforces per-session rate and method concurrency limits', async () => {
    const pingFixture = createActivation([]);
    const pingSession = await createSession(
      pingFixture.activation,
      defaultServices(),
      { quota: { requestsPerSecond: 1, requestBurst: 1 } }
    );
    const firstPing = await pingSession.dispatch(
      {
        method: 'runtime.health/ping',
        contractVersion: '1.0',
        payload: { nonce: 'first' },
      },
      new AbortController().signal
    );
    const secondPing = await pingSession.dispatch(
      {
        method: 'runtime.health/ping',
        contractVersion: '1.0',
        payload: { nonce: 'second' },
      },
      new AbortController().signal
    );
    expect(firstPing.ok).toBe(true);
    expect(secondPing.diagnostics[0].code).toBe('PLG-4043');

    const intentFixture = createActivation([
      {
        id: 'workspace.intent.dispatch',
        reason: 'Dispatch a validated workspace intent.',
      },
    ]);
    const audit = createInMemoryGatewayAuditStore();
    let markStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      markStarted = resolve;
    });
    let release!: () => void;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const services = {
      ...defaultServices(),
      workspace: {
        ...defaultServices().workspace!,
        dispatchIntent: async () => {
          markStarted();
          await blocked;
          return pluginHostSuccess({
            accepted: true as const,
            operationId: 'intent-operation',
            revision: 2,
          });
        },
      },
    };
    const intentSession = await createSession(
      intentFixture.activation,
      services,
      { audit }
    );
    const firstIntent = intentSession.dispatch(
      {
        method: 'workspace/dispatch-intent',
        contractVersion: '1.0',
        payload: { intentId: 'fixture.intent', payload: null },
      },
      new AbortController().signal
    );
    await started;
    const secondIntent = await intentSession.dispatch(
      {
        method: 'workspace/dispatch-intent',
        contractVersion: '1.0',
        payload: { intentId: 'fixture.intent', payload: null },
      },
      new AbortController().signal
    );
    release();

    expect(secondIntent.diagnostics[0].code).toBe('PLG-4043');
    expect((await firstIntent).ok).toBe(true);
  });

  it('keeps secrets.read unavailable at the frozen Gateway registry', async () => {
    const fixture = createActivation([
      {
        id: 'secrets.read',
        scope: 'workspace/provider',
        reason: 'Fixture request that must remain denied.',
      },
    ]);
    const session = await createSession(fixture.activation, defaultServices());

    const result = await session.dispatch(
      {
        method: 'secrets/read',
        contractVersion: '1.0',
        payload: { scope: 'workspace/provider' },
      },
      new AbortController().signal
    );

    expect(result.diagnostics[0].code).toBe('PLG-4034');
  });

  it('writes bounded preflight/outcome records and centrally redacts metadata', async () => {
    const fixture = createActivation([
      { id: 'workspace.read', reason: 'Read workspace summary.' },
    ]);
    const audit = createInMemoryGatewayAuditStore({
      maxRecords: 2,
      maxBytes: 16 * 1024,
    });
    const session = await createSession(fixture.activation, defaultServices(), {
      audit,
    });

    const result = await session.dispatch(
      {
        method: 'workspace/read-summary',
        contractVersion: '1.0',
        payload: {},
      },
      new AbortController().signal
    );

    expect(result.ok).toBe(true);
    expect(audit.snapshot().map(({ phase }) => phase)).toEqual([
      'preflight',
      'outcome',
    ]);
    expect(
      redactGatewayAuditMetadata({
        authorization: 'Bearer private',
        note: 'Bearer private-under-an-innocent-key',
        requestBody: 'private body',
        networkOrigin: 'https://api.example.com',
      })
    ).toEqual({
      authorization: '[REDACTED]',
      networkOrigin: 'https://api.example.com',
      note: '[REDACTED]',
      requestBody: '[REDACTED]',
    });
  });

  it('reports an outcome audit warning through the Host diagnostic port', async () => {
    const fixture = createActivation([
      { id: 'workspace.read', reason: 'Read workspace summary.' },
    ]);
    let appendCount = 0;
    const audit: GatewayAuditStore = {
      append: async () => {
        appendCount += 1;
        if (appendCount === 2) throw new Error('Outcome audit unavailable.');
      },
      readRecent: async () => [],
      dispose: () => {},
    };
    const onDiagnostic = vi.fn();
    const session = await createSession(fixture.activation, defaultServices(), {
      audit,
      onDiagnostic,
    });

    const result = await session.dispatch(
      {
        method: 'workspace/read-summary',
        contractVersion: '1.0',
        payload: {},
      },
      new AbortController().signal
    );

    expect(result.ok).toBe(true);
    expect(result.diagnostics[0]?.code).toBe('PLG-4061');
    expect(onDiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PLG-4061' })
    );
  });
});

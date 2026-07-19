import {
  createMemoryDataOperationCacheStore,
  createDataOperationAdapterRegistry,
  createDataOperationDispatchCoordinator,
  executeDataOperation,
  type DataOperationCodeInputResolver,
  type DataOperationDispatchRequest,
  type DataOperationDispatchResult,
  type DataOperationInvocation,
  type DataOperationCacheRuntime,
  type DataOperationEnvironmentResolution,
  type DataOptimisticProjectionSnapshot,
  type DataOptimisticRuntime,
  type DataOperationScheduler,
  type DataLifecycleChannel,
  type DataSourceDocument,
  type ExecuteDataOperationResult,
} from '@prodivix/data';
import {
  createDataAsyncApiAdapter,
  type DataAsyncApiTransport,
} from '@prodivix/data-asyncapi';
import {
  createDataGraphqlAdapter,
  type DataGraphqlTransport,
} from '@prodivix/data-graphql';
import {
  createDataHttpAdapter,
  type DataHttpTransport,
} from '@prodivix/data-http';
import {
  createDataMockRuntimeSession,
  createDataMockRuntimeSessionFromSnapshot,
  createMemoryDataMockFixtureStore,
  type DataMockFixture,
  type DataMockCollection,
  type DataMockScheduler,
  type DataMockRuntimeSession,
} from '@prodivix/data-mock';
import {
  createBrowserNetworkAdapter,
  type CreateBrowserNetworkAdapterOptions,
} from '@prodivix/runtime-browser';
import {
  createExecutionEnvironmentPrincipalPartitionId,
  type ExecutableProjectSnapshot,
  type ExecutionNetworkTrace,
} from '@prodivix/runtime-core';

export type BrowserDataExecutionEnvironment = Readonly<{
  execute(input: BrowserDataExecuteInput): Promise<ExecuteDataOperationResult>;
  dispatch(
    input: BrowserDataDispatchInput
  ): Promise<DataOperationDispatchResult<ExecuteDataOperationResult>>;
  dispose(): void;
}>;

export type BrowserDataExecuteContext = Readonly<{
  document: DataSourceDocument;
  lifecycleChannel: DataLifecycleChannel;
  signal: AbortSignal;
  optimistic?: DataOptimisticRuntime;
  publishOptimistic?(snapshot: DataOptimisticProjectionSnapshot): void;
  publishNetworkTrace?(trace: ExecutionNetworkTrace): void;
}>;

export type BrowserDataExecuteInput = BrowserDataExecuteContext &
  Readonly<{ invocation: DataOperationInvocation }>;

export type BrowserDataDispatchInput = BrowserDataExecuteContext &
  Readonly<{ request: DataOperationDispatchRequest }>;

export type BrowserDataMockProvision = Readonly<{
  fixtureSetId: string;
  fixtures: readonly DataMockFixture[];
  emulatedAdapterIds?: readonly string[];
  scheduler?: DataMockScheduler;
  namespaceId?: string;
  collections?: readonly DataMockCollection[];
}>;

export type CreateBrowserDataExecutionEnvironmentOptions =
  CreateBrowserNetworkAdapterOptions &
    Readonly<{
      publishNetworkTrace?(trace: ExecutionNetworkTrace): void;
      scheduler?: DataOperationScheduler;
      cache?: DataOperationCacheRuntime;
      environmentResolution?: DataOperationEnvironmentResolution;
      codeInputResolver?: DataOperationCodeInputResolver;
      mock?: BrowserDataMockProvision;
      snapshot?: ExecutableProjectSnapshot;
      mockNamespaceId?: string;
    }>;

export type CreateBrowserTestDataExecutionEnvironmentOptions =
  CreateBrowserDataExecutionEnvironmentOptions;

/** Composes protocol-neutral Data execution with the browser fetch boundary without moving ownership into Web. */
export const createBrowserDataExecutionEnvironment = (
  options: CreateBrowserDataExecutionEnvironmentOptions = {}
): BrowserDataExecutionEnvironment => {
  const registry = createDataOperationAdapterRegistry();
  const ownedCacheStore = options.cache
    ? undefined
    : createMemoryDataOperationCacheStore();
  const environmentPartitionId = options.environmentResolution
    ? createExecutionEnvironmentPrincipalPartitionId(
        options.environmentResolution.principal
      )
    : undefined;
  if (
    options.cache?.partition &&
    environmentPartitionId &&
    options.cache.partition.partitionId !== environmentPartitionId
  )
    throw new TypeError(
      'Browser Data cache partition does not match the environment principal/session.'
    );
  const cache: DataOperationCacheRuntime = Object.freeze({
    ...(options.cache ?? {
      store: ownedCacheStore!,
      targetId: 'browser-data-runtime',
    }),
    ...(environmentPartitionId
      ? { partition: Object.freeze({ partitionId: environmentPartitionId }) }
      : {}),
  });
  const network = createBrowserNetworkAdapter(options);
  registry.register(
    createDataHttpAdapter({ transport: network as DataHttpTransport })
  );
  registry.register(
    createDataGraphqlAdapter({ transport: network as DataGraphqlTransport })
  );
  registry.register(
    createDataAsyncApiAdapter({ transport: network as DataAsyncApiTransport })
  );
  if (options.mock && options.snapshot?.dataMockProvision)
    throw new TypeError(
      'Browser Data execution cannot combine direct and snapshot mock provisioning.'
    );
  let mockSession: DataMockRuntimeSession | undefined;
  if (options.mock) {
    mockSession = createDataMockRuntimeSession({
      fixtureStore: createMemoryDataMockFixtureStore(options.mock),
      emulatedAdapterIds: options.mock.emulatedAdapterIds ?? [
        'core.asyncapi',
        'core.graphql',
        'core.http',
      ],
      ...(options.mock.scheduler ? { scheduler: options.mock.scheduler } : {}),
      ...(options.mock.namespaceId
        ? { namespaceId: options.mock.namespaceId }
        : {}),
      ...(options.mock.collections
        ? { collections: options.mock.collections }
        : {}),
    });
    registry.register(mockSession.adapter);
  } else if (options.snapshot?.dataMockProvision) {
    mockSession = createDataMockRuntimeSessionFromSnapshot({
      snapshot: options.snapshot,
      ...(options.mockNamespaceId
        ? { namespaceId: options.mockNamespaceId }
        : {}),
    });
    registry.register(mockSession.adapter);
  }
  const execute = (
    invocation: DataOperationInvocation,
    input: BrowserDataExecuteContext
  ): Promise<ExecuteDataOperationResult> =>
    executeDataOperation({
      registry,
      invocation,
      document: input.document,
      lifecycleChannel: input.lifecycleChannel,
      signal: input.signal,
      cache,
      ...(input.optimistic ? { optimistic: input.optimistic } : {}),
      ...(input.publishOptimistic
        ? { publishOptimistic: input.publishOptimistic }
        : {}),
      ...(options.now ? { now: options.now } : {}),
      ...(options.scheduler ? { scheduler: options.scheduler } : {}),
      ...(options.environmentResolution
        ? { environmentResolution: options.environmentResolution }
        : {}),
      publishNetworkTrace(trace) {
        options.publishNetworkTrace?.(trace);
        input.publishNetworkTrace?.(trace);
      },
    });
  const dispatcher = createDataOperationDispatchCoordinator<
    BrowserDataExecuteContext,
    ExecuteDataOperationResult
  >({
    resolveOperationKind(request, context) {
      return context.document.operationsById[request.operation.operationId]
        ?.kind;
    },
    execute,
    ...(options.codeInputResolver
      ? { codeInputResolver: options.codeInputResolver }
      : {}),
    ...(options.now ? { now: options.now } : {}),
  });
  return Object.freeze({
    execute: (input) => execute(input.invocation, input),
    dispatch: (input) => dispatcher.dispatch(input.request, input),
    dispose() {
      dispatcher.dispose();
      mockSession?.dispose();
      void ownedCacheStore?.clear();
    },
  });
};

/** Browser Test is a deterministic fixture host; production environment material is never accepted. */
export const createBrowserTestDataExecutionEnvironment = (
  options: CreateBrowserTestDataExecutionEnvironmentOptions
): BrowserDataExecutionEnvironment => {
  if (!options.mock && !options.snapshot?.dataMockProvision)
    throw new Error(
      'Browser Test Data execution requires deterministic fixture provisioning.'
    );
  if (options.environmentResolution)
    throw new Error(
      'Browser Test Data execution is mock-only and rejects environment resolution.'
    );
  const environment = createBrowserDataExecutionEnvironment(options);
  return Object.freeze({
    execute(input) {
      if (input.invocation.mode === 'live')
        throw new Error(
          'Browser Test Data execution is mock-only and denies live mode.'
        );
      return environment.execute(input);
    },
    dispatch(input) {
      if (input.request.mode === 'live')
        throw new Error(
          'Browser Test Data execution is mock-only and denies live mode.'
        );
      return environment.dispatch(input);
    },
    dispose: environment.dispose,
  });
};

import type {
  CodeReference,
  DataOperationInputBinding,
} from '@prodivix/authoring';
export type { DataOperationInputBinding } from '@prodivix/authoring';
import type {
  ExecutionEnvironmentSnapshotRef,
  ExecutionSourceTrace,
  RuntimeZone,
} from '@prodivix/runtime-core';
import type {
  DataJsonValue,
  DataOperationKind,
  DataOperationReference,
} from './data.types';
import { cloneDataJsonValue, compareDataText } from './dataJsonRuntime';
import {
  createDataOperationInvocation,
  type DataOperationActivation,
  type DataOperationInvocation,
} from './dataRuntime';

export type DataOperationTriggerOrigin =
  | Readonly<{ kind: 'route'; routeId: string }>
  | Readonly<{ kind: 'document'; documentId: string }>
  | Readonly<{ kind: 'refresh'; reason?: string }>
  | Readonly<{ kind: 'input-change'; dependencyId: string }>
  | Readonly<{
      kind: 'pagination';
      action: 'next' | 'previous' | 'replace';
    }>
  | Readonly<{
      kind: 'blueprint-event';
      documentId: string;
      nodeId: string;
      eventName: string;
      dispatchId: string;
    }>
  | Readonly<{
      kind: 'code-slot';
      slotId: string;
      reference: CodeReference;
      dispatchId: string;
    }>
  | Readonly<{
      kind: 'test';
      testId: string;
      dispatchId: string;
    }>;

export type DataOperationInputContext = Readonly<{
  triggerPayload?: DataJsonValue;
  runtimeValuesById?: Readonly<Record<string, DataJsonValue>>;
}>;

export type DataOperationCodeInputResolver = Readonly<{
  resolve(input: {
    slotId: string;
    reference: CodeReference;
    value: DataJsonValue;
  }): DataJsonValue | Promise<DataJsonValue>;
}>;

export type DataOperationDispatchRequest = Readonly<{
  operation: DataOperationReference;
  documentRevision: string;
  runtimeZone: RuntimeZone;
  mode: 'mock' | 'live';
  trigger: DataOperationTriggerOrigin;
  input: DataOperationInputBinding;
  inputContext?: DataOperationInputContext;
  environment?: ExecutionEnvironmentSnapshotRef;
  sourceTrace?: readonly ExecutionSourceTrace[];
}>;

export const DATA_DISPATCH_STATUSES = Object.freeze([
  'dispatched',
  'skipped-unchanged',
  'skipped-duplicate',
] as const);
export type DataOperationDispatchStatus =
  (typeof DATA_DISPATCH_STATUSES)[number];

export type DataOperationDispatchResult<TResult> = Readonly<{
  status: DataOperationDispatchStatus;
  invocation?: DataOperationInvocation;
  result?: TResult;
}>;

export const DATA_DISPATCH_ERROR_CODES = Object.freeze({
  disposed: 'DATA_DISPATCH_DISPOSED',
  operationMissing: 'DATA_DISPATCH_OPERATION_MISSING',
  triggerIncompatible: 'DATA_DISPATCH_TRIGGER_INCOMPATIBLE',
  inputBindingInvalid: 'DATA_DISPATCH_INPUT_BINDING_INVALID',
  inputValueMissing: 'DATA_DISPATCH_INPUT_VALUE_MISSING',
  codeResolverRequired: 'DATA_DISPATCH_CODE_RESOLVER_REQUIRED',
  codeResultInvalid: 'DATA_DISPATCH_CODE_RESULT_INVALID',
  identityInvalid: 'DATA_DISPATCH_IDENTITY_INVALID',
} as const);
export type DataOperationDispatchErrorCode =
  (typeof DATA_DISPATCH_ERROR_CODES)[keyof typeof DATA_DISPATCH_ERROR_CODES];

export class DataOperationDispatchError extends Error {
  readonly code: DataOperationDispatchErrorCode;
  readonly retryable = false;

  constructor(code: DataOperationDispatchErrorCode) {
    super('Data operation dispatch was rejected.');
    this.name = 'DataOperationDispatchError';
    this.code = code;
  }
}

export type DataOperationDispatchCoordinator<TContext, TResult> = Readonly<{
  dispatch(
    request: DataOperationDispatchRequest,
    context: TContext
  ): Promise<DataOperationDispatchResult<TResult>>;
  dispose(): void;
}>;

const canonical = (value: string): string => {
  if (
    typeof value !== 'string' ||
    !value ||
    value !== value.trim() ||
    value.includes('\0') ||
    value.length > 4_096
  )
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.identityInvalid
    );
  return value;
};

const stableJson = (value: DataJsonValue): string => JSON.stringify(value);

const normalizeCodeReference = (reference: CodeReference): CodeReference =>
  Object.freeze({
    artifactId: canonical(reference.artifactId),
    ...(reference.exportName
      ? { exportName: canonical(reference.exportName) }
      : {}),
    ...(reference.symbolId ? { symbolId: canonical(reference.symbolId) } : {}),
    ...(reference.sourceSpan
      ? { sourceSpan: Object.freeze({ ...reference.sourceSpan }) }
      : {}),
  });

/** Produces the immutable canonical form persisted by domain-owned Data input bindings. */
export const normalizeDataOperationInputBinding = (
  binding: DataOperationInputBinding
): DataOperationInputBinding => {
  let nodes = 0;
  const normalize = (
    candidate: DataOperationInputBinding,
    depth: number
  ): DataOperationInputBinding => {
    nodes += 1;
    if (nodes > 10_000 || depth > 32)
      throw new DataOperationDispatchError(
        DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
      );
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      throw new DataOperationDispatchError(
        DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
      );
    switch (candidate.kind) {
      case 'literal':
        return Object.freeze({
          kind: 'literal',
          value: cloneDataJsonValue(candidate.value),
        });
      case 'trigger-payload':
        return Object.freeze({
          kind: 'trigger-payload',
          ...(candidate.path === undefined
            ? {}
            : { path: normalizePointer(candidate.path) }),
        });
      case 'runtime-value':
        return Object.freeze({
          kind: 'runtime-value',
          valueId: canonical(candidate.valueId),
          ...(candidate.path === undefined
            ? {}
            : { path: normalizePointer(candidate.path) }),
        });
      case 'object': {
        if (
          !candidate.propertiesByKey ||
          typeof candidate.propertiesByKey !== 'object' ||
          Array.isArray(candidate.propertiesByKey)
        )
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
          );
        return Object.freeze({
          kind: 'object',
          propertiesByKey: Object.freeze(
            Object.fromEntries(
              Object.entries(candidate.propertiesByKey)
                .sort(([left], [right]) => compareDataText(left, right))
                .map(([key, child]) => [
                  canonical(key),
                  normalize(child, depth + 1),
                ])
            )
          ),
        });
      }
      case 'array':
        if (!Array.isArray(candidate.items))
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
          );
        return Object.freeze({
          kind: 'array',
          items: Object.freeze(
            candidate.items.map((child) => normalize(child, depth + 1))
          ),
        });
      case 'code':
        return Object.freeze({
          kind: 'code',
          slotId: canonical(candidate.slotId),
          reference: normalizeCodeReference(candidate.reference),
          input: normalize(candidate.input, depth + 1),
        });
    }
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
    );
  };
  return normalize(binding, 0);
};

const decodePointerToken = (token: string): string => {
  if (/~(?:[^01]|$)/u.test(token))
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
    );
  return token.replaceAll('~1', '/').replaceAll('~0', '~');
};

const normalizePointer = (pointer: string): string => {
  if (typeof pointer !== 'string' || !pointer.startsWith('/'))
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
    );
  pointer
    .slice(1)
    .split('/')
    .forEach((token) => decodePointerToken(token));
  return pointer;
};

const selectPointer = (
  value: DataJsonValue,
  pointer: string | undefined
): DataJsonValue => {
  if (pointer === undefined) return cloneDataJsonValue(value);
  if (!pointer.startsWith('/'))
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
    );
  let current = value;
  for (const token of pointer.slice(1).split('/').map(decodePointerToken)) {
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/u.test(token))
        throw new DataOperationDispatchError(
          DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
        );
      const index = Number(token);
      if (!Number.isSafeInteger(index) || index >= current.length)
        throw new DataOperationDispatchError(
          DATA_DISPATCH_ERROR_CODES.inputValueMissing
        );
      current = current[index]!;
      continue;
    }
    if (
      current === null ||
      typeof current !== 'object' ||
      !Object.prototype.hasOwnProperty.call(current, token)
    )
      throw new DataOperationDispatchError(
        DATA_DISPATCH_ERROR_CODES.inputValueMissing
      );
    current = (current as Readonly<Record<string, DataJsonValue>>)[token]!;
  }
  return cloneDataJsonValue(current);
};

const resolveInput = async (
  binding: DataOperationInputBinding,
  context: DataOperationInputContext,
  codeResolver: DataOperationCodeInputResolver | undefined
): Promise<DataJsonValue> => {
  let nodes = 0;
  const resolve = async (
    candidate: DataOperationInputBinding,
    depth: number
  ): Promise<DataJsonValue> => {
    nodes += 1;
    if (nodes > 10_000 || depth > 32)
      throw new DataOperationDispatchError(
        DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
      );
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate))
      throw new DataOperationDispatchError(
        DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
      );
    switch (candidate.kind) {
      case 'literal':
        return cloneDataJsonValue(candidate.value);
      case 'trigger-payload':
        if (context.triggerPayload === undefined)
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.inputValueMissing
          );
        return selectPointer(context.triggerPayload, candidate.path);
      case 'runtime-value': {
        const value = context.runtimeValuesById?.[canonical(candidate.valueId)];
        if (value === undefined)
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.inputValueMissing
          );
        return selectPointer(value, candidate.path);
      }
      case 'object': {
        if (
          !candidate.propertiesByKey ||
          typeof candidate.propertiesByKey !== 'object' ||
          Array.isArray(candidate.propertiesByKey)
        )
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
          );
        const entries = await Promise.all(
          Object.entries(candidate.propertiesByKey)
            .sort(([left], [right]) => compareDataText(left, right))
            .map(
              async ([key, child]) =>
                [canonical(key), await resolve(child, depth + 1)] as const
            )
        );
        return cloneDataJsonValue(Object.fromEntries(entries));
      }
      case 'array':
        if (!Array.isArray(candidate.items))
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
          );
        return cloneDataJsonValue(
          await Promise.all(
            candidate.items.map((child) => resolve(child, depth + 1))
          )
        );
      case 'code': {
        if (!codeResolver)
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.codeResolverRequired
          );
        const nested = await resolve(candidate.input, depth + 1);
        try {
          return cloneDataJsonValue(
            await codeResolver.resolve({
              slotId: canonical(candidate.slotId),
              reference: normalizeCodeReference(candidate.reference),
              value: nested,
            })
          );
        } catch (error) {
          if (error instanceof DataOperationDispatchError) throw error;
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.codeResultInvalid
          );
        }
      }
    }
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.inputBindingInvalid
    );
  };
  return resolve(binding, 0);
};

const activationFor = (
  trigger: DataOperationTriggerOrigin
): DataOperationActivation => {
  switch (trigger.kind) {
    case 'route':
    case 'document':
    case 'refresh':
    case 'input-change':
    case 'pagination':
    case 'test':
      return trigger.kind;
    case 'blueprint-event':
      return 'event';
    case 'code-slot':
      return 'code-slot';
  }
};

const dispatchIdentity = (
  trigger: DataOperationTriggerOrigin
): string | undefined =>
  trigger.kind === 'blueprint-event' ||
  trigger.kind === 'code-slot' ||
  trigger.kind === 'test'
    ? canonical(trigger.dispatchId)
    : undefined;

const assertCompatibleTrigger = (
  kind: DataOperationKind,
  trigger: DataOperationTriggerOrigin
): void => {
  const eventTrigger =
    trigger.kind === 'blueprint-event' || trigger.kind === 'code-slot';
  if (
    (kind === 'mutation' && !eventTrigger && trigger.kind !== 'test') ||
    (kind === 'query' && eventTrigger)
  )
    throw new DataOperationDispatchError(
      DATA_DISPATCH_ERROR_CODES.triggerIncompatible
    );
};

const requestKey = (request: DataOperationDispatchRequest): string =>
  JSON.stringify([
    canonical(request.operation.documentId),
    canonical(request.operation.operationId),
    canonical(request.documentRevision),
    request.runtimeZone,
    request.mode,
    request.environment ?? null,
  ]);

/** Coordinates explicit Data triggers into monotonic invocations without owning protocol or UI state. */
export const createDataOperationDispatchCoordinator = <TContext, TResult>(
  options: Readonly<{
    resolveOperationKind(
      request: DataOperationDispatchRequest,
      context: TContext
    ): DataOperationKind | undefined | Promise<DataOperationKind | undefined>;
    execute(
      invocation: DataOperationInvocation,
      context: TContext
    ): TResult | Promise<TResult>;
    codeInputResolver?: DataOperationCodeInputResolver;
    now?: () => number;
    createInvocationId?: (input: {
      operation: DataOperationReference;
      sequence: number;
      trigger: DataOperationTriggerOrigin;
    }) => string;
    maxRememberedDispatches?: number;
  }>
): DataOperationDispatchCoordinator<TContext, TResult> => {
  const maxRememberedDispatches = options.maxRememberedDispatches ?? 10_000;
  if (
    !Number.isSafeInteger(maxRememberedDispatches) ||
    maxRememberedDispatches < 1 ||
    maxRememberedDispatches > 100_000
  )
    throw new TypeError('Data dispatch retention budget is invalid.');
  const sequencesByKey = new Map<string, number>();
  const inputByQueryKey = new Map<string, string>();
  const dispatchIds = new Map<string, true>();
  let invocationSerial = 0;
  let disposed = false;

  return Object.freeze({
    async dispatch(request, context) {
      const assertActive = (): void => {
        if (disposed)
          throw new DataOperationDispatchError(
            DATA_DISPATCH_ERROR_CODES.disposed
          );
      };
      assertActive();
      const operationKind = await options.resolveOperationKind(
        request,
        context
      );
      assertActive();
      if (!operationKind)
        throw new DataOperationDispatchError(
          DATA_DISPATCH_ERROR_CODES.operationMissing
        );
      assertCompatibleTrigger(operationKind, request.trigger);
      const key = requestKey(request);
      const explicitDispatchId = dispatchIdentity(request.trigger);
      let replayKey: string | undefined;
      if (operationKind === 'mutation' && explicitDispatchId) {
        replayKey = `${key}:${explicitDispatchId}`;
        if (dispatchIds.has(replayKey))
          return Object.freeze({ status: 'skipped-duplicate' });
        dispatchIds.set(replayKey, true);
        while (dispatchIds.size > maxRememberedDispatches) {
          const oldest = dispatchIds.keys().next().value as string | undefined;
          if (!oldest) break;
          dispatchIds.delete(oldest);
        }
      }
      let mappedInput: DataJsonValue;
      try {
        mappedInput = await resolveInput(
          request.input,
          request.inputContext ?? Object.freeze({}),
          options.codeInputResolver
        );
        assertActive();
      } catch (error) {
        if (replayKey) dispatchIds.delete(replayKey);
        throw error;
      }
      let queryInputDigest: string | undefined;
      if (request.trigger.kind === 'input-change') {
        canonical(request.trigger.dependencyId);
        queryInputDigest = stableJson(mappedInput);
        if (inputByQueryKey.get(key) === queryInputDigest)
          return Object.freeze({ status: 'skipped-unchanged' });
      }
      const sequence = (sequencesByKey.get(key) ?? 0) + 1;
      if (!Number.isSafeInteger(sequence))
        throw new DataOperationDispatchError(
          DATA_DISPATCH_ERROR_CODES.identityInvalid
        );
      const nextInvocationSerial = invocationSerial + 1;
      if (!Number.isSafeInteger(nextInvocationSerial))
        throw new DataOperationDispatchError(
          DATA_DISPATCH_ERROR_CODES.identityInvalid
        );
      let invocation: DataOperationInvocation;
      try {
        const invocationId = canonical(
          options.createInvocationId?.({
            operation: request.operation,
            sequence,
            trigger: request.trigger,
          }) ?? `data-invocation:${nextInvocationSerial}`
        );
        invocation = createDataOperationInvocation({
          invocationId,
          sequence,
          attempt: 1,
          startedAt: options.now?.() ?? Date.now(),
          operation: request.operation,
          documentRevision: request.documentRevision,
          runtimeZone: request.runtimeZone,
          mode: request.mode,
          activation: activationFor(request.trigger),
          trigger: request.trigger,
          input: mappedInput,
          ...(request.environment ? { environment: request.environment } : {}),
          ...(request.sourceTrace ? { sourceTrace: request.sourceTrace } : {}),
        });
      } catch (error) {
        if (replayKey) dispatchIds.delete(replayKey);
        throw error;
      }
      sequencesByKey.set(key, sequence);
      invocationSerial = nextInvocationSerial;
      const result = await options.execute(invocation, context);
      if (queryInputDigest !== undefined)
        inputByQueryKey.set(key, queryInputDigest);
      return Object.freeze({ status: 'dispatched', invocation, result });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sequencesByKey.clear();
      inputByQueryKey.clear();
      dispatchIds.clear();
      invocationSerial = 0;
    },
  });
};

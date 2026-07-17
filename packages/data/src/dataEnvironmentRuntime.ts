import type {
  ExecutionEnvironmentBindingRequest,
  ExecutionEnvironmentExecutionClass,
  ExecutionEnvironmentPrincipalPartition,
  ExecutionEnvironmentResolutionLease,
  ExecutionEnvironmentResolutionService,
  ExecutionProfile,
  ExecutionProviderIsolation,
} from '@prodivix/runtime-core';
import type { DataOperation, DataSourceDefinition } from './data.types';
import type { DataOperationInvocation } from './dataRuntime';

export const DATA_ENVIRONMENT_RUNTIME_ERROR_CODES = Object.freeze({
  referenceRequired: 'DATA_ENVIRONMENT_REFERENCE_REQUIRED',
  resolverRequired: 'DATA_ENVIRONMENT_RESOLVER_REQUIRED',
  modeMismatch: 'DATA_ENVIRONMENT_MODE_MISMATCH',
} as const);

export type DataEnvironmentRuntimeErrorCode =
  (typeof DATA_ENVIRONMENT_RUNTIME_ERROR_CODES)[keyof typeof DATA_ENVIRONMENT_RUNTIME_ERROR_CODES];

export class DataEnvironmentRuntimeError extends Error {
  readonly code: DataEnvironmentRuntimeErrorCode;
  readonly retryable = false;

  constructor(code: DataEnvironmentRuntimeErrorCode) {
    super('Data operation environment preflight failed.');
    this.name = 'DataEnvironmentRuntimeError';
    this.code = code;
  }
}

export type DataOperationEnvironmentResolution = Readonly<{
  service: ExecutionEnvironmentResolutionService;
  workspaceId: string;
  principal: ExecutionEnvironmentPrincipalPartition;
  providerId: string;
  providerIsolation: ExecutionProviderIsolation;
  executionClass: ExecutionEnvironmentExecutionClass;
  profile: ExecutionProfile;
}>;

const bindingRequests = (
  source: DataSourceDefinition,
  operation: DataOperation
): readonly ExecutionEnvironmentBindingRequest[] =>
  Object.freeze(
    (
      [
        ['source', source.configurationByKey],
        ['operation', operation.configurationByKey],
      ] as const
    )
      .flatMap(([owner, configuration]) =>
        Object.entries(configuration).flatMap(([key, value]) =>
          value.kind === 'literal'
            ? []
            : [
                Object.freeze({
                  bindingId: value.reference.bindingId,
                  kind:
                    value.kind === 'environment-ref'
                      ? ('public' as const)
                      : ('secret' as const),
                  field: `${owner}.${key}`,
                }),
              ]
        )
      )
      .sort((left, right) => left.field.localeCompare(right.field))
  );

/** Resolves exact Data configuration bindings without adding an async boundary to environment-free execution. */
export const resolveDataOperationEnvironment = (input: {
  invocation: DataOperationInvocation;
  source: DataSourceDefinition;
  operation: DataOperation;
  resolution?: DataOperationEnvironmentResolution;
}): Promise<ExecutionEnvironmentResolutionLease> | undefined => {
  const bindings = bindingRequests(input.source, input.operation);
  if (!input.invocation.environment) {
    if (bindings.length)
      throw new DataEnvironmentRuntimeError(
        DATA_ENVIRONMENT_RUNTIME_ERROR_CODES.referenceRequired
      );
    return undefined;
  }
  if (input.invocation.environment.mode !== input.invocation.mode)
    throw new DataEnvironmentRuntimeError(
      DATA_ENVIRONMENT_RUNTIME_ERROR_CODES.modeMismatch
    );
  if (!input.resolution)
    throw new DataEnvironmentRuntimeError(
      DATA_ENVIRONMENT_RUNTIME_ERROR_CODES.resolverRequired
    );
  return input.resolution.service.resolve({
    leaseId: `${input.invocation.invocationId}:environment`,
    workspaceId: input.resolution.workspaceId,
    principal: input.resolution.principal,
    providerId: input.resolution.providerId,
    providerIsolation: input.resolution.providerIsolation,
    executionClass: input.resolution.executionClass,
    profile: input.resolution.profile,
    runtimeZone: input.invocation.runtimeZone,
    environment: input.invocation.environment,
    purpose: {
      kind: 'data-operation',
      resourceId: `${input.invocation.operation.documentId}/${input.operation.id}`,
      adapterId: input.source.adapterId,
    },
    bindings,
  });
};

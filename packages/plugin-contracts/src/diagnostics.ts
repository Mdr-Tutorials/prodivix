import type { JsonValue } from '#contracts/generated/pluginManifest.generated';

export const PLUGIN_DIAGNOSTIC_CODES = {
  INVALID_SOURCE: 'PLG-1001',
  DUPLICATE_KEY: 'PLG-1002',
  NON_JSON_VALUE: 'PLG-1003',
  SCHEMA_VIOLATION: 'PLG-1004',
  RESOURCE_LIMIT: 'PLG-1005',
  CONTRIBUTION_RESOURCE_READ_FAILED: 'PLG-1010',
  INVALID_CONTRIBUTION_JSON: 'PLG-1011',
  RESOURCE_INTEGRITY_MISMATCH: 'PLG-1012',
  UNSUPPORTED_CONTRIBUTION_CONTRACT: 'PLG-1013',
  CONTRIBUTION_SCHEMA_VIOLATION: 'PLG-1014',
  CONTRIBUTION_RESOURCE_LIMIT: 'PLG-1015',
  INVALID_PLUGIN_VERSION: 'PLG-2001',
  INVALID_ENGINE_RANGE: 'PLG-2002',
  INCOMPATIBLE_HOST: 'PLG-2003',
  PUBLISHER_SCOPE_MISMATCH: 'PLG-2004',
  DUPLICATE_CAPABILITY: 'PLG-2010',
  DUPLICATE_CONTRIBUTION: 'PLG-2011',
  MISSING_REGISTRATION_CAPABILITY: 'PLG-2012',
  INVALID_ACTIVATION_REFERENCE: 'PLG-2013',
  MISSING_RUNTIME_ENTRYPOINT: 'PLG-2014',
  INVALID_RESOURCE_PATH: 'PLG-2015',
  DUPLICATE_UI_ENTRYPOINT: 'PLG-2016',
  REQUIRED_CAPABILITY_DENIED: 'PLG-3001',
  CAPABILITY_POLICY_FAILED: 'PLG-3002',
  CONTRIBUTION_IDENTITY_CONFLICT: 'PLG-3010',
  TRANSACTION_CONFLICT: 'PLG-3011',
  CONTRIBUTION_RESOLVER_FAILED: 'PLG-3012',
  STALE_PLUGIN_OWNER: 'PLG-3013',
  CONTRIBUTION_CONTRACT_CONFLICT: 'PLG-3014',
  INVALID_HOST_TRANSITION: 'PLG-4001',
  RUNTIME_ACTIVATION_FAILED: 'PLG-4002',
  RUNTIME_TIMEOUT: 'PLG-4003',
  OWNER_CLEANUP_FAILED: 'PLG-4004',
  RUNTIME_TERMINATED: 'PLG-4005',
  OPERATION_SUPERSEDED: 'PLG-4006',
  AUDIT_SINK_FAILED: 'PLG-4007',
  HOST_SUBSCRIBER_FAILED: 'PLG-4008',
  RUNTIME_ARTIFACT_READ_FAILED: 'PLG-4010',
  RUNTIME_ARTIFACT_INTEGRITY_MISMATCH: 'PLG-4011',
  RUNTIME_ARTIFACT_LIMIT: 'PLG-4012',
} as const;

export type PluginDiagnosticCode =
  (typeof PLUGIN_DIAGNOSTIC_CODES)[keyof typeof PLUGIN_DIAGNOSTIC_CODES];

export type PluginDiagnosticSeverity = 'info' | 'warning' | 'error' | 'fatal';

export type PluginDiagnosticStage =
  | 'parse'
  | 'schema'
  | 'semantic'
  | 'permission'
  | 'registry'
  | 'runtime'
  | 'cleanup'
  | 'audit';

export type PluginDiagnosticMeta = {
  stage: PluginDiagnosticStage;
  pluginId?: string;
  pluginVersion?: string;
  installationId?: string;
  generation?: number;
  operationId?: string;
  manifestPath?: string;
  documentPath?: string;
  contributionId?: string;
  contributionPoint?: string;
  contractVersion?: string;
  capabilityId?: string;
  capabilityScope?: string;
  commandId?: string;
  schemaPath?: string;
  schemaKeyword?: string;
  offset?: number;
  length?: number;
  line?: number;
  column?: number;
  limit?: number;
  actual?: number;
  valueType?: string;
  resourcePath?: string;
  conflictingPath?: string;
  hostVersion?: string;
  engineRange?: string;
  permissionRevision?: number;
  registryRevision?: number;
  availabilityState?: string;
  runtimeState?: string;
  previousState?: string;
  nextState?: string;
  reasonCode?: string;
  [key: string]: JsonValue | undefined;
};

export type PluginDiagnostic = {
  code: PluginDiagnosticCode;
  severity: PluginDiagnosticSeverity;
  domain: 'plugin';
  message: string;
  hint: string;
  docsUrl: string;
  retryable: boolean;
  meta: PluginDiagnosticMeta;
};

export type PluginDiagnosticDefinition = {
  code: PluginDiagnosticCode;
  severity: PluginDiagnosticSeverity;
  stage: PluginDiagnosticStage;
  retryable: boolean;
  hint: string;
};

const definePluginDiagnostic = (
  code: PluginDiagnosticCode,
  stage: PluginDiagnosticStage,
  hint: string,
  options: {
    severity?: PluginDiagnosticSeverity;
    retryable?: boolean;
  } = {}
): PluginDiagnosticDefinition => ({
  code,
  severity: options.severity ?? 'error',
  stage,
  retryable: options.retryable ?? false,
  hint,
});

export const PLUGIN_DIAGNOSTIC_DEFINITIONS = {
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_SOURCE]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INVALID_SOURCE,
    'parse',
    'Provide a BOM-free UTF-8 document containing strict JSON.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_KEY]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_KEY,
    'parse',
    'Keep exactly one value for each object property.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.NON_JSON_VALUE]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.NON_JSON_VALUE,
    'schema',
    'Use only JSON primitives, arrays, and plain data objects.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.SCHEMA_VIOLATION]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.SCHEMA_VIOLATION,
    'schema',
    'Update the field to satisfy Plugin Manifest v1.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.RESOURCE_LIMIT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.RESOURCE_LIMIT,
    'parse',
    'Reduce the manifest size or nesting depth.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOURCE_READ_FAILED]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOURCE_READ_FAILED,
      'parse',
      'Check that the contribution resource exists and can be read.',
      { retryable: true }
    ),
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_CONTRIBUTION_JSON]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INVALID_CONTRIBUTION_JSON,
    'parse',
    'Provide a BOM-free contribution resource containing strict JSON.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.RESOURCE_INTEGRITY_MISMATCH]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.RESOURCE_INTEGRITY_MISMATCH,
    'schema',
    'Restore the expected package resource or update its trusted integrity metadata.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.UNSUPPORTED_CONTRIBUTION_CONTRACT]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.UNSUPPORTED_CONTRIBUTION_CONTRACT,
      'schema',
      'Use a contribution point and contract version supported by this host.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_SCHEMA_VIOLATION]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_SCHEMA_VIOLATION,
      'schema',
      'Update the descriptor to satisfy its contribution contract.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOURCE_LIMIT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOURCE_LIMIT,
    'parse',
    'Reduce the descriptor size, nesting depth, or resource count.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_PLUGIN_VERSION]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INVALID_PLUGIN_VERSION,
    'semantic',
    'Use a complete SemVer version without a range operator.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_ENGINE_RANGE]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INVALID_ENGINE_RANGE,
    'semantic',
    'Use a valid SemVer range for engines.prodivix.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.INCOMPATIBLE_HOST]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INCOMPATIBLE_HOST,
    'semantic',
    'Install a compatible plugin version or update the Prodivix host.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.PUBLISHER_SCOPE_MISMATCH]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.PUBLISHER_SCOPE_MISMATCH,
    'semantic',
    'Make publisher match the npm scope in the plugin id.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CAPABILITY]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CAPABILITY,
    'semantic',
    'Declare each capability id and scope pair once.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CONTRIBUTION]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CONTRIBUTION,
    'semantic',
    'Use a unique local id for every contribution.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.MISSING_REGISTRATION_CAPABILITY]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.MISSING_REGISTRATION_CAPABILITY,
      'semantic',
      'Request extension.register for the contribution point.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_ACTIVATION_REFERENCE]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.INVALID_ACTIVATION_REFERENCE,
      'semantic',
      'Reference a contribution or host command that exists.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.MISSING_RUNTIME_ENTRYPOINT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.MISSING_RUNTIME_ENTRYPOINT,
    'semantic',
    'Declare entrypoints.runtime or remove runtime activation events.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_RESOURCE_PATH]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INVALID_RESOURCE_PATH,
    'semantic',
    'Use a unique, portable, package-relative resource path.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_UI_ENTRYPOINT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_UI_ENTRYPOINT,
    'semantic',
    'Use a unique id for every UI entrypoint.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.REQUIRED_CAPABILITY_DENIED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.REQUIRED_CAPABILITY_DENIED,
    'permission',
    'Grant every required capability or keep the plugin disabled.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.CAPABILITY_POLICY_FAILED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.CAPABILITY_POLICY_FAILED,
    'permission',
    'Retry permission resolution after the policy source is available.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_IDENTITY_CONFLICT]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_IDENTITY_CONFLICT,
      'registry',
      'Use a unique stable contribution identity and retry registration.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.TRANSACTION_CONFLICT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.TRANSACTION_CONFLICT,
    'registry',
    'Read the latest host snapshot and retry the complete transaction.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_RESOLVER_FAILED,
      'registry',
      'Fix the host-side resolver or descriptor and retry validation.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.STALE_PLUGIN_OWNER]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.STALE_PLUGIN_OWNER,
    'registry',
    'Restart the operation against the current plugin generation.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_CONTRACT_CONFLICT]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_CONTRACT_CONFLICT,
      'registry',
      'Register each contribution point and contract version exactly once.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.INVALID_HOST_TRANSITION]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.INVALID_HOST_TRANSITION,
    'runtime',
    'Wait for the current plugin operation or use a valid lifecycle command.'
  ),
  [PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ACTIVATION_FAILED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ACTIVATION_FAILED,
    'runtime',
    'Inspect the plugin runtime diagnostics and retry activation.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.RUNTIME_TIMEOUT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.RUNTIME_TIMEOUT,
    'runtime',
    'Retry the operation or disable the unresponsive plugin.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.OWNER_CLEANUP_FAILED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.OWNER_CLEANUP_FAILED,
    'cleanup',
    'Retry owner cleanup before re-enabling or removing the plugin.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.RUNTIME_TERMINATED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.RUNTIME_TERMINATED,
    'runtime',
    'Inspect the runtime termination reason before retrying activation.',
    { retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.OPERATION_SUPERSEDED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.OPERATION_SUPERSEDED,
    'runtime',
    'Use the latest plugin snapshot before starting another operation.',
    { severity: 'info', retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.AUDIT_SINK_FAILED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.AUDIT_SINK_FAILED,
    'audit',
    'Restore the audit sink before relying on lifecycle audit records.',
    { severity: 'warning', retryable: true }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.HOST_SUBSCRIBER_FAILED]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.HOST_SUBSCRIBER_FAILED,
    'registry',
    'Fix or remove the failing Host subscriber.',
    { severity: 'warning' }
  ),
  [PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_READ_FAILED]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_READ_FAILED,
      'runtime',
      'Restore the runtime artifact in the verified plugin package and retry activation.',
      { retryable: true }
    ),
  [PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_INTEGRITY_MISMATCH]:
    definePluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_INTEGRITY_MISMATCH,
      'runtime',
      'Restore package integrity before executing the plugin runtime.'
    ),
  [PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_LIMIT]: definePluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.RUNTIME_ARTIFACT_LIMIT,
    'runtime',
    'Reduce the self-contained runtime artifact below the Host byte limit.'
  ),
} satisfies Record<PluginDiagnosticCode, PluginDiagnosticDefinition>;

export const createPluginDiagnostic = (
  code: PluginDiagnosticCode,
  message: string,
  meta: Omit<PluginDiagnosticMeta, 'stage'> = {},
  hint?: string
): PluginDiagnostic => {
  const definition = PLUGIN_DIAGNOSTIC_DEFINITIONS[code];
  return {
    code,
    severity: definition.severity,
    domain: 'plugin',
    message,
    hint: hint ?? definition.hint,
    docsUrl: `/reference/diagnostics/${code.toLowerCase()}`,
    retryable: definition.retryable,
    meta: {
      ...meta,
      stage: definition.stage,
    },
  };
};

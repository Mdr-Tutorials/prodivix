export const EXECUTION_ENVIRONMENT_MODES = Object.freeze([
  'mock',
  'live',
] as const);

export type ExecutionEnvironmentMode =
  (typeof EXECUTION_ENVIRONMENT_MODES)[number];

export type ExecutionEnvironmentSnapshotRef = Readonly<{
  environmentId: string;
  revision: string;
  mode: ExecutionEnvironmentMode;
}>;

export type EnvironmentBindingReference = Readonly<{
  bindingId: string;
}>;

export type SecretRef = Readonly<{
  bindingId: string;
}>;

const environmentModes = new Set<ExecutionEnvironmentMode>(
  EXECUTION_ENVIRONMENT_MODES
);

const assertPlainRecord: (
  value: unknown,
  label: string
) => asserts value is Readonly<Record<string, unknown>> = (value, label) => {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  ) {
    throw new TypeError(`${label} must be a plain object.`);
  }
};

const assertExactKeys = (
  value: Readonly<Record<string, unknown>>,
  keys: ReadonlySet<string>,
  label: string
): void => {
  const unknownKey = Object.keys(value).find((key) => !keys.has(key));
  if (unknownKey) {
    throw new TypeError(`${label} contains an unknown field: ${unknownKey}`);
  }
  const missingKey = [...keys].find(
    (key) => !Object.prototype.hasOwnProperty.call(value, key)
  );
  if (missingKey) {
    throw new TypeError(`${label} is missing field: ${missingKey}`);
  }
};

const requireCanonicalIdentifier = (value: unknown, label: string): string => {
  if (
    typeof value !== 'string' ||
    !value ||
    value !== value.trim() ||
    value.includes('\0')
  ) {
    throw new TypeError(`${label} must be a non-empty canonical string.`);
  }
  return value;
};

const ENVIRONMENT_REF_KEYS = new Set(['environmentId', 'revision', 'mode']);
const BINDING_REF_KEYS = new Set(['bindingId']);

/** Creates a reference to one immutable, non-secret environment snapshot. */
export const createExecutionEnvironmentSnapshotRef = (
  input: ExecutionEnvironmentSnapshotRef
): ExecutionEnvironmentSnapshotRef => {
  assertPlainRecord(input, 'Execution environment reference');
  assertExactKeys(
    input,
    ENVIRONMENT_REF_KEYS,
    'Execution environment reference'
  );
  if (!environmentModes.has(input.mode as ExecutionEnvironmentMode)) {
    throw new TypeError(
      `Unsupported execution environment mode: ${String(input.mode)}`
    );
  }
  return Object.freeze({
    environmentId: requireCanonicalIdentifier(
      input.environmentId,
      'Execution environmentId'
    ),
    revision: requireCanonicalIdentifier(
      input.revision,
      'Execution environment revision'
    ),
    mode: input.mode,
  });
};

const createBindingReference = <Reference extends EnvironmentBindingReference>(
  input: Reference,
  label: string
): Reference => {
  assertPlainRecord(input, label);
  assertExactKeys(input, BINDING_REF_KEYS, label);
  return Object.freeze({
    bindingId: requireCanonicalIdentifier(
      input.bindingId,
      `${label} bindingId`
    ),
  }) as Reference;
};

/** Creates a public reference without resolving or accepting a binding value. */
export const createEnvironmentBindingReference = (
  input: EnvironmentBindingReference
): EnvironmentBindingReference =>
  createBindingReference(input, 'Environment binding reference');

/** Creates an opaque secret reference without accepting secret material. */
export const createSecretRef = (input: SecretRef): SecretRef =>
  createBindingReference(input, 'Secret reference');

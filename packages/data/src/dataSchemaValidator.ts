import Ajv2020, {
  type ErrorObject,
  type ValidateFunction,
} from 'ajv/dist/2020.js';
import type { DataJsonSchema202012, DataJsonValue } from './data.types';

const MAX_SCHEMA_ISSUES = 32;
const MAX_SCHEMA_PATH_LENGTH = 4_096;

export type DataSchemaValidationIssue = Readonly<{
  instancePath: string;
  schemaPath: string;
  keyword: string;
}>;

export type DataSchemaValidationResult =
  | Readonly<{ valid: true; issues: readonly [] }>
  | Readonly<{
      valid: false;
      issues: readonly DataSchemaValidationIssue[];
      truncated: boolean;
    }>;

export type DataSchemaValidator = Readonly<{
  validate(
    schema: DataJsonSchema202012,
    value: DataJsonValue
  ): DataSchemaValidationResult;
}>;

const boundedPath = (value: string): string =>
  value.length <= MAX_SCHEMA_PATH_LENGTH
    ? value
    : value.slice(0, MAX_SCHEMA_PATH_LENGTH);

const toIssue = (error: ErrorObject): DataSchemaValidationIssue =>
  Object.freeze({
    instancePath: boundedPath(error.instancePath),
    schemaPath: boundedPath(error.schemaPath),
    keyword: boundedPath(error.keyword),
  });

/** Compiles canonical JSON Schema 2020-12 documents into bounded, value-free validation facts. */
export const createDataSchemaValidator = (): DataSchemaValidator => {
  const objectValidators = new WeakMap<object, ValidateFunction>();
  const booleanValidators = new Map<boolean, ValidateFunction>();

  const compile = (schema: DataJsonSchema202012): ValidateFunction => {
    const cached =
      typeof schema === 'boolean'
        ? booleanValidators.get(schema)
        : objectValidators.get(schema);
    if (cached) return cached;

    const ajv = new Ajv2020({
      allErrors: true,
      messages: false,
      strict: false,
      validateFormats: false,
    });
    const validator = ajv.compile(schema);
    if (typeof schema === 'boolean') booleanValidators.set(schema, validator);
    else objectValidators.set(schema, validator);
    return validator;
  };

  return Object.freeze({
    validate(schema, value) {
      const validator = compile(schema);
      if (validator(value))
        return Object.freeze({
          valid: true as const,
          issues: Object.freeze([]) as readonly [],
        });
      const errors = validator.errors ?? [];
      return Object.freeze({
        valid: false as const,
        issues: Object.freeze(errors.slice(0, MAX_SCHEMA_ISSUES).map(toIssue)),
        truncated: errors.length > MAX_SCHEMA_ISSUES,
      });
    },
  });
};

export const defaultDataSchemaValidator = createDataSchemaValidator();

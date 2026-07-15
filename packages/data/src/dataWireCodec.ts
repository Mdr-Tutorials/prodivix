import { decodeCurrentDataSourceDocument } from './dataDocument';
import {
  DATA_DOCUMENT_ISSUE_CODES,
  DATA_SOURCE_WIRE_VERSION,
  type DataDocumentIssue,
  type DataSourceDocument,
  type DataSourceDocumentDecodeResult,
  type DataSourceDocumentValidationOptions,
  type DataSourceDocumentWireV1,
} from './data.types';

type JsonRecord = Readonly<Record<string, unknown>>;

const isPlainRecord = (value: unknown): value is JsonRecord =>
  Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );

const invalid = (
  issues: readonly DataDocumentIssue[]
): DataSourceDocumentDecodeResult =>
  Object.freeze({ ok: false, issues: Object.freeze([...issues]) });

const issue = (path: string, message: string): DataDocumentIssue =>
  Object.freeze({ code: DATA_DOCUMENT_ISSUE_CODES.invalid, path, message });

/** Decodes only the versioned persistence shape; current documents are rejected. */
export const decodeDataSourceDocument = (
  input: unknown,
  options: DataSourceDocumentValidationOptions = {}
): DataSourceDocumentDecodeResult => {
  if (!isPlainRecord(input)) {
    return invalid([issue('/', 'Expected a plain wire document object.')]);
  }
  const expectedKeys = new Set([
    'wireVersion',
    'source',
    'schemasById',
    'operationsById',
  ]);
  const issues: DataDocumentIssue[] = [];
  for (const key of Object.keys(input)) {
    if (!expectedKeys.has(key)) {
      issues.push(issue(`/${key}`, `Unknown wire field "${key}".`));
    }
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(input, key)) {
      issues.push(issue(`/${key}`, `Missing required wire field "${key}".`));
    }
  }
  if (input.wireVersion !== DATA_SOURCE_WIRE_VERSION) {
    issues.push(
      issue(
        '/wireVersion',
        `Unsupported data source wire version; expected ${DATA_SOURCE_WIRE_VERSION}.`
      )
    );
  }
  if (issues.length > 0) return invalid(issues);
  return decodeCurrentDataSourceDocument(
    {
      source: input.source,
      schemasById: input.schemasById,
      operationsById: input.operationsById,
    },
    options
  );
};

export const encodeDataSourceDocument = (
  input: DataSourceDocument,
  options: DataSourceDocumentValidationOptions = {}
): DataSourceDocumentWireV1 => {
  const normalized = decodeCurrentDataSourceDocument(input, options);
  if (!normalized.ok) {
    const summary = normalized.issues
      .slice(0, 5)
      .map((entry) => `${entry.path}: ${entry.message}`)
      .join('; ');
    throw new TypeError(`Invalid data source document: ${summary}`);
  }
  return Object.freeze({
    wireVersion: DATA_SOURCE_WIRE_VERSION,
    source: normalized.value.source,
    schemasById: normalized.value.schemasById,
    operationsById: normalized.value.operationsById,
  });
};

export const isDataSourceDocument = (
  input: unknown,
  options: DataSourceDocumentValidationOptions = {}
): input is DataSourceDocument =>
  decodeCurrentDataSourceDocument(input, options).ok;

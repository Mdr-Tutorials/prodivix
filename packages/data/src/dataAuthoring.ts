import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type {
  DataOperation,
  DataOperationPolicies,
  DataSchema,
  DataSourceDocument,
} from './data.types';
import {
  normalizeDataSourceDocument,
  validateDataSourceDocument,
} from './dataDocument';
import { compareDataText } from './dataJsonRuntime';

export const DATA_MANUAL_AUTHORING_ISSUE_CODES = Object.freeze({
  invalid: 'DATA_AUTHORING_INVALID',
  targetMissing: 'DATA_AUTHORING_TARGET_MISSING',
  impactRequired: 'DATA_AUTHORING_IMPACT_REQUIRED',
} as const);

export type DataManualAuthoringImpact = Readonly<{
  schemaIds: readonly string[];
  operationIds: readonly string[];
}>;

export type DataManualAuthoringIssue = Readonly<{
  code: string;
  path: string;
  message: string;
}>;

export type DataManualAuthoringChange =
  | Readonly<{ kind: 'upsert-schema'; schema: DataSchema }>
  | Readonly<{ kind: 'upsert-operation'; operation: DataOperation }>
  | Readonly<{
      kind: 'replace-operation-policies';
      operationId: string;
      policies: DataOperationPolicies;
    }>;

export type DataManualAuthoringProposal =
  | Readonly<{
      status: 'ready';
      document: DataSourceDocument;
      impact: DataManualAuthoringImpact;
      issues: readonly DataManualAuthoringIssue[];
    }>
  | Readonly<{
      status: 'no-change' | 'invalid' | 'impact-required';
      impact: DataManualAuthoringImpact;
      issues: readonly DataManualAuthoringIssue[];
    }>;

const stableJson = (value: unknown): string => {
  const sort = (entry: unknown): unknown => {
    if (Array.isArray(entry)) return entry.map(sort);
    if (!entry || typeof entry !== 'object') return entry;
    return Object.fromEntries(
      Object.entries(entry)
        .sort(([left], [right]) => compareDataText(left, right))
        .map(([key, child]) => [key, sort(child)])
    );
  };
  return JSON.stringify(sort(value));
};

const digest = (value: unknown): string =>
  bytesToHex(sha256(utf8ToBytes(stableJson(value))));

const sortedUnique = (values: readonly string[]): readonly string[] =>
  Object.freeze([...new Set(values)].sort(compareDataText));

const impact = (
  schemaIds: readonly string[],
  operationIds: readonly string[]
): DataManualAuthoringImpact =>
  Object.freeze({
    schemaIds: sortedUnique(schemaIds),
    operationIds: sortedUnique(operationIds),
  });

const exactImpact = (
  expected: DataManualAuthoringImpact,
  approval: DataManualAuthoringImpact | undefined
): boolean =>
  Boolean(
    approval &&
    stableJson(expected.schemaIds) ===
      stableJson(sortedUnique(approval.schemaIds)) &&
    stableJson(expected.operationIds) ===
      stableJson(sortedUnique(approval.operationIds))
  );

const blocked = (
  status: 'no-change' | 'invalid' | 'impact-required',
  authoringImpact: DataManualAuthoringImpact,
  issues: readonly DataManualAuthoringIssue[] = []
): DataManualAuthoringProposal =>
  Object.freeze({
    status,
    impact: authoringImpact,
    issues: Object.freeze([...issues]),
  });

/**
 * Produces a bounded canonical Data authoring proposal. It never mutates the
 * input document and never writes Workspace state.
 */
export const createDataManualAuthoringProposal = (input: {
  documentId: string;
  document: DataSourceDocument;
  change: DataManualAuthoringChange;
  impactApproval?: DataManualAuthoringImpact;
}): DataManualAuthoringProposal => {
  let current: DataSourceDocument;
  try {
    current = normalizeDataSourceDocument(input.document, {
      documentId: input.documentId,
    });
  } catch {
    return blocked('invalid', impact([], []), [
      Object.freeze({
        code: DATA_MANUAL_AUTHORING_ISSUE_CODES.invalid,
        path: '/',
        message: 'Current Data source document is not canonical.',
      }),
    ]);
  }
  let next: DataSourceDocument;
  let authoringImpact = impact([], []);
  switch (input.change.kind) {
    case 'upsert-schema': {
      const schema = input.change.schema;
      const previous = current.schemasById[schema.id];
      const affectedOperations = Object.values(current.operationsById)
        .filter(
          (operation) =>
            operation.inputSchemaId === schema.id ||
            operation.outputSchemaId === schema.id
        )
        .map((operation) => operation.id);
      authoringImpact = previous
        ? impact([schema.id], affectedOperations)
        : impact([], []);
      next = Object.freeze({
        ...current,
        schemasById: Object.freeze({
          ...current.schemasById,
          [schema.id]: schema,
        }),
      });
      break;
    }
    case 'upsert-operation': {
      const previous = current.operationsById[input.change.operation.id];
      authoringImpact = previous
        ? impact([], [input.change.operation.id])
        : impact([], []);
      next = Object.freeze({
        ...current,
        operationsById: Object.freeze({
          ...current.operationsById,
          [input.change.operation.id]: input.change.operation,
        }),
      });
      break;
    }
    case 'replace-operation-policies': {
      const operation = current.operationsById[input.change.operationId];
      if (!operation)
        return blocked('invalid', impact([], []), [
          Object.freeze({
            code: DATA_MANUAL_AUTHORING_ISSUE_CODES.targetMissing,
            path: `/operationsById/${input.change.operationId}`,
            message: 'Manual policy authoring target does not exist.',
          }),
        ]);
      authoringImpact = impact([], [operation.id]);
      next = Object.freeze({
        ...current,
        operationsById: Object.freeze({
          ...current.operationsById,
          [operation.id]: Object.freeze({
            ...operation,
            policies: input.change.policies,
          }),
        }),
      });
      break;
    }
  }
  if (digest(current) === digest(next))
    return blocked('no-change', impact([], []));
  const validation = validateDataSourceDocument(next, {
    documentId: input.documentId,
  });
  if (!validation.valid)
    return blocked(
      'invalid',
      authoringImpact,
      validation.issues.map((entry) =>
        Object.freeze({
          code: entry.code,
          path: entry.path,
          message: entry.message,
        })
      )
    );
  if (
    (authoringImpact.schemaIds.length > 0 ||
      authoringImpact.operationIds.length > 0) &&
    !exactImpact(authoringImpact, input.impactApproval)
  )
    return blocked('impact-required', authoringImpact, [
      Object.freeze({
        code: DATA_MANUAL_AUTHORING_ISSUE_CODES.impactRequired,
        path: '/@impactApproval',
        message:
          'Exact schema and operation impact approval is required before replacing canonical authoring state.',
      }),
    ]);
  return Object.freeze({
    status: 'ready',
    document: normalizeDataSourceDocument(next, {
      documentId: input.documentId,
    }),
    impact: authoringImpact,
    issues: Object.freeze([]),
  });
};

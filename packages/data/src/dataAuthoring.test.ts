import { describe, expect, it } from 'vitest';
import type { DataSourceDocument } from './data.types';
import {
  createDataManualAuthoringProposal,
  DATA_MANUAL_AUTHORING_ISSUE_CODES,
} from './dataAuthoring';

const schemaUri = 'https://json-schema.org/draft/2020-12/schema' as const;

const document: DataSourceDocument = {
  source: {
    id: 'catalog',
    adapterId: 'core.http',
    runtimeZone: 'server',
    bindingsById: {},
    configurationByKey: {},
  },
  schemasById: {
    input: { id: 'input', schema: { $schema: schemaUri, type: 'object' } },
    output: { id: 'output', schema: { $schema: schemaUri, type: 'array' } },
  },
  operationsById: {
    list: {
      id: 'list',
      kind: 'query',
      inputSchemaId: 'input',
      outputSchemaId: 'output',
      configurationByKey: {},
      policies: {},
    },
  },
};

describe('manual Data Schema/Operation/Policy authoring', () => {
  it('requires exact impact approval before replacing a referenced schema', () => {
    const preview = createDataManualAuthoringProposal({
      documentId: 'data-catalog',
      document,
      change: {
        kind: 'upsert-schema',
        schema: {
          id: 'output',
          schema: {
            $schema: schemaUri,
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    });
    expect(preview).toMatchObject({
      status: 'impact-required',
      impact: { schemaIds: ['output'], operationIds: ['list'] },
    });
    const approved = createDataManualAuthoringProposal({
      documentId: 'data-catalog',
      document,
      change: {
        kind: 'upsert-schema',
        schema: {
          id: 'output',
          schema: {
            $schema: schemaUri,
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
      impactApproval: preview.impact,
    });
    expect(approved.status).toBe('ready');
    if (approved.status !== 'ready') return;
    expect(approved.document.schemasById.output.schema).toEqual({
      $schema: schemaUri,
      type: 'array',
      items: { type: 'string' },
    });
    expect(document.schemasById.output.schema).toEqual({
      $schema: schemaUri,
      type: 'array',
    });
  });

  it('validates a complete policy replacement through the canonical document contract', () => {
    const preview = createDataManualAuthoringProposal({
      documentId: 'data-catalog',
      document,
      change: {
        kind: 'replace-operation-policies',
        operationId: 'list',
        policies: {
          cache: { strategy: 'cache-first', ttlMs: 5_000 },
          retry: {
            maxAttempts: 3,
            backoff: 'exponential',
            initialDelayMs: 100,
            maxDelayMs: 1_000,
          },
        },
      },
    });
    expect(preview.status).toBe('impact-required');
    const approved = createDataManualAuthoringProposal({
      documentId: 'data-catalog',
      document,
      change: {
        kind: 'replace-operation-policies',
        operationId: 'list',
        policies: {
          cache: { strategy: 'cache-first', ttlMs: 5_000 },
          retry: {
            maxAttempts: 3,
            backoff: 'exponential',
            initialDelayMs: 100,
            maxDelayMs: 1_000,
          },
        },
      },
      impactApproval: preview.impact,
    });
    expect(approved.status).toBe('ready');
  });

  it('fails closed on unknown operations and invalid schema relations', () => {
    const missing = createDataManualAuthoringProposal({
      documentId: 'data-catalog',
      document,
      change: {
        kind: 'replace-operation-policies',
        operationId: 'missing',
        policies: {},
      },
    });
    expect(missing.issues).toContainEqual(
      expect.objectContaining({
        code: DATA_MANUAL_AUTHORING_ISSUE_CODES.targetMissing,
      })
    );
    const invalid = createDataManualAuthoringProposal({
      documentId: 'data-catalog',
      document,
      change: {
        kind: 'upsert-operation',
        operation: {
          id: 'broken',
          kind: 'query',
          outputSchemaId: 'missing',
          configurationByKey: {},
          policies: {},
        },
      },
    });
    expect(invalid.status).toBe('invalid');
  });
});

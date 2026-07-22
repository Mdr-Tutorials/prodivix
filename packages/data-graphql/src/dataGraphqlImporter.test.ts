import { describe, expect, it } from 'vitest';
import {
  createDataGraphqlImportProposal,
  DATA_GRAPHQL_IMPORT_ISSUE_CODES,
  type DataGraphqlImportBundle,
} from './dataGraphqlImporter';

const bundle = (): DataGraphqlImportBundle => ({
  schema: `
    type Product { id: ID!, name: String! }
    input ProductInput { name: String! }
    type Query { products(limit: Int!): [Product!]! }
    type Mutation { createProduct(input: ProductInput!): Product! }
  `,
  operations: [
    {
      document:
        'query Products($limit: Int!) { products(limit: $limit) { id name } }',
      operationName: 'Products',
    },
    {
      document:
        'mutation CreateProduct($input: ProductInput!) { createProduct(input: $input) { id name } }',
      operationName: 'CreateProduct',
    },
  ],
});

const propose = (
  overrides: Partial<Parameters<typeof createDataGraphqlImportProposal>[0]> = {}
) =>
  createDataGraphqlImportProposal({
    bundle: bundle(),
    documentId: 'data-catalog',
    importId: 'catalog-graphql',
    externalDocumentId: 'catalog-schema.graphql',
    sourceId: 'catalog',
    endpoint: 'https://api.example.test/graphql',
    runtimeZone: 'server',
    ...overrides,
  });

describe('GraphQL Data import proposal', () => {
  it('projects validated SDL and finite query/mutation documents with stable provenance', () => {
    const proposal = propose();
    expect(proposal.status, JSON.stringify(proposal.issues)).toBe('ready');
    if (proposal.status !== 'ready') return;

    expect(proposal.document.source).toMatchObject({
      adapterId: 'core.graphql',
      runtimeZone: 'server',
      configurationByKey: {
        endpoint: {
          kind: 'literal',
          value: 'https://api.example.test/graphql',
        },
      },
    });
    expect(proposal.document.operationsById.products).toMatchObject({
      kind: 'query',
      inputSchemaId: 'products-input',
      outputSchemaId: 'products-output',
      configurationByKey: {
        operationName: { kind: 'literal', value: 'Products' },
        resultPath: { kind: 'literal', value: '/products' },
      },
    });
    expect(proposal.document.operationsById.createproduct.kind).toBe(
      'mutation'
    );
    expect(
      proposal.document.importProvenanceById?.['catalog-graphql']
    ).toMatchObject({
      kind: 'graphql-sdl',
      externalDocumentId: 'catalog-schema.graphql',
    });
  });

  it('keeps subscriptions fail closed with a stable unsupported issue', () => {
    const proposal = propose({
      bundle: {
        schema:
          'type Query { ping: String } type Subscription { pinged: String }',
        operations: [
          {
            document: 'subscription Pinged { pinged }',
            operationName: 'Pinged',
          },
        ],
      },
    });
    expect(proposal.status).toBe('invalid');
    expect(proposal.issues).toContainEqual(
      expect.objectContaining({
        code: DATA_GRAPHQL_IMPORT_ISSUE_CODES.unsupportedShape,
      })
    );
  });

  it('projects diamond-shaped input graphs with linear shared definitions', () => {
    const inputTypes = Array.from({ length: 33 }, (_, index) =>
      index === 32
        ? `input T${index} { leaf: String }`
        : `input T${index} { a: T${index + 1}, b: T${index + 1} }`
    ).join('\n');
    const proposal = propose({
      bundle: {
        schema: `${inputTypes}\ntype Query { ping(input: T0): String }`,
        operations: [
          {
            document: 'query Diamond($value: T0) { ping(input: $value) }',
            operationName: 'Diamond',
          },
        ],
      },
    });

    expect(proposal.status, JSON.stringify(proposal.issues)).toBe('ready');
    if (proposal.status !== 'ready') return;
    const schema = proposal.document.schemasById['diamond-input']?.schema;
    const variableSchema =
      schema && typeof schema === 'object'
        ? schema.properties?.value
        : undefined;
    expect(variableSchema).toMatchObject({
      anyOf: [{ $ref: '#/$defs/T0' }, { type: 'null' }],
    });
    expect(
      schema && typeof schema === 'object'
        ? Object.keys(schema.$defs ?? {})
        : []
    ).toHaveLength(33);
    expect(JSON.stringify(schema).length).toBeLessThan(20_000);
  });

  it('requires exact impact approval for an upstream schema/operation change', () => {
    const initial = propose();
    expect(initial.status).toBe('ready');
    if (initial.status !== 'ready') return;
    const changedBundle = bundle();
    const changed = propose({
      currentDocument: initial.document,
      bundle: {
        ...changedBundle,
        operations: [
          {
            document:
              'query Products($limit: Int!) { products(limit: $limit) { id } }',
            operationName: 'Products',
          },
          changedBundle.operations[1]!,
        ],
      },
    });
    expect(changed.status).toBe('impact-required');
    if (changed.status !== 'impact-required') return;
    const approved = propose({
      currentDocument: initial.document,
      bundle: {
        ...changedBundle,
        operations: [
          {
            document:
              'query Products($limit: Int!) { products(limit: $limit) { id } }',
            operationName: 'Products',
          },
          changedBundle.operations[1]!,
        ],
      },
      impactApproval: changed.impact,
    });
    expect(approved.status, JSON.stringify(approved.issues)).toBe('ready');
  });
});

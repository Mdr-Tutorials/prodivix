import { describe, expect, it } from 'vitest';
import { createDataOpenApiImportProposal } from '@prodivix/data-http';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { buildDataResourceModel } from './dataResourceModel';

const importedDocument = () => {
  const proposal = createDataOpenApiImportProposal({
    spec: {
      openapi: '3.1.0',
      info: { title: 'Orders API', version: '1' },
      servers: [{ url: 'https://orders.example.test' }],
      security: [{ bearer: [] }],
      components: {
        securitySchemes: { bearer: { type: 'http', scheme: 'bearer' } },
      },
      paths: {
        '/orders/{id}': {
          get: {
            operationId: 'getOrder',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' },
              },
            ],
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': { schema: { type: 'object' } },
                },
              },
            },
          },
        },
      },
    },
    documentId: 'data-orders',
    importId: 'orders-openapi',
    externalDocumentId: 'https://orders.example.test/openapi.json',
    sourceId: 'orders',
    runtimeZone: 'server',
  });
  if (proposal.status !== 'ready') throw new Error('Invalid Data fixture.');
  return proposal.document;
};

describe('Data Resources product model', () => {
  it('projects operation, provenance, mapping, and reference-only auth metadata', () => {
    const workspace: WorkspaceSnapshot = {
      id: 'data-model',
      workspaceRev: 1,
      routeRev: 1,
      opSeq: 1,
      treeRootId: 'root',
      treeById: {
        root: {
          id: 'root',
          kind: 'dir',
          name: '/',
          parentId: null,
          children: ['data-node'],
        },
        'data-node': {
          id: 'data-node',
          kind: 'doc',
          name: 'orders.data.json',
          parentId: 'root',
          docId: 'data-orders',
        },
      },
      docsById: {
        'data-orders': {
          id: 'data-orders',
          type: 'data-source',
          path: '/data/orders.data.json',
          contentRev: 1,
          metaRev: 1,
          content: importedDocument(),
        },
      },
      routeManifest: { version: '1', root: { id: 'route-root' } },
    };
    const model = buildDataResourceModel(workspace);
    expect(model).toMatchObject({
      sourceCount: 1,
      operationCount: 1,
      invalidCount: 0,
      documents: [
        {
          status: 'ready',
          sourceName: 'Orders API',
          provenance: [{ id: 'orders-openapi', operationCount: 1 }],
          operations: [
            {
              id: 'getorder',
              method: 'GET',
              path: '/orders/{id}',
              mappingCount: 1,
              authorizationBindingIds: ['openapi-auth-bearer'],
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(model)).not.toMatch(/token|credentialValue/iu);
  });
});

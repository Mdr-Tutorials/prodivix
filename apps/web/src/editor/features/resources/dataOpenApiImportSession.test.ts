import { describe, expect, it } from 'vitest';
import type { DataSourceDocument } from '@prodivix/data';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import {
  createDataOpenApiImportPreview,
  type DataOpenApiImportDraft,
} from './dataOpenApiImportSession';

const spec = (summary = 'List products') => ({
  openapi: '3.1.0',
  info: { title: 'Catalog API', version: '1' },
  servers: [{ url: 'https://api.example.test/v1' }],
  paths: {
    '/products': {
      get: {
        operationId: 'listProducts',
        summary,
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': { schema: { type: 'array' } },
            },
          },
        },
      },
    },
  },
});

const draft = (value: unknown = spec()): DataOpenApiImportDraft => ({
  documentId: 'data-catalog',
  documentPath: '/data/catalog.data.json',
  importId: 'catalog-openapi',
  externalDocumentId: 'https://api.example.test/openapi.json',
  sourceId: 'catalog',
  runtimeZone: 'server',
  baseUrl: '',
  specification: JSON.stringify(value),
});

const workspace = (document?: DataSourceDocument): WorkspaceSnapshot => ({
  id: 'workspace-data-preview',
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
      children: document ? ['data-node'] : [],
    },
    ...(document
      ? {
          'data-node': {
            id: 'data-node',
            kind: 'doc' as const,
            name: 'catalog.data.json',
            parentId: 'root',
            docId: 'data-catalog',
          },
        }
      : {}),
  },
  docsById: document
    ? {
        'data-catalog': {
          id: 'data-catalog',
          type: 'data-source',
          path: '/data/catalog.data.json',
          contentRev: 3,
          metaRev: 1,
          content: document,
        },
      }
    : {},
  routeManifest: { version: '1', root: { id: 'route-root' } },
});

describe('Data OpenAPI import preview session', () => {
  it('returns input diagnostics without producing a proposal for malformed JSON or paths', () => {
    expect(
      createDataOpenApiImportPreview({
        workspace: workspace(),
        draft: { ...draft(), specification: '{' },
      })
    ).toMatchObject({
      status: 'invalid-input',
      code: 'DATA_OPENAPI_INPUT_JSON_INVALID',
    });
    expect(
      createDataOpenApiImportPreview({
        workspace: workspace(),
        draft: { ...draft(), documentPath: 'data/catalog.data.json' },
      })
    ).toMatchObject({
      status: 'invalid-input',
      code: 'DATA_OPENAPI_PATH_INVALID',
    });
  });

  it('fences reimport by content revision and requires exact impact approval', () => {
    const initial = createDataOpenApiImportPreview({
      workspace: workspace(),
      draft: draft(),
    });
    expect(initial.status).toBe('proposal');
    if (initial.status !== 'proposal' || initial.proposal.status !== 'ready')
      return;

    const changed = createDataOpenApiImportPreview({
      workspace: workspace(initial.proposal.document),
      draft: draft(spec('Read products')),
    });
    expect(changed).toMatchObject({
      status: 'proposal',
      expectedContentRev: 3,
      proposal: {
        status: 'impact-required',
        impact: { operationIds: ['listproducts'] },
      },
    });
    if (changed.status !== 'proposal') return;
    const accepted = createDataOpenApiImportPreview({
      workspace: workspace(initial.proposal.document),
      draft: draft(spec('Read products')),
      impactApproval: changed.proposal.impact,
    });
    expect(accepted).toMatchObject({
      status: 'proposal',
      proposal: { status: 'ready' },
    });
  });

  it('surfaces a three-way conflict when local and upstream managed fields both change', () => {
    const initial = createDataOpenApiImportPreview({
      workspace: workspace(),
      draft: draft(),
    });
    if (initial.status !== 'proposal' || initial.proposal.status !== 'ready')
      throw new Error('Initial proposal fixture is invalid.');
    const locallyEdited: DataSourceDocument = {
      ...initial.proposal.document,
      operationsById: {
        ...initial.proposal.document.operationsById,
        listproducts: {
          ...initial.proposal.document.operationsById.listproducts!,
          name: 'Local products',
        },
      },
    };
    const conflict = createDataOpenApiImportPreview({
      workspace: workspace(locallyEdited),
      draft: draft(spec('Upstream products')),
    });
    expect(conflict).toMatchObject({
      status: 'proposal',
      proposal: {
        status: 'conflict',
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: 'DATA_OPENAPI_REIMPORT_CONFLICT',
            path: '/operationsById/listproducts',
          }),
        ]),
      },
    });
  });
});

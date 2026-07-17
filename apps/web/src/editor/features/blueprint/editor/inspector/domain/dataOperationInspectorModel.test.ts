import { describe, expect, it } from 'vitest';
import type { DataSourceDocument } from '@prodivix/data';
import type { PIRDocument } from '@prodivix/pir';
import type { WorkspaceSnapshot } from '@prodivix/workspace';
import { createDataOperationInspectorCandidates } from './dataOperationInspectorModel';

const pir: PIRDocument = {
  ui: {
    graph: {
      rootId: 'root',
      nodesById: { root: { id: 'root', kind: 'element', type: 'main' } },
      childIdsById: { root: [] },
    },
  },
};

const data: DataSourceDocument = {
  source: {
    id: 'source',
    adapterId: 'rest',
    runtimeZone: 'server',
    bindingsById: {},
    configurationByKey: {},
  },
  schemasById: {
    output: {
      id: 'output',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
      },
    },
  },
  operationsById: {
    list: {
      id: 'list',
      name: 'List products',
      kind: 'query',
      outputSchemaId: 'output',
      configurationByKey: {},
      policies: {},
    },
    remove: {
      id: 'remove',
      name: 'Remove product',
      kind: 'mutation',
      outputSchemaId: 'output',
      configurationByKey: {},
      policies: {},
    },
  },
};

const workspace: WorkspaceSnapshot = {
  id: 'workspace',
  workspaceRev: 1,
  routeRev: 1,
  opSeq: 0,
  treeRootId: 'root-node',
  treeById: {
    'root-node': {
      id: 'root-node',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['page-node', 'data-node'],
    },
    'page-node': {
      id: 'page-node',
      kind: 'doc',
      name: 'page.pir.json',
      parentId: 'root-node',
      docId: 'page',
    },
    'data-node': {
      id: 'data-node',
      kind: 'doc',
      name: 'catalog.data.json',
      parentId: 'root-node',
      docId: 'catalog',
    },
  },
  docsById: {
    page: {
      id: 'page',
      type: 'pir-page',
      path: '/page.pir.json',
      contentRev: 1,
      metaRev: 1,
      content: pir,
    },
    catalog: {
      id: 'catalog',
      type: 'data-source',
      path: '/catalog.data.json',
      contentRev: 1,
      metaRev: 1,
      content: data,
    },
  },
  routeManifest: { version: '1', root: { id: 'route-root' } },
};

describe('Data operation Inspector candidates', () => {
  it('selects only mutation symbols through the revision-bound Semantic Index', () => {
    expect(
      createDataOperationInspectorCandidates(workspace, 'mutation')
    ).toEqual([
      expect.objectContaining({
        label: 'Remove product',
        kind: 'mutation',
        reference: { documentId: 'catalog', operationId: 'remove' },
      }),
    ]);
  });
});

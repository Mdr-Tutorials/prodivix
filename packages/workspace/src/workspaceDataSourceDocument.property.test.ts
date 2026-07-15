import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import type { DataSourceDocument } from '@prodivix/data';
import {
  applyWorkspaceCommand,
  createWorkspaceSemanticIndexFromSnapshot,
  createWorkspaceDataSourceDocumentUpdateCommand,
  decodeWorkspaceDocument,
  encodeWorkspaceDocument,
  type WorkspaceCommandEnvelope,
  type WorkspaceSnapshot,
} from './index';

const dataDocument = (): DataSourceDocument => ({
  source: {
    id: 'catalog',
    adapterId: 'rest',
    runtimeZone: 'server',
    bindingsById: {},
    configurationByKey: {
      baseUrl: { kind: 'literal', value: 'https://example.test' },
    },
  },
  schemasById: {
    products: {
      id: 'products',
      schema: {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'array',
      },
    },
  },
  operationsById: {
    'list-products': {
      id: 'list-products',
      kind: 'query',
      outputSchemaId: 'products',
      configurationByKey: {},
      policies: {},
    },
  },
});

const createWorkspace = (): WorkspaceSnapshot => ({
  id: 'workspace-data',
  workspaceRev: 1,
  routeRev: 1,
  opSeq: 1,
  treeRootId: 'root',
  activeDocumentId: 'catalog',
  treeById: {
    root: {
      id: 'root',
      kind: 'dir',
      name: '/',
      parentId: null,
      children: ['catalog-node'],
    },
    'catalog-node': {
      id: 'catalog-node',
      kind: 'doc',
      name: 'catalog.data.json',
      parentId: 'root',
      docId: 'catalog',
    },
  },
  docsById: {
    catalog: {
      id: 'catalog',
      type: 'data-source',
      path: '/catalog.data.json',
      contentRev: 1,
      metaRev: 1,
      content: dataDocument(),
    },
  },
  routeManifest: { version: '1', root: { id: 'route-root' } },
});

describe('Workspace Data source document properties', () => {
  it('round-trips wire content and reversible current-model commands', () => {
    fc.assert(
      fc.property(fc.stringMatching(/^[a-z][a-z0-9-]{0,15}$/), (adapterId) => {
        const workspace = createWorkspace();
        const before = workspace.docsById.catalog.content as DataSourceDocument;
        const command = createWorkspaceDataSourceDocumentUpdateCommand({
          workspace,
          documentId: 'catalog',
          after: {
            ...before,
            source: { ...before.source, adapterId },
          },
          commandId: 'data-update',
          issuedAt: '2026-07-15T00:00:00.000Z',
        });
        if (adapterId === 'rest') {
          expect(command).toBeNull();
          return;
        }
        expect(command).not.toBeNull();
        if (!command) return;

        const applied = applyWorkspaceCommand(workspace, command);
        expect(applied.ok).toBe(true);
        if (!applied.ok) return;
        expect(
          createWorkspaceSemanticIndexFromSnapshot(applied.snapshot).status
        ).toBe('ready');
        const reversed = applyWorkspaceCommand(applied.snapshot, {
          ...command,
          id: 'data-reverse',
          forwardOps: command.reverseOps,
          reverseOps: command.forwardOps,
        } satisfies WorkspaceCommandEnvelope);
        expect(reversed.ok).toBe(true);
        if (!reversed.ok) return;
        expect(reversed.snapshot.docsById.catalog.content).toEqual(before);

        const wire = encodeWorkspaceDocument(applied.snapshot.docsById.catalog);
        expect(wire.content).toMatchObject({ wireVersion: 1 });
        expect(decodeWorkspaceDocument(wire).content).toEqual(
          applied.snapshot.docsById.catalog.content
        );
      }),
      { numRuns: 24 }
    );
  });
});

import { describe, expect, it } from 'vitest';
import { createDataOpenApiImportProposal } from '@prodivix/data-http';
import {
  applyWorkspaceCommand,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import { createWorkspaceDataOpenApiAdoption } from './workspaceDataOpenApiImport';

const workspace = (): WorkspaceSnapshot => ({
  id: 'workspace-openapi',
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
      children: ['main-code-node'],
    },
    'main-code-node': {
      id: 'main-code-node',
      kind: 'doc',
      name: 'main.ts',
      parentId: 'root',
      docId: 'main-code',
    },
  },
  docsById: {
    'main-code': {
      id: 'main-code',
      type: 'code',
      path: '/main.ts',
      contentRev: 1,
      metaRev: 1,
      content: { language: 'ts', source: 'export {}' },
    },
  },
  routeManifest: { version: '1', root: { id: 'route-root' } },
});

const proposal = (
  currentDocument?: Parameters<
    typeof createDataOpenApiImportProposal
  >[0]['currentDocument'],
  title = 'Health API'
) =>
  createDataOpenApiImportProposal({
    spec: {
      openapi: '3.1.0',
      info: { title, version: '1' },
      servers: [{ url: 'https://api.example.test/v1' }],
      paths: {
        '/health': {
          get: {
            operationId: 'health',
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': { schema: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    documentId: 'data-health',
    importId: 'health-openapi',
    externalDocumentId: 'https://api.example.test/openapi.json',
    sourceId: 'health',
    runtimeZone: 'client',
    ...(currentDocument ? { currentDocument } : {}),
  });

describe('Workspace OpenAPI proposal adoption', () => {
  it('creates and reverses one canonical data-source document command', () => {
    const initial = workspace();
    const imported = proposal();
    expect(imported.status).toBe('ready');
    const adoption = createWorkspaceDataOpenApiAdoption({
      workspace: initial,
      proposal: imported,
      documentId: 'data-health',
      documentPath: '/data/health.data.json',
      commandId: 'openapi-import-1',
      issuedAt: '2026-07-19T00:00:00.000Z',
    });
    expect(adoption.status).toBe('ready');
    if (adoption.status !== 'ready') return;
    expect(adoption.mode).toBe('create');
    const applied = applyWorkspaceCommand(initial, adoption.command);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.snapshot.docsById['data-health']).toMatchObject({
      type: 'data-source',
      path: '/data/health.data.json',
    });
    expect(applied.snapshot.docsById['data-health']?.content).toMatchObject({
      source: { adapterId: 'core.http' },
      importProvenanceById: { 'health-openapi': { kind: 'openapi-3.1' } },
    });
    const reversed = applyWorkspaceCommand(applied.snapshot, {
      ...adoption.command,
      id: 'openapi-import-reverse',
      forwardOps: adoption.command.reverseOps,
      reverseOps: adoption.command.forwardOps,
    });
    expect(reversed.ok, JSON.stringify(reversed)).toBe(true);
    if (reversed.ok) expect(reversed.snapshot).toEqual(initial);
  });

  it('blocks stale reimport adoption before producing a command', () => {
    const initial = workspace();
    const imported = proposal();
    const created = createWorkspaceDataOpenApiAdoption({
      workspace: initial,
      proposal: imported,
      documentId: 'data-health',
      documentPath: '/data/health.data.json',
      commandId: 'openapi-import-1',
      issuedAt: '2026-07-19T00:00:00.000Z',
    });
    expect(created.status).toBe('ready');
    if (created.status !== 'ready') return;
    const applied = applyWorkspaceCommand(initial, created.command);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;

    const blocked = createWorkspaceDataOpenApiAdoption({
      workspace: {
        ...applied.snapshot,
        docsById: {
          ...applied.snapshot.docsById,
          'data-health': {
            ...applied.snapshot.docsById['data-health']!,
            contentRev: 2,
          },
        },
      },
      proposal: imported,
      documentId: 'data-health',
      documentPath: '/data/health.data.json',
      commandId: 'openapi-reimport-2',
      issuedAt: '2026-07-19T00:01:00.000Z',
      expectedContentRev: 1,
    });
    expect(blocked).toEqual({ status: 'blocked', reason: 'revision-drift' });
  });

  it('adopts and reverses a revision-fenced reimport update', () => {
    const initial = workspace();
    const imported = proposal();
    const created = createWorkspaceDataOpenApiAdoption({
      workspace: initial,
      proposal: imported,
      documentId: 'data-health',
      documentPath: '/data/health.data.json',
      commandId: 'openapi-import-create',
      issuedAt: '2026-07-19T00:00:00.000Z',
    });
    expect(created.status).toBe('ready');
    if (created.status !== 'ready') return;
    const createResult = applyWorkspaceCommand(initial, created.command);
    expect(createResult.ok).toBe(true);
    if (!createResult.ok) return;
    const currentDocument = createResult.snapshot.docsById['data-health']!;
    const reimported = proposal(
      currentDocument.content as Parameters<
        typeof createDataOpenApiImportProposal
      >[0]['currentDocument'],
      'Health API v2'
    );
    expect(reimported.status).toBe('ready');
    const adoption = createWorkspaceDataOpenApiAdoption({
      workspace: createResult.snapshot,
      proposal: reimported,
      documentId: 'data-health',
      documentPath: '/data/health.data.json',
      expectedContentRev: currentDocument.contentRev,
      commandId: 'openapi-reimport-update',
      issuedAt: '2026-07-19T00:01:00.000Z',
    });
    expect(adoption.status).toBe('ready');
    if (adoption.status !== 'ready') return;
    expect(adoption.mode).toBe('update');
    const updated = applyWorkspaceCommand(
      createResult.snapshot,
      adoption.command
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.snapshot.docsById['data-health']?.content).toMatchObject({
      source: { name: 'Health API v2' },
    });
    const reversed = applyWorkspaceCommand(updated.snapshot, {
      ...adoption.command,
      id: 'openapi-reimport-reverse',
      forwardOps: adoption.command.reverseOps,
      reverseOps: adoption.command.forwardOps,
    });
    expect(reversed.ok).toBe(true);
    if (reversed.ok) {
      expect(reversed.snapshot.docsById['data-health']?.content).toEqual(
        currentDocument.content
      );
    }
  });

  it('binds adoption to the proposal target document identity', () => {
    expect(
      createWorkspaceDataOpenApiAdoption({
        workspace: workspace(),
        proposal: proposal(),
        documentId: 'data-other',
        documentPath: '/data/other.data.json',
        commandId: 'openapi-import-other',
        issuedAt: '2026-07-19T00:02:00.000Z',
      })
    ).toEqual({ status: 'blocked', reason: 'proposal-target-mismatch' });
  });
});

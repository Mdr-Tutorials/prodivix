import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPirDoc } from '@prodivix/pir';
import {
  encodeWorkspaceSnapshot,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock('@/infra/api', () => ({
  apiRequest: apiRequestMock,
}));

import { editorApi } from '@/editor/editorApi';

const createWorkspace = (): WorkspaceSnapshot => ({
  id: 'workspace-1',
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
      children: ['document-node'],
    },
    'document-node': {
      id: 'document-node',
      kind: 'doc',
      name: 'pir.json',
      parentId: 'root',
      docId: 'document-1',
    },
  },
  docsById: {
    'document-1': {
      id: 'document-1',
      type: 'pir-page',
      path: '/pir.json',
      contentRev: 1,
      metaRev: 1,
      content: createDefaultPirDoc(),
    },
  },
  routeManifest: {
    version: '1',
    root: { id: 'root', children: [] },
  },
  activeDocumentId: 'document-1',
  activeRouteNodeId: 'root',
});

describe('editorApi workspace boundary', () => {
  beforeEach(() => {
    apiRequestMock.mockReset();
  });

  it('decodes backend workspace wire DTOs into the canonical model', async () => {
    const workspace = createWorkspace();
    apiRequestMock.mockResolvedValueOnce({
      workspace: encodeWorkspaceSnapshot(workspace, { locale: 'zh-CN' }),
    });

    const result = await editorApi.getWorkspace('token', workspace.id);

    expect(result).toEqual({
      workspace,
      settings: { locale: 'zh-CN' },
    });
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/workspaces/workspace-1',
      expect.objectContaining({ token: 'token' })
    );
  });

  it('encodes canonical workspaces when importing local projects', async () => {
    const workspace = createWorkspace();
    const wireWorkspace = encodeWorkspaceSnapshot(workspace, {
      locale: 'en-US',
    });
    apiRequestMock.mockResolvedValueOnce({
      project: {
        id: 'project-1',
        resourceType: 'project',
        name: 'Imported',
        isPublic: false,
        starsCount: 0,
        createdAt: '2026-07-12T00:00:00.000Z',
        updatedAt: '2026-07-12T00:00:00.000Z',
      },
      workspace: wireWorkspace,
    });

    const result = await editorApi.importLocalProject('token', {
      name: 'Imported',
      resourceType: 'project',
      workspace,
      settings: { locale: 'en-US' },
    });

    const [, options] = apiRequestMock.mock.calls[0] as [string, RequestInit];
    const requestBody = JSON.parse(options.body as string) as Record<
      string,
      unknown
    >;
    expect(requestBody.workspace).toEqual(wireWorkspace);
    expect(requestBody.workspace).not.toHaveProperty('docsById');
    expect(result.workspace.docsById['document-1']).toBeDefined();
    expect(result.settings).toEqual({ locale: 'en-US' });
  });

  it('returns decoded mutations without applying them in the API layer', async () => {
    const workspace = createWorkspace();
    apiRequestMock.mockResolvedValueOnce({
      workspaceId: workspace.id,
      workspaceRev: 2,
      routeRev: 1,
      opSeq: 2,
      acceptedMutationId: 'mutation-1',
    });

    const mutation = await editorApi.applyWorkspaceIntent('token', workspace, {
      expectedWorkspaceRev: 1,
      intent: {
        id: 'intent-1',
        namespace: 'core.workspace',
        type: 'noop',
        version: '1.0',
        payload: {},
        issuedAt: '2026-07-12T00:00:00.000Z',
      },
    });

    expect(mutation).toMatchObject({
      workspaceId: workspace.id,
      workspaceRev: 2,
      updatedDocuments: [],
      removedDocumentIds: [],
      acceptedMutationId: 'mutation-1',
    });
    expect(workspace.workspaceRev).toBe(1);
  });

  it('rejects malformed wire responses at the API boundary', async () => {
    apiRequestMock.mockResolvedValueOnce({ workspace: {} });

    await expect(
      editorApi.getWorkspace('token', 'workspace-1')
    ).rejects.toThrow('/workspace/documents');
  });
});

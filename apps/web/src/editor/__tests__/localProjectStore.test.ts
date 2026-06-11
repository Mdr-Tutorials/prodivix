import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPirDoc } from '@/pir/resolvePirDocument';
import type { WorkspaceSnapshot } from '@/editor/editorApi';
import {
  createLocalProject,
  deleteLocalProject,
  duplicateLocalProject,
  getLocalProject,
  isSyncedLocalProject,
  listLocalProjects,
  markLocalProjectSynced,
  saveLocalWorkspaceSnapshot,
  updateLocalProject,
} from '@/editor/localProjectStore';

type MockRequest<T = unknown> = {
  result?: T;
  error?: Error | null;
  onsuccess?: (() => void) | null;
  onerror?: (() => void) | null;
  onupgradeneeded?: (() => void) | null;
};

type PersistedProject = {
  id: string;
  name: string;
};

const records = new Map<string, PersistedProject>();

const queue = (callback: () => void) => {
  setTimeout(callback, 0);
};

const createRequest = <T>(): MockRequest<T> => ({
  result: undefined,
  error: null,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
});

const createDatabase = () => ({
  objectStoreNames: {
    contains: () => true,
  },
  createObjectStore: vi.fn(),
  close: vi.fn(),
  transaction: () => {
    const transaction = {
      error: null as Error | null,
      oncomplete: null as (() => void) | null,
      onerror: null as (() => void) | null,
      objectStore: () => ({
        getAll: () => {
          const request = createRequest<PersistedProject[]>();
          queue(() => {
            request.result = [...records.values()];
            request.onsuccess?.();
          });
          return request;
        },
        put: (project: PersistedProject) => {
          records.set(project.id, project);
          queue(() => transaction.oncomplete?.());
          return createRequest();
        },
        delete: (projectId: string) => {
          records.delete(projectId);
          queue(() => transaction.oncomplete?.());
          return createRequest();
        },
      }),
    };
    return transaction;
  },
});

const installIndexedDbMock = () => {
  vi.stubGlobal('indexedDB', {
    open: () => {
      const request = createRequest<ReturnType<typeof createDatabase>>();
      queue(() => {
        request.result = createDatabase();
        request.onsuccess?.();
      });
      return request;
    },
  });
};

describe('localProjectStore', () => {
  beforeEach(() => {
    records.clear();
    installIndexedDbMock();
  });

  it('creates anonymous projects with a local workspace VFS snapshot', async () => {
    const project = await createLocalProject({
      name: 'Local Draft',
      description: 'Browser-only draft',
      resourceType: 'project',
      pir: createDefaultPirDoc(),
    });

    expect(project.id).toMatch(/^local-/);
    expect(project.workspace.id).toBe(project.id);
    expect(project.workspace.tree).toMatchObject({
      treeRootId: 'root',
      treeById: {
        root: {
          children: ['doc_root_node'],
        },
        doc_root_node: {
          docId: 'doc_root',
        },
      },
    });
    expect(project.workspace.documents).toHaveLength(1);
    expect(project.workspace.documents[0]).toMatchObject({
      id: 'doc_root',
      type: 'pir-page',
      path: '/pir.json',
      contentRev: 1,
    });

    const projects = await listLocalProjects();
    expect(projects).toEqual([
      expect.objectContaining({
        id: project.id,
        name: 'Local Draft',
        isPublic: false,
      }),
    ]);
  });

  it('persists project metadata changes and the full workspace snapshot', async () => {
    const project = await createLocalProject({
      name: 'Before',
      resourceType: 'project',
      pir: createDefaultPirDoc(),
    });
    const renamed = await updateLocalProject(project.id, { name: 'After' });
    expect(renamed?.name).toBe('After');

    const workspace: WorkspaceSnapshot = {
      ...project.workspace,
      workspaceRev: 2,
      routeRev: 3,
      opSeq: 4,
      routeManifest: {
        version: '1',
        root: {
          id: 'root',
          children: [{ id: 'route_home', segment: 'home' }],
        },
      },
      documents: [
        project.workspace.documents[0],
        {
          id: 'code_button',
          type: 'code',
          path: '/src/Button.tsx',
          contentRev: 1,
          metaRev: 1,
          content: { language: 'ts', source: 'export const Button = 1;' },
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    await saveLocalWorkspaceSnapshot(project.id, workspace);
    const restored = await getLocalProject(project.id);

    expect(restored?.name).toBe('After');
    expect(restored?.workspace.routeRev).toBe(3);
    expect(restored?.workspace.routeManifest).toEqual(workspace.routeManifest);
    expect(restored?.workspace.documents).toContainEqual(
      expect.objectContaining({
        id: 'code_button',
        type: 'code',
        content: { language: 'ts', source: 'export const Button = 1;' },
      })
    );
  });

  it('deletes local projects from IndexedDB', async () => {
    const project = await createLocalProject({
      name: 'Disposable',
      resourceType: 'project',
      pir: createDefaultPirDoc(),
    });

    await expect(deleteLocalProject(project.id)).resolves.toBe(true);
    await expect(getLocalProject(project.id)).resolves.toBeNull();
  });

  it('persists sync binding and reports synced local projects as read-only caches', async () => {
    const project = await createLocalProject({
      name: 'Sync me',
      resourceType: 'project',
      pir: createDefaultPirDoc(),
    });

    await markLocalProjectSynced(project.id, {
      remoteProjectId: 'prj_remote',
      remoteWorkspaceId: 'prj_remote',
      workspaceRev: 5,
    });

    const restored = await getLocalProject(project.id);
    expect(isSyncedLocalProject(restored)).toBe(true);
    expect(restored?.syncBinding).toMatchObject({
      remoteProjectId: 'prj_remote',
      remoteWorkspaceId: 'prj_remote',
      lastSyncedWorkspaceRev: 5,
      status: 'synced-readonly',
    });
  });

  it('duplicates synced local caches as editable local projects', async () => {
    const project = await createLocalProject({
      name: 'Cloud copy',
      resourceType: 'project',
      pir: createDefaultPirDoc(),
    });
    await markLocalProjectSynced(project.id, {
      remoteProjectId: 'prj_remote',
      remoteWorkspaceId: 'prj_remote',
      workspaceRev: 2,
    });

    const duplicated = await duplicateLocalProject(project.id, {
      name: 'Editable local copy',
    });

    expect(duplicated?.id).toMatch(/^local-/);
    expect(duplicated?.id).not.toBe(project.id);
    expect(duplicated?.name).toBe('Editable local copy');
    expect(duplicated?.workspace.id).toBe(duplicated?.id);
    expect(duplicated?.workspace.workspaceRev).toBe(1);
    expect(duplicated?.syncBinding).toBeUndefined();

    const original = await getLocalProject(project.id);
    expect(isSyncedLocalProject(original)).toBe(true);
  });
});

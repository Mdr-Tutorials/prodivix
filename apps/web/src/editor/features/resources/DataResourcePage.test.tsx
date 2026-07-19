import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import type { DataSourceDocument } from '@prodivix/data';
import { createDataOpenApiImportProposal } from '@prodivix/data-http';
import {
  applyWorkspaceCommand,
  decodeWorkspaceDataSourceDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import { useExecutionCenterNavigationStore } from '@/editor/features/execution';
import { useWorkspaceSemanticNavigationStore } from '@/editor/navigation';
import { useEditorStore } from '@/editor/store/useEditorStore';

const dispatchWorkspaceAuthoringOperation = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ status: 'applied', operationId: 'data-import' })
);

vi.mock('@/editor/workspaceSync/workspaceAuthoringOperationDispatcher', () => ({
  dispatchWorkspaceAuthoringOperation,
}));

import { DataResourcePage } from './DataResourcePage';

const specification = () => ({
  openapi: '3.1.0',
  info: { title: 'Catalog API', version: '1' },
  servers: [{ url: 'https://catalog.example.test/v1' }],
  'x-prodivix-test-canary': 'spec-source-byte-canary',
  paths: {
    '/products': {
      get: {
        operationId: 'listProducts',
        summary: 'List products',
        responses: {
          200: {
            description: 'Products',
            content: {
              'application/json': { schema: { type: 'array' } },
            },
          },
        },
      },
      post: {
        operationId: 'createProduct',
        summary: 'Create product',
        requestBody: {
          content: {
            'application/json': { schema: { type: 'object' } },
          },
        },
        responses: {
          201: {
            description: 'Created',
            content: {
              'application/json': { schema: { type: 'object' } },
            },
          },
        },
      },
    },
  },
});

const emptyWorkspace = (): WorkspaceSnapshot => ({
  id: 'project-data',
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
      children: [],
    },
  },
  docsById: {},
  routeManifest: { version: '1', root: { id: 'route-root' } },
});

const importedWorkspace = (): WorkspaceSnapshot => {
  const proposal = createDataOpenApiImportProposal({
    spec: specification(),
    documentId: 'data-catalog',
    importId: 'catalog-openapi',
    externalDocumentId: 'https://catalog.example.test/openapi.json',
    sourceId: 'catalog',
    runtimeZone: 'server',
  });
  if (proposal.status !== 'ready') throw new Error('Invalid Data fixture.');
  return {
    ...emptyWorkspace(),
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
        name: 'catalog.data.json',
        parentId: 'root',
        docId: 'data-catalog',
      },
    },
    docsById: {
      'data-catalog': {
        id: 'data-catalog',
        type: 'data-source',
        path: '/data/catalog.data.json',
        contentRev: 4,
        metaRev: 1,
        content: proposal.document,
      },
    },
  };
};

function RouteProbe() {
  const location = useLocation();
  return (
    <output data-testid="route-probe">
      {location.pathname}
      {location.search}
    </output>
  );
}

const renderPage = (workspace: WorkspaceSnapshot) => {
  act(() => useEditorStore.setState({ workspace, workspaceReadonly: false }));
  return render(
    <MemoryRouter initialEntries={['/editor/project/project-data/resources']}>
      <Routes>
        <Route
          path="/editor/project/:projectId/resources"
          element={<DataResourcePage />}
        />
        <Route
          path="/editor/project/:projectId/issues"
          element={<RouteProbe />}
        />
        <Route
          path="/editor/project/:projectId/blueprint"
          element={<RouteProbe />}
        />
      </Routes>
    </MemoryRouter>
  );
};

beforeEach(() => {
  dispatchWorkspaceAuthoringOperation.mockReset();
  dispatchWorkspaceAuthoringOperation.mockResolvedValue({
    status: 'applied',
    operationId: 'data-import',
  });
});

afterEach(() => {
  act(() => {
    useEditorStore.setState({ workspace: null, workspaceReadonly: false });
    useExecutionCenterNavigationStore.getState().clear();
    useWorkspaceSemanticNavigationStore.getState().clearNavigation();
  });
});

describe('DataResourcePage', () => {
  it('previews and adopts one canonical OpenAPI import through a Workspace command', async () => {
    const workspace = emptyWorkspace();
    renderPage(workspace);

    fireEvent.change(
      screen.getByLabelText('resourceManager.data.import.specification'),
      { target: { value: JSON.stringify(specification()) } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.preview',
      })
    );
    expect(
      screen.getByText('resourceManager.data.import.status.ready')
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.adopt',
      })
    );
    await waitFor(() =>
      expect(dispatchWorkspaceAuthoringOperation).toHaveBeenCalledTimes(1)
    );
    const call = dispatchWorkspaceAuthoringOperation.mock.calls[0]?.[0];
    expect(call).toMatchObject({ workspace, readonly: false });
    if (!call || call.operation.kind !== 'command') {
      throw new Error('Expected one Workspace command.');
    }
    const applied = applyWorkspaceCommand(workspace, call.operation.command);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const document = applied.snapshot.docsById['data-openapi'];
    expect(document?.type).toBe('data-source');
    if (!document) return;
    expect(decodeWorkspaceDataSourceDocument(document)).toMatchObject({
      status: 'valid',
      decodedContent: {
        source: { id: 'openapi-source', adapterId: 'core.http' },
        importProvenanceById: {
          'openapi-import': { kind: 'openapi-3.1' },
        },
      },
    });
    expect(JSON.stringify(call.operation)).not.toContain(
      'spec-source-byte-canary'
    );
  });

  it('keeps an explicit new-target choice instead of restoring the selected document', () => {
    renderPage(importedWorkspace());
    const target = screen.getByLabelText(
      'resourceManager.data.import.target'
    ) as HTMLSelectElement;
    expect(target.value).toBe('data-catalog');
    fireEvent.change(target, { target: { value: '@new' } });
    const documentId = screen.getByLabelText(
      'resourceManager.data.import.documentId'
    ) as HTMLInputElement;
    expect(target.value).toBe('@new');
    expect(documentId.disabled).toBe(false);
    expect(documentId.value).toBe('data-openapi');
  });

  it('authors a new JSON Schema through one reversible Workspace command', async () => {
    const workspace = importedWorkspace();
    renderPage(workspace);
    const target = await screen.findByLabelText(
      'resourceManager.data.authoring.schemaTarget'
    );
    fireEvent.change(target, { target: { value: '@new' } });
    fireEvent.change(
      screen.getByLabelText('resourceManager.data.authoring.schemaId'),
      { target: { value: 'product-filter' } }
    );
    fireEvent.change(
      screen.getByLabelText('resourceManager.data.authoring.schemaJson'),
      {
        target: {
          value: JSON.stringify({
            $schema: 'https://json-schema.org/draft/2020-12/schema',
            type: 'object',
            properties: { search: { type: 'string' } },
            additionalProperties: false,
          }),
        },
      }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.authoring.preview',
      })
    );
    expect(
      screen.getByText('resourceManager.data.authoring.status.ready')
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.authoring.apply',
      })
    );
    await waitFor(() =>
      expect(dispatchWorkspaceAuthoringOperation).toHaveBeenCalledTimes(1)
    );
    const call = dispatchWorkspaceAuthoringOperation.mock.calls[0]?.[0];
    if (!call || call.operation.kind !== 'command')
      throw new Error('Expected one manual authoring command.');
    const applied = applyWorkspaceCommand(workspace, call.operation.command);
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    const authored = applied.snapshot.docsById['data-catalog'];
    expect(
      authored && decodeWorkspaceDataSourceDocument(authored)
    ).toMatchObject({
      status: 'valid',
      decodedContent: {
        schemasById: {
          'product-filter': { id: 'product-filter' },
        },
      },
    });
  });

  it('requires exact impact approval before replacing complete operation policies', async () => {
    const workspace = importedWorkspace();
    renderPage(workspace);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.authoring.mode.policy',
      })
    );
    fireEvent.change(
      await screen.findByLabelText(
        'resourceManager.data.authoring.operationTarget'
      ),
      { target: { value: 'listproducts' } }
    );
    const editor = await screen.findByLabelText(
      'resourceManager.data.authoring.policyJson'
    );
    await waitFor(() =>
      expect((editor as HTMLTextAreaElement).value.trim()).toBe('{}')
    );
    fireEvent.change(editor, {
      target: {
        value: JSON.stringify({
          cache: { strategy: 'cache-first', ttlMs: 5000 },
          retry: {
            maxAttempts: 3,
            backoff: 'exponential',
            initialDelayMs: 100,
            maxDelayMs: 1000,
          },
        }),
      },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.authoring.preview',
      })
    );
    expect(
      screen.getByText('resourceManager.data.authoring.status.impact-required')
    ).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.authoring.approveImpact',
      })
    );
    expect(
      screen.getByText('resourceManager.data.authoring.status.ready')
    ).toBeTruthy();
  });

  it('runs a schema-checked mock-only Test Operation without writing Workspace state', async () => {
    renderPage(importedWorkspace());
    fireEvent.click(
      await screen.findByRole('button', { name: /List products/u })
    );
    fireEvent.change(
      await screen.findByLabelText('resourceManager.data.test.fixtureDraft'),
      { target: { value: '[]' } }
    );
    fireEvent.change(
      screen.getByLabelText('resourceManager.data.test.expectedDraft'),
      { target: { value: '[]' } }
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'resourceManager.data.test.run' })
    );
    expect(
      await screen.findByText('resourceManager.data.test.status.passed')
    ).toBeTruthy();
    expect(dispatchWorkspaceAuthoringOperation).not.toHaveBeenCalled();
  });

  it('requires explicit exact-impact approval before enabling reimport adoption', () => {
    renderPage(importedWorkspace());
    const changed = specification();
    changed.paths['/products'].get.summary = 'Read products';
    fireEvent.change(
      screen.getByLabelText('resourceManager.data.import.specification'),
      { target: { value: JSON.stringify(changed) } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.preview',
      })
    );
    expect(
      screen.getByText('resourceManager.data.import.status.impact-required')
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: 'resourceManager.data.import.adopt',
      })
    ).toBeNull();

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: /resourceManager\.data\.import\.confirmImpact/u,
      })
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.approveImpact',
      })
    );
    expect(
      screen.getByText('resourceManager.data.import.status.ready')
    ).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.adopt',
      })
    ).toBeTruthy();
  });

  it('renders a managed three-way conflict without exposing an adoption action', () => {
    const current = importedWorkspace();
    const workspaceDocument = current.docsById['data-catalog'];
    if (!workspaceDocument) throw new Error('Missing Data fixture.');
    const dataDocument = workspaceDocument.content as DataSourceDocument;
    const conflicted: WorkspaceSnapshot = {
      ...current,
      docsById: {
        ...current.docsById,
        'data-catalog': {
          ...workspaceDocument,
          content: {
            ...dataDocument,
            operationsById: {
              ...dataDocument.operationsById,
              listproducts: {
                ...dataDocument.operationsById.listproducts!,
                name: 'Local product label',
              },
            },
          },
        },
      },
    };
    const changed = specification();
    changed.paths['/products'].get.summary = 'Upstream product label';
    renderPage(conflicted);
    fireEvent.change(
      screen.getByLabelText('resourceManager.data.import.specification'),
      { target: { value: JSON.stringify(changed) } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.preview',
      })
    );

    expect(
      screen.getByText('resourceManager.data.import.status.conflict')
    ).toBeTruthy();
    expect(screen.getByText('DATA_OPENAPI_REIMPORT_CONFLICT')).toBeTruthy();
    expect(
      screen.queryByRole('button', {
        name: 'resourceManager.data.import.adopt',
      })
    ).toBeNull();
  });

  it('keeps an invalid target identity and rejects reimport before proposal creation', () => {
    const base = emptyWorkspace();
    const invalid: WorkspaceSnapshot = {
      ...base,
      docsById: {
        'data-broken': {
          id: 'data-broken',
          type: 'data-source',
          path: '/data/broken.data.json',
          contentRev: 2,
          metaRev: 1,
          content: { source: null },
        },
      },
    };
    renderPage(invalid);
    expect(
      (
        screen.getByLabelText(
          'resourceManager.data.import.target'
        ) as HTMLSelectElement
      ).value
    ).toBe('data-broken');
    expect(
      (
        screen.getByLabelText(
          'resourceManager.data.import.documentId'
        ) as HTMLInputElement
      ).value
    ).toBe('data-broken');
    fireEvent.change(
      screen.getByLabelText('resourceManager.data.import.specification'),
      { target: { value: JSON.stringify(specification()) } }
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.import.preview',
      })
    );
    expect(screen.getByText('DATA_OPENAPI_TARGET_INVALID')).toBeTruthy();
    expect(dispatchWorkspaceAuthoringOperation).not.toHaveBeenCalled();
  });

  it('consumes an Issues semantic target and focuses the exact operation Inspector', async () => {
    const workspace = importedWorkspace();
    act(() =>
      useWorkspaceSemanticNavigationStore.getState().requestSurfaceNavigation({
        projectId: 'project-data',
        workspaceId: workspace.id,
        location: {
          kind: 'diagnostic-target',
          targetRef: {
            kind: 'data-operation',
            documentId: 'data-catalog',
            operationId: 'listproducts',
          },
        },
      })
    );
    renderPage(workspace);

    expect(
      await screen.findByRole('heading', { name: 'List products' })
    ).toBeTruthy();
    await waitFor(() =>
      expect(
        useWorkspaceSemanticNavigationStore.getState().navigationRequest
      ).toBeNull()
    );
  });

  it('opens exact-operation Issues and publishes exact-operation Network focus', () => {
    const workspace = importedWorkspace();
    const first = renderPage(workspace);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.actions.openIssues',
      })
    );
    expect(screen.getByTestId('route-probe').textContent).toBe(
      '/editor/project/project-data/issues?domain=data&documentId=data-catalog&operationId=createproduct'
    );

    first.unmount();
    renderPage(workspace);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'resourceManager.data.actions.openNetwork',
      })
    );
    expect(useExecutionCenterNavigationStore.getState().request).toMatchObject({
      workspaceId: workspace.id,
      surface: 'network',
      documentId: 'data-catalog',
      operationId: 'createproduct',
    });
    expect(screen.getByTestId('route-probe').textContent).toBe(
      '/editor/project/project-data/blueprint'
    );
  });
});

import {
  isWorkspacePirDocument,
  type WorkspaceSnapshot,
} from '@prodivix/workspace';
import type { CompileDiagnostic } from '#src/core/diagnostics';
import type {
  ExportImportIntent,
  ExportModule,
  ExportRouteTopology,
} from '#src/export';
import { WORKSPACE_DATA_RUNTIME_MODULE_ID } from '#src/react/standaloneDataRuntime';
import { WORKSPACE_EXECUTION_CONSOLE_RUNTIME_MODULE_ID } from '#src/react/standaloneExecutionConsoleRuntime';
import { WORKSPACE_SERVER_RUNTIME_MODULE_ID } from '#src/react/standaloneServerRuntime';
import type {
  WorkspaceServerRuntimeBinding,
  WorkspaceServerRuntimeTargetAnalysis,
} from '#src/react/workspaceServerRuntimeTarget';
import { WORKSPACE_VUE_PIR_RUNTIME_MODULE_ID } from '#src/vue/workspacePirRuntime';

export const WORKSPACE_VUE_APP_MODULE_ID = 'workspace-vue-entry' as const;

type VueRouteRuntimeBinding = Readonly<{
  artifactId: string;
  exportName?: string;
  kind: 'loader' | 'action' | 'guard';
  routeNodeId: string;
  serverFunction?: WorkspaceServerRuntimeBinding['definition'];
}>;

const compareText = (left: string, right: string): number =>
  left < right ? -1 : left > right ? 1 : 0;

const scoreRoutePath = (path: string): number =>
  path
    .split('/')
    .filter(Boolean)
    .reduce(
      (score, segment) =>
        score +
        (segment.startsWith('*')
          ? 1
          : segment.startsWith(':') || /^\[.+\]$/.test(segment)
            ? 10
            : 100),
      path === '/' ? 1_000 : 0
    );

export type CreateWorkspaceVueAppModuleInput = Readonly<{
  workspace: WorkspaceSnapshot;
  routeTopology: ExportRouteTopology;
  serverRuntime: WorkspaceServerRuntimeTargetAnalysis;
  executableModuleIdByArtifactId: ReadonlyMap<string, string>;
}>;

/** Creates the Vue route/auth/server composition root without embedding server-owned source. */
export const createWorkspaceVueAppModule = (
  input: CreateWorkspaceVueAppModuleInput
): Readonly<{
  module: ExportModule;
  diagnostics: readonly CompileDiagnostic[];
}> => {
  const diagnostics: CompileDiagnostic[] = [];
  const imports: ExportImportIntent[] = [
    {
      kind: 'side-effect',
      source: WORKSPACE_EXECUTION_CONSOLE_RUNTIME_MODULE_ID,
      targetModuleId: WORKSPACE_EXECUTION_CONSOLE_RUNTIME_MODULE_ID,
    },
    {
      kind: 'named',
      source: 'vue',
      imported: 'defineComponent',
      local: 'defineComponent',
    },
    { kind: 'named', source: 'vue', imported: 'h', local: 'h' },
    { kind: 'named', source: 'vue', imported: 'onMounted', local: 'onMounted' },
    {
      kind: 'named',
      source: 'vue',
      imported: 'onUnmounted',
      local: 'onUnmounted',
    },
    { kind: 'named', source: 'vue', imported: 'ref', local: 'ref' },
    {
      kind: 'named',
      source: WORKSPACE_DATA_RUNTIME_MODULE_ID,
      targetModuleId: WORKSPACE_DATA_RUNTIME_MODULE_ID,
      imported: 'createWorkspaceDataRuntime',
      local: 'createWorkspaceDataRuntime',
    },
    {
      kind: 'named',
      source: WORKSPACE_SERVER_RUNTIME_MODULE_ID,
      targetModuleId: WORKSPACE_SERVER_RUNTIME_MODULE_ID,
      imported: 'invokeWorkspaceServerFunction',
      local: 'invokeWorkspaceServerFunction',
    },
    {
      kind: 'named',
      source: WORKSPACE_VUE_PIR_RUNTIME_MODULE_ID,
      targetModuleId: WORKSPACE_VUE_PIR_RUNTIME_MODULE_ID,
      imported: 'createWorkspacePirDocumentComponent',
      local: 'createWorkspacePirDocumentComponent',
    },
  ];

  const codeModuleLocalByArtifactId = new Map<string, string>();
  [...input.executableModuleIdByArtifactId.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .forEach(([artifactId, moduleId], index) => {
      const local = `workspaceCodeModule${index + 1}`;
      codeModuleLocalByArtifactId.set(artifactId, local);
      imports.push({
        kind: 'namespace',
        source: moduleId,
        targetModuleId: moduleId,
        local,
      });
    });

  const runtimeBindings: VueRouteRuntimeBinding[] = [];
  const serverArtifactIds = new Set(input.serverRuntime.serverArtifactIds);
  input.routeTopology.runtimeRefs.forEach((reference) => {
    const serverBinding = input.serverRuntime.bindings.find(
      (binding) =>
        binding.routeNodeId === reference.routeNodeId &&
        binding.routeKind === reference.kind &&
        binding.definition.reference.artifactId === reference.artifactId &&
        binding.definition.reference.exportName === reference.exportName
    );
    if (serverBinding) {
      runtimeBindings.push({
        artifactId: reference.artifactId,
        exportName: reference.exportName,
        kind: reference.kind,
        routeNodeId: reference.routeNodeId,
        serverFunction: serverBinding.definition,
      });
      return;
    }
    if (serverArtifactIds.has(reference.artifactId)) return;
    if (!codeModuleLocalByArtifactId.has(reference.artifactId)) {
      diagnostics.push({
        code: 'VUE-EXPORT-RUNTIME-REFERENCE',
        severity: 'error',
        source: 'export',
        message: `Route ${reference.routeNodeId} references a non-executable CodeArtifact: ${reference.artifactId}.`,
        path: `/routeManifest/runtime/${reference.routeNodeId}/${reference.kind}`,
      });
      return;
    }
    runtimeBindings.push({
      artifactId: reference.artifactId,
      exportName: reference.exportName,
      kind: reference.kind,
      routeNodeId: reference.routeNodeId,
    });
  });

  const routes = input.routeTopology.routes
    .flatMap((route) => {
      if (!route.pageDocId) return [];
      const document = input.workspace.docsById[route.pageDocId];
      if (!document || !isWorkspacePirDocument(document)) {
        diagnostics.push({
          code: 'VUE-EXPORT-ROUTE-DOCUMENT',
          severity: 'error',
          source: 'export',
          message: `Route ${route.routeNodeId} references an unavailable PIR page document: ${route.pageDocId}.`,
          path: `/routeManifest/routes/${route.routeNodeId}`,
        });
        return [];
      }
      return [
        Object.freeze({
          routeNodeId: route.routeNodeId,
          path: route.path,
          pageDocumentId: route.pageDocId,
        }),
      ];
    })
    .sort(
      (left, right) =>
        scoreRoutePath(right.path) - scoreRoutePath(left.path) ||
        compareText(left.path, right.path) ||
        compareText(left.routeNodeId, right.routeNodeId)
    );
  if (!routes.length) {
    diagnostics.push({
      code: 'VUE-EXPORT-ROUTES-EMPTY',
      severity: 'error',
      source: 'export',
      message: 'Vue Workspace export requires at least one route page.',
      path: '/routeManifest',
    });
  }

  const runtimeByRoute = new Map<
    string,
    Partial<Record<VueRouteRuntimeBinding['kind'], string>>
  >();
  runtimeBindings.forEach((binding) => {
    const current = runtimeByRoute.get(binding.routeNodeId) ?? {};
    if (binding.serverFunction) {
      current[binding.kind] =
        `{ kind: 'server-function', functionRef: ${JSON.stringify(binding.serverFunction.reference)} }`;
    } else {
      const local = codeModuleLocalByArtifactId.get(binding.artifactId)!;
      current[binding.kind] = binding.exportName
        ? `{ kind: 'client-function', invoke: ${local}[${JSON.stringify(binding.exportName)}] }`
        : `{ kind: 'client-function', invoke: ${local} }`;
    }
    runtimeByRoute.set(binding.routeNodeId, current);
  });
  const runtimeTable = [...runtimeByRoute.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(
      ([routeNodeId, values]) =>
        `  ${JSON.stringify(routeNodeId)}: { ${Object.entries(values)
          .sort(([left], [right]) => compareText(left, right))
          .map(([kind, value]) => `${kind}: ${value}`)
          .join(', ')} },`
    )
    .join('\n');
  const codeTable = [...codeModuleLocalByArtifactId.entries()]
    .sort(([left], [right]) => compareText(left, right))
    .map(([artifactId, local]) => `  ${JSON.stringify(artifactId)}: ${local},`)
    .join('\n');

  const body = `type JsonRecord = Readonly<Record<string, any>>;

export const workspaceVueRoutes = ${JSON.stringify(routes)} as const;

export const workspaceVueRouteRuntime = {
${runtimeTable}
} as const;

const workspaceCodeModules = {
${codeTable}
} as const;

const workspaceDataRuntime = createWorkspaceDataRuntime();

type ServerFunctionEntry = Readonly<{
  kind: 'server-function';
  functionRef: Readonly<{ artifactId: string; exportName: string }>;
}>;

type ClientFunctionEntry = Readonly<{
  kind: 'client-function';
  invoke: unknown;
}>;

const readRuntimeEntry = (routeNodeId: string, kind: 'loader' | 'action' | 'guard'): ServerFunctionEntry | ClientFunctionEntry | undefined => {
  const runtime = (workspaceVueRouteRuntime as Readonly<Record<string, JsonRecord>>)[routeNodeId];
  const value = runtime?.[kind];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  if (value.kind === 'server-function') {
    const reference = value.functionRef;
    return reference && typeof reference === 'object' && !Array.isArray(reference) &&
      typeof reference.artifactId === 'string' && typeof reference.exportName === 'string'
      ? value as ServerFunctionEntry
      : undefined;
  }
  return value.kind === 'client-function' ? value as ClientFunctionEntry : undefined;
};

const invokeRouteRuntime = async (
  entry: ServerFunctionEntry | ClientFunctionEntry | undefined,
  input: unknown,
  options: Readonly<{ invocationId?: string; attempt?: number; signal?: AbortSignal }> = {}
) => {
  if (!entry) return undefined;
  if (entry.kind === 'server-function') return invokeWorkspaceServerFunction(entry.functionRef, input, options);
  if (typeof entry.invoke !== 'function') throw new Error('VUE_ROUTE_RUNTIME_INVALID');
  return await entry.invoke(input, options);
};

const normalizePath = (value: string): string => {
  const normalized = (value.split(/[?#]/, 1)[0] || '/').replace(/\\/+/g, '/');
  return normalized.length > 1 ? normalized.replace(/\\/$/, '') : '/';
};

const matchRoutePath = (pattern: string, pathname: string): Readonly<Record<string, string>> | undefined => {
  const patternSegments = normalizePath(pattern).split('/').filter(Boolean);
  const pathSegments = normalizePath(pathname).split('/').filter(Boolean);
  const params: Record<string, string> = {};
  let pathIndex = 0;
  for (const segment of patternSegments) {
    if (segment.startsWith('*') || /^\\[\\.\\.\\..+\\]$/.test(segment)) {
      const name = segment.startsWith('*') ? segment.slice(1) || 'splat' : segment.slice(4, -1);
      try { params[name] = decodeURIComponent(pathSegments.slice(pathIndex).join('/')); }
      catch { return undefined; }
      return Object.freeze(params);
    }
    if (pathIndex >= pathSegments.length) return undefined;
    const dynamic = segment.startsWith(':') || /^\\[[^\\]]+\\]$/.test(segment);
    if (!dynamic && segment !== pathSegments[pathIndex]) return undefined;
    if (dynamic) {
      const name = segment.startsWith(':') ? segment.slice(1) : segment.slice(1, -1);
      try { params[name] = decodeURIComponent(pathSegments[pathIndex]); }
      catch { return undefined; }
    }
    pathIndex += 1;
  }
  return pathIndex === pathSegments.length ? Object.freeze(params) : undefined;
};

const readPathname = (): string =>
  typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname);

const findRoute = (pathname: string) => {
  for (const route of workspaceVueRoutes) {
    const params = matchRoutePath(route.path, pathname);
    if (params) return Object.freeze({ ...route, params });
  }
  return undefined;
};

const routeRuntimeSubscribers = new Set<() => void>();
const notifyRouteRuntime = () => routeRuntimeSubscribers.forEach((listener) => listener());
let activeRouteLoaderValue: unknown;

export const readWorkspaceRouteLoaderValue = (): unknown => activeRouteLoaderValue;

const readSearchParams = (): Readonly<Record<string, string | readonly string[]>> => {
  const values: Record<string, string | string[]> = {};
  if (typeof window === 'undefined') return Object.freeze(values);
  new URLSearchParams(window.location.search).forEach((value, key) => {
    const current = values[key];
    values[key] = current === undefined ? value : Array.isArray(current) ? [...current, value] : [current, value];
  });
  return Object.freeze(Object.fromEntries(Object.entries(values).map(([key, value]) => [
    key,
    Array.isArray(value) ? Object.freeze(value) : value,
  ])));
};

export type WorkspaceVueRouteActionSubmission = Readonly<{
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  encType: 'application/json' | 'application/x-www-form-urlencoded';
  value: unknown;
}>;

export const dispatchWorkspaceRouteAction = async (
  submission: WorkspaceVueRouteActionSubmission,
  options: Readonly<{ invocationId?: string; attempt?: number; signal?: AbortSignal }> = {}
) => {
  if (typeof window === 'undefined') throw new Error('SVR_ROUTE_ACTION_BROWSER_REQUIRED');
  const currentPath = readPathname();
  const match = findRoute(currentPath);
  const action = match ? readRuntimeEntry(match.routeNodeId, 'action') : undefined;
  if (!match || !action) throw new Error('SVR_ROUTE_ACTION_UNAVAILABLE');
  if (!submission || typeof submission !== 'object' || Array.isArray(submission) ||
    !['POST', 'PUT', 'PATCH', 'DELETE'].includes(submission.method) ||
    !['application/json', 'application/x-www-form-urlencoded'].includes(submission.encType)) {
    throw new Error('SVR_ROUTE_ACTION_INPUT_INVALID');
  }
  const outcome = await invokeRouteRuntime(action, Object.freeze({
    format: 'prodivix.route-action-input.v1',
    route: Object.freeze({
      routeNodeId: match.routeNodeId,
      currentPath,
      matchedPath: match.path,
      params: match.params,
      searchParams: readSearchParams(),
      ...(window.location.hash ? { hash: window.location.hash } : {}),
    }),
    submission: Object.freeze({ ...submission }),
  }), options);
  if (outcome?.kind === 'redirect') {
    window.location.assign(outcome.location);
    return outcome;
  }
  if (outcome?.kind !== 'value') throw new Error('SVR_ROUTE_ACTION_OUTCOME_INVALID');
  notifyRouteRuntime();
  return outcome;
};

const routePathById = Object.freeze(Object.fromEntries(workspaceVueRoutes.map((route) => [route.routeNodeId, route.path])));

const workspacePirRuntime = Object.freeze({
  ...workspaceDataRuntime,
  dispatchTrigger(input: JsonRecord) {
    const binding = input.binding && typeof input.binding === 'object' && !Array.isArray(input.binding)
      ? input.binding as JsonRecord
      : undefined;
    if (!binding) return;
    if (binding.kind === 'open-url' && typeof binding.href === 'string' && typeof window !== 'undefined') {
      window.open(binding.href, '_blank', 'noopener,noreferrer');
      return;
    }
    if (binding.kind === 'navigate-route' && typeof binding.routeId === 'string' && typeof window !== 'undefined') {
      const path = routePathById[binding.routeId];
      if (!path) throw new Error('VUE_ROUTE_NAVIGATION_UNAVAILABLE');
      window.history.pushState(null, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      return;
    }
    if (binding.kind === 'dispatch-data-operation') {
      void workspaceDataRuntime.dispatchDataMutation({
        binding: binding as Parameters<typeof workspaceDataRuntime.dispatchDataMutation>[0]['binding'],
        payload: input.payload,
        runtimeValuesById: input.runtimeValuesById ?? {},
        source: input.source,
      }).catch((error: unknown) => console.error(error instanceof Error ? error.message : 'DATA_MUTATION_FAILED'));
      return;
    }
    if (binding.kind === 'call-code') {
      const reference = binding.reference as JsonRecord | undefined;
      const module = reference && typeof reference.artifactId === 'string'
        ? (workspaceCodeModules as Readonly<Record<string, JsonRecord>>)[reference.artifactId]
        : undefined;
      const callback = module && typeof reference?.exportName === 'string' ? module[reference.exportName] : undefined;
      if (typeof callback !== 'function') throw new Error('VUE_CODE_REFERENCE_UNAVAILABLE');
      void Promise.resolve(callback(input.payload, Object.freeze({ source: input.source, scope: input.scope })));
    }
  },
  resolveCodeValue(reference: JsonRecord): unknown {
    const module = typeof reference.artifactId === 'string'
      ? (workspaceCodeModules as Readonly<Record<string, JsonRecord>>)[reference.artifactId]
      : undefined;
    return module && typeof reference.exportName === 'string' ? module[reference.exportName] : undefined;
  },
});

type RouteViewState =
  | Readonly<{ status: 'pending' }>
  | Readonly<{ status: 'ready'; routeNodeId: string; pageDocumentId: string }>
  | Readonly<{ status: 'not-found' }>
  | Readonly<{ status: 'denied'; code: string }>
  | Readonly<{ status: 'failed'; code: string }>;

export default defineComponent({
  name: 'ProdivixWorkspaceVueApp',
  setup() {
    const state = ref<RouteViewState>(Object.freeze({ status: 'pending' }));
    let activeController: AbortController | undefined;
    let generation = 0;
    const activate = async () => {
      const currentGeneration = ++generation;
      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;
      const match = findRoute(readPathname());
      activeRouteLoaderValue = undefined;
      if (!match) {
        state.value = Object.freeze({ status: 'not-found' });
        return;
      }
      state.value = Object.freeze({ status: 'pending' });
      try {
        const guard = await invokeRouteRuntime(
          readRuntimeEntry(match.routeNodeId, 'guard'),
          Object.freeze({ routeId: match.routeNodeId }),
          { signal: controller.signal }
        );
        if (currentGeneration !== generation) return;
        if (guard?.kind === 'deny') {
          state.value = Object.freeze({ status: 'denied', code: guard.code });
          return;
        }
        if (guard?.kind === 'redirect') {
          window.location.assign(guard.location);
          return;
        }
        if (guard && guard.kind !== 'allow') throw new Error('SVR_ROUTE_GUARD_OUTCOME_INVALID');
        const loader = await invokeRouteRuntime(
          readRuntimeEntry(match.routeNodeId, 'loader'),
          Object.freeze({ routeId: match.routeNodeId }),
          { signal: controller.signal }
        );
        if (currentGeneration !== generation) return;
        if (loader?.kind === 'redirect') {
          window.location.assign(loader.location);
          return;
        }
        if (loader && loader.kind !== 'value') throw new Error('SVR_ROUTE_LOADER_OUTCOME_INVALID');
        activeRouteLoaderValue = loader?.kind === 'value' ? loader.value : undefined;
        state.value = Object.freeze({
          status: 'ready',
          routeNodeId: match.routeNodeId,
          pageDocumentId: match.pageDocumentId,
        });
      } catch (error) {
        if (currentGeneration !== generation || controller.signal.aborted) return;
        state.value = Object.freeze({
          status: 'failed',
          code: error instanceof Error ? error.message : 'SVR_ROUTE_RUNTIME_FAILED',
        });
      }
    };
    const onRouteChange = () => { void activate(); };
    onMounted(() => {
      window.addEventListener('popstate', onRouteChange);
      routeRuntimeSubscribers.add(onRouteChange);
      void activate();
    });
    onUnmounted(() => {
      generation += 1;
      activeController?.abort();
      routeRuntimeSubscribers.delete(onRouteChange);
      window.removeEventListener('popstate', onRouteChange);
      workspaceDataRuntime.dispose();
    });
    return () => {
      const current = state.value;
      if (current.status === 'pending') return h('main', { 'data-prodivix-route-runtime': 'pending', 'aria-busy': 'true' }, 'Loading route.');
      if (current.status === 'not-found') return h('main', { 'data-prodivix-route-not-found': 'true' }, 'Route not found.');
      if (current.status === 'denied') return h('main', { 'data-prodivix-route-runtime': 'denied', role: 'alert' }, 'Access denied.');
      if (current.status === 'failed') return h('main', { 'data-prodivix-route-runtime': 'failed', role: 'alert' }, 'Route runtime failed: ' + current.code);
      const Page = createWorkspacePirDocumentComponent(current.pageDocumentId);
      return h('div', { 'data-prodivix-vue-workspace': 'ready' }, [
        activeRouteLoaderValue === undefined
          ? null
          : h('output', { 'data-prodivix-route-loader': 'ready', hidden: true }, JSON.stringify(activeRouteLoaderValue)),
        h(Page, { key: current.routeNodeId, runtime: workspacePirRuntime, routeId: current.routeNodeId }),
      ]);
    };
  },
});
`;

  return Object.freeze({
    diagnostics: Object.freeze(diagnostics),
    module: {
      id: WORKSPACE_VUE_APP_MODULE_ID,
      kind: 'workspace-module',
      suggestedName: 'prodivixWorkspaceApp',
      desiredPath: 'src/prodivix-workspace-app.ts',
      language: 'ts',
      imports,
      body,
      sourceTrace: input.routeTopology.routes.flatMap(
        (route) => route.sourceTrace
      ),
      origin: {
        kind: 'generated',
        owner: 'prodivix',
        writePolicy: 'generated',
        updatePolicy: 'regenerate',
      },
    },
  });
};

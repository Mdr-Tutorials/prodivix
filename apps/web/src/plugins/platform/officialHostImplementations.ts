import type { ElementType } from 'react';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
} from '@prodivix/plugin-contracts';
import {
  pluginHostFailure,
  pluginHostSuccess,
  type PluginHostResult,
  type PluginOwnerRef,
  type PluginPackageAttestation,
} from '@prodivix/plugin-host';
import type { AdapterContext, AdapterResult } from '@/pir/renderer/registry';
import type { IconComponent } from '@/pir/renderer/iconRegistry';

export type HostPackageCoordinate = Readonly<{
  name: string;
  version: string;
}>;

export type OfficialComponentLibraryImplementation = Readonly<{
  kind: 'component-library';
  package: HostPackageCoordinate;
  components: Readonly<Record<string, ElementType>>;
}>;

export type OfficialRenderPolicyImplementation = Readonly<{
  kind: 'render-policy';
  mapProps?: (context: AdapterContext) => AdapterResult;
  wrapComponent?: (component: ElementType) => ElementType;
}>;

export type OfficialIconExportContext = Readonly<{
  providerId: string;
  requestedName: string;
  variantId?: string;
  subpath?: string;
}>;

export type OfficialIconProviderImplementation = Readonly<{
  kind: 'icon-provider';
  package: HostPackageCoordinate;
  resolveExport(
    exportName: string,
    context: OfficialIconExportContext
  ): IconComponent | null;
  listExports(): readonly string[];
  ensureReady?: () => Promise<void>;
}>;

export type OfficialHostImplementation =
  | OfficialComponentLibraryImplementation
  | OfficialRenderPolicyImplementation
  | OfficialIconProviderImplementation;

export type OfficialHostImplementationKind = OfficialHostImplementation['kind'];

export type OfficialHostModule = Readonly<{
  implementations: Readonly<Record<string, OfficialHostImplementation>>;
}>;

export type OfficialHostModuleCatalogEntry = Readonly<{
  pluginId: string;
  packageDigest: string;
  load(): Promise<OfficialHostModule>;
}>;

export const BUILT_IN_OFFICIAL_HOST_MODULE_CATALOG = Object.freeze(
  [] as const satisfies readonly OfficialHostModuleCatalogEntry[]
);

export type OfficialHostImplementationBinding<
  TKind extends OfficialHostImplementationKind,
> = Readonly<{
  value: Extract<OfficialHostImplementation, { kind: TKind }>;
  dispose(): void;
}>;

export type OfficialHostImplementationBindingSnapshot = Readonly<{
  owner: PluginOwnerRef;
  implementationId: string;
  kind: OfficialHostImplementationKind;
  leaseCount: number;
}>;

export type OfficialHostImplementationRegistry = Readonly<{
  bind<TKind extends OfficialHostImplementationKind>(
    input: Readonly<{
      owner: PluginOwnerRef;
      attestation: PluginPackageAttestation;
      implementationId: string;
      expectedKind: TKind;
      expectedPackage?: HostPackageCoordinate;
      signal: AbortSignal;
    }>
  ): Promise<PluginHostResult<OfficialHostImplementationBinding<TKind>>>;
  listBindings(): readonly OfficialHostImplementationBindingSnapshot[];
}>;

type PackageArtifactBindingInput = Readonly<{
  owner: PluginOwnerRef;
  attestation: PluginPackageAttestation;
  implementationId: string;
  package: HostPackageCoordinate;
  signal: AbortSignal;
}>;

export type LibraryArtifactResolver = Readonly<{
  resolveComponentLibrary(
    input: PackageArtifactBindingInput
  ): Promise<
    PluginHostResult<OfficialHostImplementationBinding<'component-library'>>
  >;
  resolveIconProvider(
    input: PackageArtifactBindingInput
  ): Promise<
    PluginHostResult<OfficialHostImplementationBinding<'icon-provider'>>
  >;
}>;

type OfficialHostImplementationBindInput<
  TKind extends OfficialHostImplementationKind,
> = Readonly<{
  owner: PluginOwnerRef;
  attestation: PluginPackageAttestation;
  implementationId: string;
  expectedKind: TKind;
  expectedPackage?: HostPackageCoordinate;
  signal: AbortSignal;
}>;

type BindingClaim = {
  owner: PluginOwnerRef;
  implementationId: string;
  implementation: OfficialHostImplementation;
  leaseCount: number;
};

const catalogKey = (pluginId: string, packageDigest: string) =>
  JSON.stringify([pluginId, packageDigest]);

const ownerKey = (owner: PluginOwnerRef) =>
  JSON.stringify([owner.pluginId, owner.installationId, owner.generation]);

const bindingKey = (owner: PluginOwnerRef, implementationId: string) =>
  JSON.stringify([ownerKey(owner), implementationId]);

const implementationMeta = (
  owner: PluginOwnerRef,
  implementationId: string,
  extra: Record<string, string | number | boolean | undefined> = {}
) => ({
  pluginId: owner.pluginId,
  installationId: owner.installationId,
  generation: owner.generation,
  implementationId,
  ...extra,
});

const normalizeModule = (module: OfficialHostModule): OfficialHostModule => {
  if (
    !module ||
    typeof module !== 'object' ||
    !module.implementations ||
    typeof module.implementations !== 'object' ||
    Array.isArray(module.implementations)
  ) {
    throw new Error('Official Host Module has no implementation catalog.');
  }
  const implementations: Record<string, OfficialHostImplementation> = {};
  Object.entries(module.implementations).forEach(([id, implementation]) => {
    if (!id.trim() || !implementation || typeof implementation !== 'object') {
      throw new Error(
        'Official Host Module contains an invalid implementation.'
      );
    }
    if (implementation.kind === 'component-library') {
      if (
        !implementation.package ||
        typeof implementation.package.name !== 'string' ||
        typeof implementation.package.version !== 'string' ||
        !implementation.components ||
        typeof implementation.components !== 'object' ||
        Array.isArray(implementation.components)
      ) {
        throw new Error(
          'Official component library implementation is invalid.'
        );
      }
      implementations[id] = Object.freeze({
        ...implementation,
        package: Object.freeze({ ...implementation.package }),
        components: Object.freeze({ ...implementation.components }),
      });
      return;
    }
    if (implementation.kind === 'icon-provider') {
      if (
        !implementation.package ||
        typeof implementation.package.name !== 'string' ||
        typeof implementation.package.version !== 'string' ||
        typeof implementation.resolveExport !== 'function' ||
        typeof implementation.listExports !== 'function' ||
        (implementation.ensureReady !== undefined &&
          typeof implementation.ensureReady !== 'function')
      ) {
        throw new Error('Official icon provider implementation is invalid.');
      }
      implementations[id] = Object.freeze({
        ...implementation,
        package: Object.freeze({ ...implementation.package }),
      });
      return;
    }
    if (implementation.kind === 'render-policy') {
      if (
        (implementation.mapProps !== undefined &&
          typeof implementation.mapProps !== 'function') ||
        (implementation.wrapComponent !== undefined &&
          typeof implementation.wrapComponent !== 'function')
      ) {
        throw new Error('Official Render Policy implementation is invalid.');
      }
      implementations[id] = Object.freeze({ ...implementation });
      return;
    }
    throw new Error(
      'Official Host Module contains an unknown implementation kind.'
    );
  });
  return Object.freeze({ implementations: Object.freeze(implementations) });
};

export const createLibraryArtifactResolver = (
  registry: OfficialHostImplementationRegistry
): LibraryArtifactResolver =>
  Object.freeze({
    resolveComponentLibrary: (input) =>
      registry.bind({
        owner: input.owner,
        attestation: input.attestation,
        implementationId: input.implementationId,
        expectedKind: 'component-library',
        expectedPackage: input.package,
        signal: input.signal,
      }),
    resolveIconProvider: (input) =>
      registry.bind({
        owner: input.owner,
        attestation: input.attestation,
        implementationId: input.implementationId,
        expectedKind: 'icon-provider',
        expectedPackage: input.package,
        signal: input.signal,
      }),
  });

const samePackage = (
  left: HostPackageCoordinate,
  right: HostPackageCoordinate
) => left.name === right.name && left.version === right.version;

export const createOfficialHostImplementationRegistry = (
  entries: readonly OfficialHostModuleCatalogEntry[],
  options: Readonly<{ allowDevelopment?: boolean }> = {}
): PluginHostResult<OfficialHostImplementationRegistry> => {
  const catalog = new Map<string, OfficialHostModuleCatalogEntry>();
  for (const entry of entries) {
    const key = catalogKey(entry.pluginId, entry.packageDigest);
    if (catalog.has(key)) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_BINDING_CONFLICT,
          'Official Host Module catalog contains a duplicate plugin and package digest entry.',
          {
            pluginId: entry.pluginId,
            packageDigest: entry.packageDigest,
          }
        ),
      ]);
    }
    catalog.set(key, Object.freeze({ ...entry }));
  }

  const modules = new Map<
    string,
    Promise<PluginHostResult<OfficialHostModule>>
  >();
  const claims = new Map<string, BindingClaim>();

  const loadModule = (
    entry: OfficialHostModuleCatalogEntry
  ): Promise<PluginHostResult<OfficialHostModule>> => {
    const key = catalogKey(entry.pluginId, entry.packageDigest);
    const current = modules.get(key);
    if (current) return current;
    const pending = Promise.resolve()
      .then(entry.load)
      .then((module) => pluginHostSuccess(normalizeModule(module)))
      .catch(() =>
        pluginHostFailure([
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_NOT_FOUND,
            'The build-attested Official Host Module could not be loaded.',
            {
              pluginId: entry.pluginId,
              packageDigest: entry.packageDigest,
              reasonCode: 'official-host-module-load-failed',
            }
          ),
        ])
      );
    modules.set(key, pending);
    return pending;
  };

  const bind = async <TKind extends OfficialHostImplementationKind>(
    input: OfficialHostImplementationBindInput<TKind>
  ): Promise<PluginHostResult<OfficialHostImplementationBinding<TKind>>> => {
    if (input.signal.aborted) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OPERATION_SUPERSEDED,
          'Official host implementation binding was canceled.',
          implementationMeta(input.owner, input.implementationId)
        ),
      ]);
    }
    const trustAllowed =
      input.attestation.publisherVerified &&
      (input.attestation.trustLevel === 'core' ||
        input.attestation.trustLevel === 'official' ||
        (options.allowDevelopment === true &&
          input.attestation.trustLevel === 'development'));
    const entry = catalog.get(
      catalogKey(input.owner.pluginId, input.attestation.packageDigest)
    );
    if (!trustAllowed || !entry) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_NOT_ATTESTED,
          'Plugin package is not attested for privileged host implementation binding.',
          implementationMeta(input.owner, input.implementationId, {
            packageDigest: input.attestation.packageDigest,
            trustLevel: input.attestation.trustLevel,
            publisherVerified: input.attestation.publisherVerified,
          })
        ),
      ]);
    }
    const loaded = await loadModule(entry);
    if (loaded.ok === false) return pluginHostFailure(loaded.diagnostics);
    if (input.signal.aborted) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OPERATION_SUPERSEDED,
          'Official host implementation binding was superseded while loading its module.',
          implementationMeta(input.owner, input.implementationId)
        ),
      ]);
    }
    const implementation = loaded.value.implementations[input.implementationId];
    if (!implementation) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_NOT_FOUND,
          `Official Host Module does not export implementation ${JSON.stringify(input.implementationId)}.`,
          implementationMeta(input.owner, input.implementationId)
        ),
      ]);
    }
    if (implementation.kind !== input.expectedKind) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_KIND_MISMATCH,
          `Host implementation ${JSON.stringify(input.implementationId)} has kind ${JSON.stringify(implementation.kind)}, expected ${JSON.stringify(input.expectedKind)}.`,
          implementationMeta(input.owner, input.implementationId, {
            implementationKind: implementation.kind,
            expectedImplementationKind: input.expectedKind,
          })
        ),
      ]);
    }
    if (
      input.expectedPackage &&
      'package' in implementation &&
      !samePackage(implementation.package, input.expectedPackage)
    ) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_NOT_ATTESTED,
          'Host implementation package coordinate does not match the contribution descriptor.',
          implementationMeta(input.owner, input.implementationId, {
            packageName: input.expectedPackage.name,
            packageVersion: input.expectedPackage.version,
            attestedPackageName: implementation.package.name,
            attestedPackageVersion: implementation.package.version,
          })
        ),
      ]);
    }

    const key = bindingKey(input.owner, input.implementationId);
    const claim = claims.get(key);
    if (claim && claim.implementation !== implementation) {
      return pluginHostFailure([
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.OFFICIAL_IMPLEMENTATION_BINDING_CONFLICT,
          'Owner generation is already bound to a different host implementation.',
          implementationMeta(input.owner, input.implementationId)
        ),
      ]);
    }
    if (claim) {
      claim.leaseCount += 1;
    } else {
      claims.set(key, {
        owner: Object.freeze({ ...input.owner }),
        implementationId: input.implementationId,
        implementation,
        leaseCount: 1,
      });
    }
    let disposed = false;
    const typedImplementation = implementation as Extract<
      OfficialHostImplementation,
      { kind: TKind }
    >;
    return pluginHostSuccess(
      Object.freeze({
        value: typedImplementation,
        dispose: () => {
          if (disposed) return;
          disposed = true;
          const current = claims.get(key);
          if (!current || current.implementation !== implementation) return;
          if (current.leaseCount <= 1) {
            claims.delete(key);
            return;
          }
          current.leaseCount -= 1;
        },
      })
    );
  };

  return pluginHostSuccess(
    Object.freeze({
      bind,
      listBindings: () =>
        Object.freeze(
          [...claims.values()]
            .map((claim) =>
              Object.freeze({
                owner: claim.owner,
                implementationId: claim.implementationId,
                kind: claim.implementation.kind,
                leaseCount: claim.leaseCount,
              })
            )
            .sort(
              (left, right) =>
                left.owner.pluginId.localeCompare(right.owner.pluginId) ||
                left.owner.generation - right.owner.generation ||
                left.implementationId.localeCompare(right.implementationId)
            )
        ),
    })
  );
};

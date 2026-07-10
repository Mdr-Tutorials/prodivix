import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import semver from 'semver';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '#contracts/diagnostics';
import type {
  CapabilityRequest,
  PluginManifestV1,
} from '#contracts/generated/pluginManifest.generated';
import { PLUGIN_MANIFEST_V1_SCHEMA } from '#contracts/generated/pluginManifestSchema.generated';
import {
  validateJsonValue,
  type JsonValueValidationOptions,
} from '#contracts/jsonValue';
import { appendJsonPointer } from '#contracts/jsonPointer';

export type ValidatePluginManifestOptions = JsonValueValidationOptions & {
  hostVersion?: string;
  knownCommandIds?: readonly string[];
};

export type ValidatePluginManifestResult =
  | {
      ok: true;
      manifest: PluginManifestV1;
      diagnostics: readonly [];
    }
  | {
      ok: false;
      diagnostics: readonly PluginDiagnostic[];
    };

const ajv = new Ajv2020({
  allErrors: true,
  strict: true,
  validateFormats: true,
});
addFormats(ajv);
const validateStructure = ajv.compile<PluginManifestV1>(
  PLUGIN_MANIFEST_V1_SCHEMA
);

const schemaErrorPath = (error: ErrorObject): string => {
  if (error.keyword === 'required') {
    return appendJsonPointer(
      error.instancePath,
      String(error.params.missingProperty)
    );
  }
  if (error.keyword === 'additionalProperties') {
    return appendJsonPointer(
      error.instancePath,
      String(error.params.additionalProperty)
    );
  }
  return error.instancePath;
};

const schemaDiagnostics = (errors: ErrorObject[]): PluginDiagnostic[] =>
  errors.map((error) => {
    const manifestPath = schemaErrorPath(error);
    return createPluginDiagnostic(
      PLUGIN_DIAGNOSTIC_CODES.SCHEMA_VIOLATION,
      `Plugin Manifest field ${manifestPath || '<root>'} ${error.message ?? 'is invalid'}.`,
      {
        manifestPath,
        schemaPath: error.schemaPath,
        schemaKeyword: error.keyword,
      }
    );
  });

const capabilityKey = (capability: CapabilityRequest): string =>
  `${capability.id}\u0000${'scope' in capability ? capability.scope : ''}`;

const capabilityMeta = (
  capability: CapabilityRequest
): Pick<
  NonNullable<PluginDiagnostic['meta']>,
  'capabilityId' | 'capabilityScope'
> => ({
  capabilityId: capability.id,
  capabilityScope: 'scope' in capability ? capability.scope : undefined,
});

const resourceEntries = (
  manifest: PluginManifestV1
): Array<{ path: string; manifestPath: string }> => {
  const entries: Array<{ path: string; manifestPath: string }> = [];
  if (manifest.icon) {
    entries.push({ path: manifest.icon, manifestPath: '/icon' });
  }
  if (manifest.entrypoints?.runtime) {
    entries.push({
      path: manifest.entrypoints.runtime.path,
      manifestPath: '/entrypoints/runtime/path',
    });
  }
  manifest.entrypoints?.ui?.forEach((entrypoint, index) => {
    entries.push({
      path: entrypoint.path,
      manifestPath: `/entrypoints/ui/${index}/path`,
    });
  });
  manifest.contributes.forEach((contribution, index) => {
    if (contribution.source.kind === 'resource') {
      entries.push({
        path: contribution.source.path,
        manifestPath: `/contributes/${index}/source/path`,
      });
    }
  });
  return entries;
};

const isPortableResourcePath = (resourcePath: string): boolean => {
  if (
    !resourcePath.startsWith('./') ||
    resourcePath.includes('\\') ||
    resourcePath.includes('?') ||
    resourcePath.includes('#') ||
    resourcePath.includes('://')
  ) {
    return false;
  }

  const segments = resourcePath.slice(2).split('/');
  return (
    segments.length > 0 &&
    segments.every((segment) => {
      if (
        segment.length === 0 ||
        segment === '.' ||
        segment === '..' ||
        /[. ]$/.test(segment)
      ) {
        return false;
      }
      const basename = segment.split('.')[0]?.toLowerCase();
      return !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/.test(basename ?? '');
    })
  );
};

const validateSemantics = (
  manifest: PluginManifestV1,
  options: ValidatePluginManifestOptions
): PluginDiagnostic[] => {
  const diagnostics: PluginDiagnostic[] = [];
  const pluginMeta = { pluginId: manifest.id } as const;

  if (!semver.valid(manifest.version)) {
    diagnostics.push(
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.INVALID_PLUGIN_VERSION,
        `Plugin version ${JSON.stringify(manifest.version)} is not valid SemVer.`,
        { ...pluginMeta, manifestPath: '/version' }
      )
    );
  }

  const engineRange = semver.validRange(manifest.engines.prodivix);
  if (!engineRange) {
    diagnostics.push(
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.INVALID_ENGINE_RANGE,
        `Prodivix engine range ${JSON.stringify(manifest.engines.prodivix)} is invalid.`,
        {
          ...pluginMeta,
          manifestPath: '/engines/prodivix',
          engineRange: manifest.engines.prodivix,
        }
      )
    );
  } else if (options.hostVersion !== undefined) {
    const hostVersion = semver.valid(options.hostVersion);
    if (!hostVersion || !semver.satisfies(hostVersion, engineRange)) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.INCOMPATIBLE_HOST,
          `Prodivix ${JSON.stringify(options.hostVersion)} does not satisfy ${JSON.stringify(manifest.engines.prodivix)}.`,
          {
            ...pluginMeta,
            manifestPath: '/engines/prodivix',
            hostVersion: options.hostVersion,
            engineRange: manifest.engines.prodivix,
          }
        )
      );
    }
  }

  if (manifest.id.startsWith('@')) {
    const separator = manifest.id.indexOf('/');
    const scope = separator > 1 ? manifest.id.slice(1, separator) : undefined;
    if (scope !== manifest.publisher) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.PUBLISHER_SCOPE_MISMATCH,
          `Publisher ${JSON.stringify(manifest.publisher)} does not match plugin scope ${JSON.stringify(scope)}.`,
          { ...pluginMeta, manifestPath: '/publisher' }
        )
      );
    }
  }

  const capabilities = new Set<string>();
  manifest.capabilities.forEach((capability, index) => {
    const key = capabilityKey(capability);
    if (capabilities.has(key)) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CAPABILITY,
          `Capability ${JSON.stringify(capability.id)} is declared more than once for the same scope.`,
          {
            ...pluginMeta,
            manifestPath: `/capabilities/${index}`,
            ...capabilityMeta(capability),
          }
        )
      );
    } else {
      capabilities.add(key);
    }
  });

  const contributionIds = new Set<string>();
  manifest.contributes.forEach((contribution, index) => {
    if (contributionIds.has(contribution.id)) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_CONTRIBUTION,
          `Contribution ${JSON.stringify(contribution.id)} is declared more than once.`,
          {
            ...pluginMeta,
            manifestPath: `/contributes/${index}/id`,
            contributionId: contribution.id,
          }
        )
      );
    } else {
      contributionIds.add(contribution.id);
    }

    if (!capabilities.has(`extension.register\u0000${contribution.point}`)) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.MISSING_REGISTRATION_CAPABILITY,
          `Contribution ${JSON.stringify(contribution.id)} requires extension.register for ${JSON.stringify(contribution.point)}.`,
          {
            ...pluginMeta,
            manifestPath: `/contributes/${index}/point`,
            contributionId: contribution.id,
            capabilityId: 'extension.register',
            capabilityScope: contribution.point,
          }
        )
      );
    }
  });

  const knownCommandIds =
    options.knownCommandIds === undefined
      ? undefined
      : new Set(options.knownCommandIds);
  manifest.activationEvents?.forEach((event, index) => {
    if (event.type === 'command') {
      if (knownCommandIds && !knownCommandIds.has(event.commandId)) {
        diagnostics.push(
          createPluginDiagnostic(
            PLUGIN_DIAGNOSTIC_CODES.INVALID_ACTIVATION_REFERENCE,
            `Activation command ${JSON.stringify(event.commandId)} is not registered by the host.`,
            {
              ...pluginMeta,
              manifestPath: `/activationEvents/${index}/commandId`,
              commandId: event.commandId,
            }
          )
        );
      }
      return;
    }
    if (event.type !== 'contribution.use') return;

    const contribution = event.contributionId
      ? manifest.contributes.find(
          (candidate) =>
            candidate.id === event.contributionId &&
            candidate.point === event.point
        )
      : manifest.contributes.find(
          (candidate) => candidate.point === event.point
        );
    if (!contribution) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.INVALID_ACTIVATION_REFERENCE,
          `Activation event does not reference a declared ${JSON.stringify(event.point)} contribution.`,
          {
            ...pluginMeta,
            manifestPath: `/activationEvents/${index}`,
            contributionId: event.contributionId,
          }
        )
      );
    }
  });

  if (
    (manifest.activationEvents?.length ?? 0) > 0 &&
    !manifest.entrypoints?.runtime
  ) {
    diagnostics.push(
      createPluginDiagnostic(
        PLUGIN_DIAGNOSTIC_CODES.MISSING_RUNTIME_ENTRYPOINT,
        'Plugin activation events require a runtime entrypoint.',
        { ...pluginMeta, manifestPath: '/entrypoints/runtime' }
      )
    );
  }

  const uiEntrypointIds = new Set<string>();
  manifest.entrypoints?.ui?.forEach((entrypoint, index) => {
    if (uiEntrypointIds.has(entrypoint.id)) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.DUPLICATE_UI_ENTRYPOINT,
          `UI entrypoint ${JSON.stringify(entrypoint.id)} is declared more than once.`,
          {
            ...pluginMeta,
            manifestPath: `/entrypoints/ui/${index}/id`,
          }
        )
      );
    } else {
      uiEntrypointIds.add(entrypoint.id);
    }
  });

  const caseFoldedPaths = new Map<string, string>();
  for (const resource of resourceEntries(manifest)) {
    if (!isPortableResourcePath(resource.path)) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.INVALID_RESOURCE_PATH,
          `Resource path ${JSON.stringify(resource.path)} is not portable.`,
          {
            ...pluginMeta,
            manifestPath: resource.manifestPath,
            resourcePath: resource.path,
          }
        )
      );
      continue;
    }

    const foldedPath = resource.path.toLowerCase();
    const existingPath = caseFoldedPaths.get(foldedPath);
    if (existingPath && existingPath !== resource.path) {
      diagnostics.push(
        createPluginDiagnostic(
          PLUGIN_DIAGNOSTIC_CODES.INVALID_RESOURCE_PATH,
          `Resource path ${JSON.stringify(resource.path)} collides with ${JSON.stringify(existingPath)} on case-insensitive filesystems.`,
          {
            ...pluginMeta,
            manifestPath: resource.manifestPath,
            resourcePath: resource.path,
            conflictingPath: existingPath,
          }
        )
      );
    } else if (!existingPath) {
      caseFoldedPaths.set(foldedPath, resource.path);
    }
  }

  return diagnostics;
};

export const validatePluginManifest = (
  input: unknown,
  options: ValidatePluginManifestOptions = {}
): ValidatePluginManifestResult => {
  const jsonResult = validateJsonValue(input, options);
  if (!jsonResult.ok) {
    return jsonResult;
  }
  if (!validateStructure(jsonResult.value)) {
    return {
      ok: false,
      diagnostics: schemaDiagnostics(validateStructure.errors ?? []),
    };
  }

  const diagnostics = validateSemantics(jsonResult.value, options);
  return diagnostics.length > 0
    ? { ok: false, diagnostics }
    : { ok: true, manifest: jsonResult.value, diagnostics: [] };
};

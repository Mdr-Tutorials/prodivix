export {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  PLUGIN_DIAGNOSTIC_DEFINITIONS,
  type PluginDiagnostic,
  type PluginDiagnosticCode,
  type PluginDiagnosticDefinition,
  type PluginDiagnosticMeta,
  type PluginDiagnosticSeverity,
  type PluginDiagnosticStage,
} from '#contracts/diagnostics';
export type {
  ActivationEvent,
  Artifact,
  CapabilityRequest,
  ContributionDeclaration,
  ContributionMetadata,
  ContributionPoint,
  ContractVersion,
  Entrypoints,
  InlineContributionSource,
  Integrity,
  JsonValue,
  LocalId,
  PackageRelativePath,
  PluginId,
  PluginManifestV1,
  PublisherId,
  QualifiedId,
  ResourceContributionSource,
  UiEntrypoint,
} from '#contracts/generated/pluginManifest.generated';
export {
  BUILT_IN_CONTRIBUTION_POINTS,
  isBuiltInContributionPoint,
  type BuiltInContributionPoint,
} from '#contracts/contributionPoints';
export type {
  Group as PaletteGroupDescriptor,
  Item as PaletteItemDescriptor,
  JsonObject as PaletteJsonObject,
  Option as PaletteOptionDescriptor,
  PaletteContributionV1,
  Placement as PalettePlacement,
  Presentation as PalettePresentation,
  Status as PaletteStatusDescriptor,
  Variant as PaletteVariantDescriptor,
} from '#contracts/generated/paletteContribution.generated';
export {
  PLUGIN_MANIFEST_V1_SCHEMA,
  PLUGIN_MANIFEST_V1_SCHEMA_ID,
  PLUGIN_MANIFEST_V1_SCHEMA_VERSION,
} from '#contracts/generated/pluginManifestSchema.generated';
export {
  PALETTE_CONTRIBUTION_V1_SCHEMA,
  PALETTE_CONTRIBUTION_V1_SCHEMA_ID,
  PALETTE_CONTRIBUTION_V1_SCHEMA_VERSION,
} from '#contracts/generated/paletteContributionSchema.generated';
export {
  DEFAULT_JSON_VALUE_MAX_DEPTH,
  DEFAULT_JSON_VALUE_MAX_NODES,
  validateJsonValue,
  type JsonValueValidationOptions,
  type JsonValueValidationResult,
} from '#contracts/jsonValue';
export {
  DEFAULT_PLUGIN_MANIFEST_MAX_BYTES,
  parsePluginManifest,
  type ParsePluginManifestOptions,
  type ParsePluginManifestResult,
} from '#contracts/parsePluginManifest';
export {
  DEFAULT_STRICT_JSON_MAX_BYTES,
  parseStrictJsonDocument,
  type ParseStrictJsonDocumentOptions,
  type ParseStrictJsonDocumentResult,
  type StrictJsonDocumentKind,
} from '#contracts/parseStrictJsonDocument';
export {
  parseAndValidatePluginManifest,
  type ParseAndValidatePluginManifestOptions,
  type ParseAndValidatePluginManifestResult,
} from '#contracts/parseAndValidatePluginManifest';
export {
  validatePluginManifest,
  type ValidatePluginManifestOptions,
  type ValidatePluginManifestResult,
} from '#contracts/validatePluginManifest';
export {
  validatePaletteContribution,
  type ValidatePaletteContributionOptions,
  type ValidatePaletteContributionResult,
} from '#contracts/validatePaletteContribution';

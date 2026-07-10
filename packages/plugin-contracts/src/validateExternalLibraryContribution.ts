import type { ExternalLibraryContributionV1 } from '#contracts/generated/externalLibraryContribution.generated';
import { EXTERNAL_LIBRARY_CONTRIBUTION_V1_SCHEMA } from '#contracts/generated/externalLibraryContributionSchema.generated';
import type { PluginDiagnostic } from '#contracts/diagnostics';
import {
  compileContributionSchema,
  contributionContractDiagnostic,
  validateContributionStructure,
  type ContributionDescriptorValidationResult,
} from '#contracts/contributionValidation';
import type { JsonValueValidationOptions } from '#contracts/jsonValue';

export type ValidateExternalLibraryContributionOptions =
  JsonValueValidationOptions;
export type ValidateExternalLibraryContributionResult =
  ContributionDescriptorValidationResult<ExternalLibraryContributionV1>;

const POINT = 'externalLibrary';
const validateStructure =
  compileContributionSchema<ExternalLibraryContributionV1>(
    EXTERNAL_LIBRARY_CONTRIBUTION_V1_SCHEMA
  );

const duplicateFieldDiagnostics = <TItem>(
  items: readonly TItem[],
  read: (item: TItem) => string,
  path: string,
  field: string,
  label: string
): PluginDiagnostic[] => {
  const seen = new Set<string>();
  const diagnostics: PluginDiagnostic[] = [];
  items.forEach((item, index) => {
    const value = read(item);
    if (seen.has(value)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `${label} ${JSON.stringify(value)} is declared more than once.`,
          `${path}/${index}/${field}`
        )
      );
    }
    seen.add(value);
  });
  return diagnostics;
};

const validateSemantics = (
  descriptor: ExternalLibraryContributionV1
): PluginDiagnostic[] => {
  const diagnostics = [
    ...duplicateFieldDiagnostics(
      descriptor.components,
      (component) => component.exportName,
      '/components',
      'exportName',
      'Component export'
    ),
    ...duplicateFieldDiagnostics(
      descriptor.components,
      (component) => component.componentName,
      '/components',
      'componentName',
      'Component name'
    ),
    ...duplicateFieldDiagnostics(
      descriptor.components,
      (component) => component.runtimeType,
      '/components',
      'runtimeType',
      'Runtime type'
    ),
    ...duplicateFieldDiagnostics(
      descriptor.dependencies,
      (dependency) => dependency.name,
      '/dependencies',
      'name',
      'Dependency package'
    ),
  ];
  const include = new Set<string>();
  descriptor.exportDiscovery.include?.forEach((exportName, index) => {
    if (include.has(exportName)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Included export ${JSON.stringify(exportName)} is declared more than once.`,
          `/exportDiscovery/include/${index}`
        )
      );
    }
    include.add(exportName);
  });
  const exclude = new Set<string>();
  descriptor.exportDiscovery.exclude?.forEach((exportName, index) => {
    if (exclude.has(exportName)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Excluded export ${JSON.stringify(exportName)} is declared more than once.`,
          `/exportDiscovery/exclude/${index}`
        )
      );
    }
    if (include.has(exportName)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Export ${JSON.stringify(exportName)} cannot be both included and excluded.`,
          `/exportDiscovery/exclude/${index}`
        )
      );
    }
    exclude.add(exportName);
  });

  descriptor.components.forEach((component, componentIndex) => {
    const path = `/components/${componentIndex}`;
    if (include.size > 0 && !include.has(component.exportName)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Component export ${JSON.stringify(component.exportName)} is missing from exportDiscovery.include.`,
          `${path}/exportName`
        )
      );
    }
    if (exclude.has(component.exportName)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Component export ${JSON.stringify(component.exportName)} is excluded from discovery.`,
          `${path}/exportName`
        )
      );
    }
    diagnostics.push(
      ...duplicateFieldDiagnostics(
        component.props ?? [],
        (prop) => prop.name,
        `${path}/props`,
        'name',
        'Component prop'
      ),
      ...duplicateFieldDiagnostics(
        component.slots ?? [],
        (slot) => slot.name,
        `${path}/slots`,
        'name',
        'Component slot'
      )
    );
    const tags = new Set<string>();
    component.behaviorTags?.forEach((tag, tagIndex) => {
      if (tags.has(tag)) {
        diagnostics.push(
          contributionContractDiagnostic(
            POINT,
            `Behavior tag ${JSON.stringify(tag)} is declared more than once.`,
            `${path}/behaviorTags/${tagIndex}`
          )
        );
      }
      tags.add(tag);
    });
  });
  descriptor.dependencies.forEach((dependency, index) => {
    if (dependency.name === descriptor.package.name) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          'The primary library package must not be repeated in dependencies.',
          `/dependencies/${index}/name`
        )
      );
    }
  });
  return diagnostics;
};

export const validateExternalLibraryContribution = (
  input: unknown,
  options: ValidateExternalLibraryContributionOptions = {}
): ValidateExternalLibraryContributionResult => {
  const result = validateContributionStructure(input, {
    point: POINT,
    label: 'External Library contribution',
    validate: validateStructure,
    json: options,
  });
  if (!result.ok) return result;
  const diagnostics = validateSemantics(result.descriptor);
  return diagnostics.length > 0 ? { ok: false, diagnostics } : result;
};

import type { IconProviderContributionV1 } from '#contracts/generated/iconProviderContribution.generated';
import { ICON_PROVIDER_CONTRIBUTION_V1_SCHEMA } from '#contracts/generated/iconProviderContributionSchema.generated';
import type { PluginDiagnostic } from '#contracts/diagnostics';
import {
  compileContributionSchema,
  contributionContractDiagnostic,
  validateContributionStructure,
  type ContributionDescriptorValidationResult,
} from '#contracts/contributionValidation';
import type { JsonValueValidationOptions } from '#contracts/jsonValue';

export type ValidateIconProviderContributionOptions =
  JsonValueValidationOptions;
export type ValidateIconProviderContributionResult =
  ContributionDescriptorValidationResult<IconProviderContributionV1>;

const POINT = 'iconProvider';
const validateStructure = compileContributionSchema<IconProviderContributionV1>(
  ICON_PROVIDER_CONTRIBUTION_V1_SCHEMA
);

const validateSemantics = (
  descriptor: IconProviderContributionV1
): PluginDiagnostic[] => {
  const diagnostics: PluginDiagnostic[] = [];
  const variants = new Set<string>();
  descriptor.exports.variants?.forEach((variant, index) => {
    if (variants.has(variant.id)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Icon variant ${JSON.stringify(variant.id)} is declared more than once.`,
          `/exports/variants/${index}/id`
        )
      );
    }
    variants.add(variant.id);
  });
  if (
    descriptor.normalization.defaultVariant &&
    !variants.has(descriptor.normalization.defaultVariant)
  ) {
    diagnostics.push(
      contributionContractDiagnostic(
        POINT,
        `Default icon variant ${JSON.stringify(descriptor.normalization.defaultVariant)} is not declared.`,
        '/normalization/defaultVariant'
      )
    );
  }

  const aliases = new Map<string, string>();
  descriptor.normalization.aliases?.forEach((alias, index) => {
    if (aliases.has(alias.from)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Icon alias source ${JSON.stringify(alias.from)} is declared more than once.`,
          `/normalization/aliases/${index}/from`
        )
      );
    }
    if (alias.from === alias.to) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          'Icon alias source and target must differ.',
          `/normalization/aliases/${index}`
        )
      );
    }
    aliases.set(alias.from, alias.to);
  });
  for (const source of aliases.keys()) {
    const visited = new Set<string>();
    let current: string | undefined = source;
    while (current && aliases.has(current)) {
      if (visited.has(current)) {
        diagnostics.push(
          contributionContractDiagnostic(
            POINT,
            `Icon alias chain beginning at ${JSON.stringify(source)} contains a cycle.`,
            '/normalization/aliases'
          )
        );
        break;
      }
      visited.add(current);
      current = aliases.get(current);
    }
  }

  const namedExports = descriptor.exports.strategy === 'named-exports';
  if (
    namedExports &&
    (descriptor.codegen.importKind !== 'named' ||
      descriptor.codegen.sourceMode !== 'package')
  ) {
    diagnostics.push(
      contributionContractDiagnostic(
        POINT,
        'named-exports requires named imports from the provider package.',
        '/codegen'
      )
    );
  }
  if (
    !namedExports &&
    (descriptor.codegen.importKind !== 'default' ||
      descriptor.codegen.sourceMode !== 'icon-subpath')
  ) {
    diagnostics.push(
      contributionContractDiagnostic(
        POINT,
        'default-icon-subpath requires default imports from an icon subpath.',
        '/codegen'
      )
    );
  }
  return diagnostics;
};

export const validateIconProviderContribution = (
  input: unknown,
  options: ValidateIconProviderContributionOptions = {}
): ValidateIconProviderContributionResult => {
  const result = validateContributionStructure(input, {
    point: POINT,
    label: 'Icon Provider contribution',
    validate: validateStructure,
    json: options,
  });
  if (!result.ok) return result;
  const diagnostics = validateSemantics(result.descriptor);
  return diagnostics.length > 0 ? { ok: false, diagnostics } : result;
};

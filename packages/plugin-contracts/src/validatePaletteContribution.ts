import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';
import {
  createPluginDiagnostic,
  PLUGIN_DIAGNOSTIC_CODES,
  type PluginDiagnostic,
} from '#contracts/diagnostics';
import type {
  Option,
  PaletteContributionV1,
} from '#contracts/generated/paletteContribution.generated';
import { PALETTE_CONTRIBUTION_V1_SCHEMA } from '#contracts/generated/paletteContributionSchema.generated';
import {
  validateJsonValue,
  type JsonValueValidationOptions,
} from '#contracts/jsonValue';
import { appendJsonPointer } from '#contracts/jsonPointer';

export type ValidatePaletteContributionOptions = JsonValueValidationOptions;

export type ValidatePaletteContributionResult =
  | {
      ok: true;
      descriptor: PaletteContributionV1;
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
const validateStructure = ajv.compile<PaletteContributionV1>(
  PALETTE_CONTRIBUTION_V1_SCHEMA
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

const contributionDiagnostic = (
  message: string,
  documentPath: string,
  schema?: Pick<ErrorObject, 'schemaPath' | 'keyword'>
): PluginDiagnostic =>
  createPluginDiagnostic(
    PLUGIN_DIAGNOSTIC_CODES.CONTRIBUTION_SCHEMA_VIOLATION,
    message,
    {
      contributionPoint: 'paletteContribution',
      contractVersion: '1.0',
      documentPath,
      schemaPath: schema?.schemaPath,
      schemaKeyword: schema?.keyword,
    }
  );

const schemaDiagnostics = (errors: ErrorObject[]): PluginDiagnostic[] =>
  errors.map((error) => {
    const documentPath = schemaErrorPath(error);
    return contributionDiagnostic(
      `Palette contribution field ${documentPath || '<root>'} ${error.message ?? 'is invalid'}.`,
      documentPath,
      error
    );
  });

const validateUniqueOptions = (
  options: readonly Option[],
  documentPath: string
): PluginDiagnostic[] => {
  const diagnostics: PluginDiagnostic[] = [];
  const ids = new Set<string>();
  const values = new Set<string>();
  options.forEach((option, index) => {
    if (ids.has(option.id)) {
      diagnostics.push(
        contributionDiagnostic(
          `Palette option id ${JSON.stringify(option.id)} is declared more than once.`,
          `${documentPath}/${index}/id`
        )
      );
    } else {
      ids.add(option.id);
    }
    if (values.has(option.value)) {
      diagnostics.push(
        contributionDiagnostic(
          `Palette option value ${JSON.stringify(option.value)} is declared more than once.`,
          `${documentPath}/${index}/value`
        )
      );
    } else {
      values.add(option.value);
    }
  });
  return diagnostics;
};

const validateSemantics = (
  descriptor: PaletteContributionV1
): PluginDiagnostic[] => {
  const diagnostics: PluginDiagnostic[] = [];
  const groupIds = new Set<string>();
  const itemIds = new Set<string>();

  descriptor.groups.forEach((group, groupIndex) => {
    const groupPath = `/groups/${groupIndex}`;
    if (groupIds.has(group.id)) {
      diagnostics.push(
        contributionDiagnostic(
          `Palette group id ${JSON.stringify(group.id)} is declared more than once.`,
          `${groupPath}/id`
        )
      );
    } else {
      groupIds.add(group.id);
    }

    group.items.forEach((item, itemIndex) => {
      const itemPath = `${groupPath}/items/${itemIndex}`;
      if (itemIds.has(item.id)) {
        diagnostics.push(
          contributionDiagnostic(
            `Palette item id ${JSON.stringify(item.id)} is declared more than once.`,
            `${itemPath}/id`
          )
        );
      } else {
        itemIds.add(item.id);
      }

      if (item.presentation?.sizes) {
        diagnostics.push(
          ...validateUniqueOptions(
            item.presentation.sizes,
            `${itemPath}/presentation/sizes`
          )
        );
      }

      const variantIds = new Set<string>();
      item.presentation?.variants?.forEach((variant, variantIndex) => {
        if (variantIds.has(variant.id)) {
          diagnostics.push(
            contributionDiagnostic(
              `Palette variant id ${JSON.stringify(variant.id)} is declared more than once.`,
              `${itemPath}/presentation/variants/${variantIndex}/id`
            )
          );
        } else {
          variantIds.add(variant.id);
        }
      });

      const status = item.presentation?.status;
      if (!status) return;
      diagnostics.push(
        ...validateUniqueOptions(
          status.options,
          `${itemPath}/presentation/status/options`
        )
      );
      if (
        status.defaultValue !== undefined &&
        !status.options.some((option) => option.value === status.defaultValue)
      ) {
        diagnostics.push(
          contributionDiagnostic(
            `Palette status default ${JSON.stringify(status.defaultValue)} is not present in its options.`,
            `${itemPath}/presentation/status/defaultValue`
          )
        );
      }
    });
  });

  return diagnostics;
};

export const validatePaletteContribution = (
  input: unknown,
  options: ValidatePaletteContributionOptions = {}
): ValidatePaletteContributionResult => {
  const jsonResult = validateJsonValue(input, options);
  if (!jsonResult.ok) return jsonResult;
  if (!validateStructure(jsonResult.value)) {
    return {
      ok: false,
      diagnostics: schemaDiagnostics(validateStructure.errors ?? []),
    };
  }

  const diagnostics = validateSemantics(jsonResult.value);
  return diagnostics.length > 0
    ? { ok: false, diagnostics }
    : { ok: true, descriptor: jsonResult.value, diagnostics: [] };
};

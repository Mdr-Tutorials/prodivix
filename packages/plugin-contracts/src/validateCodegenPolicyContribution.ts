import type { CodegenPolicyContributionV1 } from '#contracts/generated/codegenPolicyContribution.generated';
import { CODEGEN_POLICY_CONTRIBUTION_V1_SCHEMA } from '#contracts/generated/codegenPolicyContributionSchema.generated';
import type { PluginDiagnostic } from '#contracts/diagnostics';
import {
  compileContributionSchema,
  contributionContractDiagnostic,
  validateContributionStructure,
  validatePropsTransform,
  type ContributionDescriptorValidationResult,
} from '#contracts/contributionValidation';
import type { JsonValueValidationOptions } from '#contracts/jsonValue';

export type ValidateCodegenPolicyContributionOptions =
  JsonValueValidationOptions;
export type ValidateCodegenPolicyContributionResult =
  ContributionDescriptorValidationResult<CodegenPolicyContributionV1>;

const POINT = 'codegenPolicy';
const validateStructure =
  compileContributionSchema<CodegenPolicyContributionV1>(
    CODEGEN_POLICY_CONTRIBUTION_V1_SCHEMA
  );

const validateSemantics = (
  descriptor: CodegenPolicyContributionV1
): PluginDiagnostic[] => {
  const diagnostics: PluginDiagnostic[] = [];
  const dependencyNames = new Set<string>();
  descriptor.dependencies.forEach((dependency, index) => {
    if (dependencyNames.has(dependency.name)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Codegen dependency ${JSON.stringify(dependency.name)} is declared more than once.`,
          `/dependencies/${index}/name`
        )
      );
    }
    dependencyNames.add(dependency.name);
  });

  const ruleIds = new Set<string>();
  const runtimeTypes = new Set<string>();
  descriptor.rules.forEach((rule, index) => {
    const path = `/rules/${index}`;
    if (ruleIds.has(rule.id)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Codegen rule id ${JSON.stringify(rule.id)} is declared more than once.`,
          `${path}/id`
        )
      );
    }
    if (runtimeTypes.has(rule.runtimeType)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Runtime type ${JSON.stringify(rule.runtimeType)} has more than one codegen rule.`,
          `${path}/runtimeType`
        )
      );
    }
    ruleIds.add(rule.id);
    runtimeTypes.add(rule.runtimeType);
    if (!dependencyNames.has(rule.import.packageName)) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Import package ${JSON.stringify(rule.import.packageName)} is missing from dependencies.`,
          `${path}/import/packageName`
        )
      );
    }
    const importLocal = rule.import.local ?? rule.import.imported;
    if (rule.elementPath[0] !== importLocal) {
      diagnostics.push(
        contributionContractDiagnostic(
          POINT,
          `Element path must begin with import binding ${JSON.stringify(importLocal)}.`,
          `${path}/elementPath/0`
        )
      );
    }
    diagnostics.push(
      ...validatePropsTransform(POINT, rule.props, `${path}/props`)
    );
  });
  if (
    descriptor.unsupported.behavior !== 'passthrough' &&
    !descriptor.unsupported.message
  ) {
    diagnostics.push(
      contributionContractDiagnostic(
        POINT,
        `${descriptor.unsupported.behavior} unsupported behavior requires a diagnostic message.`,
        '/unsupported/message'
      )
    );
  }
  return diagnostics;
};

export const validateCodegenPolicyContribution = (
  input: unknown,
  options: ValidateCodegenPolicyContributionOptions = {}
): ValidateCodegenPolicyContributionResult => {
  const result = validateContributionStructure(input, {
    point: POINT,
    label: 'Codegen Policy contribution',
    validate: validateStructure,
    json: options,
  });
  if (!result.ok) return result;
  const diagnostics = validateSemantics(result.descriptor);
  return diagnostics.length > 0 ? { ok: false, diagnostics } : result;
};

import {
  validateCodegenPolicyContribution,
  type CodegenPolicyContributionV1,
} from '@prodivix/plugin-contracts';
import {
  defineContributionContract,
  pluginHostSuccess,
  type RegisteredContributionContract,
} from '@prodivix/plugin-host';
import type {
  ResolvedCodegenPolicyContribution,
  WebContributionPointMap,
} from '@/plugins/platform/types';
import {
  cloneAndFreezeJson,
  toHostDescriptorValidationResult,
} from '@/plugins/platform/contributions/resolverUtils';

export const createCodegenPolicyContributionResolver =
  (): RegisteredContributionContract<WebContributionPointMap> =>
    defineContributionContract<
      WebContributionPointMap,
      'codegenPolicy',
      CodegenPolicyContributionV1
    >({
      point: 'codegenPolicy',
      contractVersion: '1.0',
      validateDescriptor: (input) =>
        toHostDescriptorValidationResult(
          validateCodegenPolicyContribution(input),
          'codegenPolicy'
        ),
      prepare: async ({ descriptor }) => {
        const frozenDescriptor = cloneAndFreezeJson(descriptor);
        return pluginHostSuccess({
          value: Object.freeze({
            descriptor: frozenDescriptor,
            libraryId: frozenDescriptor.libraryId,
          }) satisfies ResolvedCodegenPolicyContribution,
          lifetime: 'installation',
          dependsOnCapabilities: [],
        });
      },
    });

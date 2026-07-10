import {
  validateRenderPolicyContribution,
  type RenderPolicyContributionV1,
  type RenderPolicyRuleDescriptor,
} from '@prodivix/plugin-contracts';
import {
  defineContributionContract,
  pluginHostFailure,
  pluginHostSuccess,
  type RegisteredContributionContract,
} from '@prodivix/plugin-host';
import type {
  OfficialHostImplementationBinding,
  OfficialHostImplementationRegistry,
  OfficialRenderPolicyImplementation,
} from '@/plugins/platform/officialHostImplementations';
import type {
  ResolvedRenderPolicyContribution,
  WebContributionPointMap,
} from '@/plugins/platform/types';
import type {
  AdapterContext,
  AdapterResult,
  ComponentAdapter,
} from '@/pir/renderer/registry';
import {
  cloneAndFreezeJson,
  resolverFailure,
  toHostDescriptorValidationResult,
} from '@/plugins/platform/contributions/resolverUtils';

const applyProps = (
  rule: RenderPolicyRuleDescriptor,
  context: AdapterContext
): Record<string, unknown> => {
  const props: Record<string, unknown> = {
    ...(rule.props?.defaults ?? {}),
    ...context.resolvedProps,
  };
  rule.props?.rename?.forEach(({ from, to }) => {
    if (!Object.prototype.hasOwnProperty.call(props, from)) return;
    if (!Object.prototype.hasOwnProperty.call(props, to)) {
      props[to] = props[from];
    }
    delete props[from];
  });
  rule.props?.omit?.forEach((property) => delete props[property]);
  const canvasOpen = rule.portal.canvasOpen;
  if (canvasOpen && (canvasOpen.when === 'always' || context.isSelected)) {
    props[canvasOpen.prop] = canvasOpen.value;
  }
  return props;
};

const resolveChildren = (
  rule: RenderPolicyRuleDescriptor,
  context: AdapterContext,
  props: Record<string, unknown>
): AdapterResult => {
  if (rule.children.mode === 'text-prop') {
    if (!Object.prototype.hasOwnProperty.call(props, rule.children.prop)) {
      props[rule.children.prop] = context.resolvedText;
    }
    return {
      props,
      supportsChildren: false,
      renderNodeChildren: false,
    };
  }
  if (rule.children.mode === 'text-only') {
    return {
      props,
      children: context.resolvedText,
      supportsChildren: true,
      renderNodeChildren: false,
    };
  }
  if (rule.children.mode === 'children-only') {
    return { props, supportsChildren: true, renderNodeChildren: true };
  }
  if (rule.children.mode === 'none') {
    return {
      props,
      supportsChildren: false,
      renderNodeChildren: false,
    };
  }
  return {
    props,
    children: context.resolvedText,
    supportsChildren: true,
    renderNodeChildren: true,
  };
};

const createAdapter = (
  rule: RenderPolicyRuleDescriptor,
  implementation: OfficialRenderPolicyImplementation | undefined
): ComponentAdapter =>
  Object.freeze({
    kind: 'custom',
    supportsChildren: rule.children.mode !== 'none',
    mapProps: (context) => {
      const props = applyProps(rule, context);
      const declarative = resolveChildren(rule, context, props);
      if (!implementation?.mapProps) return declarative;
      let custom: AdapterResult;
      try {
        custom = implementation.mapProps({
          ...context,
          resolvedProps: declarative.props ?? props,
        });
      } catch {
        return declarative;
      }
      return {
        ...declarative,
        ...custom,
        props: custom.props ?? declarative.props,
        children: custom.children ?? declarative.children,
        supportsChildren:
          custom.supportsChildren ?? declarative.supportsChildren,
        renderNodeChildren:
          custom.renderNodeChildren ?? declarative.renderNodeChildren,
      };
    },
    applySelection: (props, selectionData) => ({
      ...props,
      ...selectionData,
    }),
  });

export const createRenderPolicyContributionResolver = (
  implementations: OfficialHostImplementationRegistry
): RegisteredContributionContract<WebContributionPointMap> =>
  defineContributionContract<
    WebContributionPointMap,
    'renderPolicy',
    RenderPolicyContributionV1
  >({
    point: 'renderPolicy',
    contractVersion: '1.0',
    validateDescriptor: (input) =>
      toHostDescriptorValidationResult(
        validateRenderPolicyContribution(input),
        'renderPolicy'
      ),
    prepare: async ({ owner, attestation, descriptor, signal }) => {
      const bindings = new Map<
        string,
        OfficialHostImplementationBinding<'render-policy'>
      >();
      for (const rule of descriptor.rules) {
        const implementationId = rule.hostImplementationId;
        if (!implementationId || bindings.has(implementationId)) continue;
        const binding = await implementations.bind({
          owner,
          attestation,
          implementationId,
          expectedKind: 'render-policy',
          signal,
        });
        if (binding.ok === false) {
          [...bindings.values()].reverse().forEach((item) => item.dispose());
          return pluginHostFailure(binding.diagnostics);
        }
        bindings.set(implementationId, binding.value);
      }

      for (const rule of descriptor.rules) {
        if (rule.portal.mode !== 'host-overlay') continue;
        const implementation = rule.hostImplementationId
          ? bindings.get(rule.hostImplementationId)?.value
          : undefined;
        if (implementation?.wrapComponent) continue;
        [...bindings.values()].reverse().forEach((item) => item.dispose());
        return resolverFailure(
          'renderPolicy',
          `Host-overlay render rule ${JSON.stringify(rule.id)} requires a build-attested component wrapper.`,
          {
            pluginId: owner.pluginId,
            runtimeType: rule.runtimeType,
            implementationId: rule.hostImplementationId,
          }
        );
      }

      const frozenDescriptor = cloneAndFreezeJson(descriptor);
      const rules = frozenDescriptor.rules.map((rule) => {
        const implementation = rule.hostImplementationId
          ? bindings.get(rule.hostImplementationId)?.value
          : undefined;
        return Object.freeze({
          id: rule.id,
          runtimeType: rule.runtimeType,
          componentExport: rule.componentExport,
          portalMode: rule.portal.mode,
          adapter: createAdapter(rule, implementation),
          ...(implementation?.wrapComponent
            ? { wrapComponent: implementation.wrapComponent }
            : {}),
          fallback: Object.freeze({ ...rule.fallback }),
        });
      });
      let disposed = false;
      return pluginHostSuccess({
        value: Object.freeze({
          descriptor: frozenDescriptor,
          libraryId: frozenDescriptor.libraryId,
          rules: Object.freeze(rules),
        }) satisfies ResolvedRenderPolicyContribution,
        lifetime: 'installation',
        dependsOnCapabilities: [],
        dispose: () => {
          if (disposed) return;
          disposed = true;
          [...bindings.values()].reverse().forEach((item) => item.dispose());
        },
      });
    },
  });

import type { PluginDiagnostic } from '@prodivix/plugin-contracts';

export type NonEmptyPluginDiagnostics = readonly [
  PluginDiagnostic,
  ...PluginDiagnostic[],
];

export type PluginHostResult<T> =
  | {
      readonly ok: true;
      readonly value: T;
      readonly diagnostics: readonly PluginDiagnostic[];
    }
  | {
      readonly ok: false;
      readonly diagnostics: NonEmptyPluginDiagnostics;
    };

export const pluginHostSuccess = <T>(
  value: T,
  diagnostics: readonly PluginDiagnostic[] = []
): PluginHostResult<T> => ({
  ok: true,
  value,
  diagnostics: Object.freeze([...diagnostics]),
});

export const pluginHostFailure = <T = never>(
  diagnostics: NonEmptyPluginDiagnostics
): PluginHostResult<T> => ({
  ok: false,
  diagnostics: Object.freeze([...diagnostics]) as NonEmptyPluginDiagnostics,
});

export const asNonEmptyDiagnostics = (
  diagnostics: readonly PluginDiagnostic[]
): NonEmptyPluginDiagnostics | undefined => {
  const [first, ...rest] = diagnostics;
  return first === undefined
    ? undefined
    : (Object.freeze([first, ...rest]) as NonEmptyPluginDiagnostics);
};

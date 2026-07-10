import type { PluginDiagnostic } from '@prodivix/plugin-contracts';

export type ProtocolSuccess<T> = Readonly<{
  ok: true;
  value: T;
  diagnostics: readonly PluginDiagnostic[];
}>;

export type ProtocolFailure = Readonly<{
  ok: false;
  diagnostics: readonly [PluginDiagnostic, ...PluginDiagnostic[]];
}>;

export type ProtocolResult<T> = ProtocolSuccess<T> | ProtocolFailure;

export const protocolSuccess = <T>(
  value: T,
  diagnostics: readonly PluginDiagnostic[] = []
): ProtocolSuccess<T> => Object.freeze({ ok: true, value, diagnostics });

export const protocolFailure = (
  diagnostics: readonly [PluginDiagnostic, ...PluginDiagnostic[]]
): ProtocolFailure => Object.freeze({ ok: false, diagnostics });

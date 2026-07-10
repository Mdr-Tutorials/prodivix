import type { CanonicalNode } from './canonicalIR';
import type { CompileDiagnostic } from '#src/core/diagnostics';

export type AdapterImportKind = 'default' | 'named' | 'namespace';

export interface AdapterImportSpec {
  source: string;
  kind: AdapterImportKind;
  imported: string;
  local?: string;
}

export interface AdapterResolution {
  element: string;
  imports?: AdapterImportSpec[];
  diagnostics?: CompileDiagnostic[];
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  textMode?: 'preserve' | 'omit';
  childrenMode?: 'preserve' | 'omit';
}

export interface TargetAdapter {
  id: string;
  resolveNode: (node: CanonicalNode) => AdapterResolution;
}

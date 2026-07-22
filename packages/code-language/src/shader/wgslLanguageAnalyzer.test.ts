import { describe, expect, it } from 'vitest';
import { analyzeWgslSource } from './wgslLanguageAnalyzer';

describe('WGSL variable declarations', () => {
  it('skips the address-space template before reading a var name', () => {
    const analysis = analyzeWgslSource(
      [
        'struct Params { scale: f32, }',
        '@group(0) @binding(0) var<uniform> params: Params;',
        'fn read_scale() -> f32 { return params.scale; }',
      ].join('\n')
    );

    const params = analysis.symbols.find((symbol) => symbol.name === 'params');
    expect(params).toMatchObject({ category: 'resource', moduleLevel: true });
    expect(params?.occurrences).toHaveLength(2);
    expect(analysis.symbols.some((symbol) => symbol.name === 'uniform')).toBe(
      false
    );
  });
});

import * as PdxUi from '../index';
import { describe, expect, it } from 'vitest';
import { PDX_COMPONENT_MANIFEST } from './componentManifest';

describe('PDX_COMPONENT_MANIFEST', () => {
  it('contains unique runtime component types that are publicly exported', () => {
    const runtimeTypes = PDX_COMPONENT_MANIFEST.map(
      (component) => component.runtimeType
    );

    expect(new Set(runtimeTypes).size).toBe(runtimeTypes.length);
    runtimeTypes.forEach((runtimeType) => {
      expect(PdxUi).toHaveProperty(runtimeType);
    });
  });

  it('keeps enum defaults within their declared options', () => {
    PDX_COMPONENT_MANIFEST.forEach((component) => {
      Object.entries(component.props).forEach(([name, prop]) => {
        if (prop.kind !== 'enum' || prop.defaultValue === undefined) return;
        expect(
          prop.options,
          `${component.runtimeType}.${name} must include its default value`
        ).toContain(String(prop.defaultValue));
      });
    });
  });
});

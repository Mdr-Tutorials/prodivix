import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { renderUnknownCellValue } from './renderUnknownCellValue';

describe('renderUnknownCellValue', () => {
  it('keeps renderable primitives and elements', () => {
    const element = createElement('span', null, 'value');
    expect(renderUnknownCellValue('text')).toBe('text');
    expect(renderUnknownCellValue(42)).toBe(42);
    expect(renderUnknownCellValue(element)).toBe(element);
    expect(renderUnknownCellValue(null)).toBeNull();
  });

  it('converts objects instead of passing invalid React children through', () => {
    expect(renderUnknownCellValue({ id: 'row-1' })).toBe('[object Object]');
    expect(
      renderUnknownCellValue({
        toString() {
          throw new Error('cannot stringify');
        },
      })
    ).toBe('[unrenderable value]');
  });
});

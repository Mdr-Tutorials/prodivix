import { describe, expect, it } from 'vitest';
import {
  parseBoxSpacing,
  readLineHeightValue,
  toBoxSpacingShorthand,
  toLineHeightCssValue,
} from './layoutPanelHelpers';

describe('line-height inspector values', () => {
  it('preserves px semantics when UnitInput emits a number', () => {
    expect(toLineHeightCssValue(20, '24px')).toBe('20px');
    expect(toLineHeightCssValue(2, '1.5')).toBe('2');
    expect(toLineHeightCssValue(2, undefined)).toBe('2');
    expect(readLineHeightValue(1.5)).toBe('1.5');
  });
});

describe('box spacing shorthand', () => {
  it('keeps side positions when one expanded value is cleared', () => {
    const shorthand = toBoxSpacingShorthand({
      top: '1px',
      right: '',
      bottom: '3px',
      left: '4px',
    });

    expect(shorthand).toBe('1px 0 3px 4px');
    expect(parseBoxSpacing(shorthand)).toEqual({
      top: '1px',
      right: '0',
      bottom: '3px',
      left: '4px',
    });
  });
});

import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { projectAnimationFrameToBrowserPreview } from './index';
import type { AnimationFrame } from '@prodivix/animation';

describe('browser animation projection properties', () => {
  it('projects evaluated node styles without owning timeline semantics', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (opacity) => {
        const frame: AnimationFrame = {
          stylesByNodeId: new Map([['node', { opacity }]]),
          svgFilters: [],
        };
        const snapshot = projectAnimationFrameToBrowserPreview(
          frame,
          'page-home'
        );

        expect(snapshot.cssText).toContain(
          'data-pir-document-id="page-home"][data-pir-node-id="node"'
        );
        expect(snapshot.cssText).toContain(`opacity:${opacity};`);
      })
    );
  });

  it('clones SVG filter projection without mutating the evaluated frame', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (stdDeviation) => {
        const svgFilters = [
          {
            id: 'filter',
            primitives: [
              {
                id: 'primitive',
                type: 'feGaussianBlur' as const,
                attrs: { stdDeviation },
              },
            ],
          },
        ];
        const frame: AnimationFrame = {
          stylesByNodeId: new Map(),
          svgFilters,
        };
        const snapshot = projectAnimationFrameToBrowserPreview(
          frame,
          'page-home'
        );

        expect(snapshot.svgFilters).not.toBe(svgFilters);
        expect(snapshot.svgFilters[0].primitives).not.toBe(
          svgFilters[0].primitives
        );
        expect(snapshot.svgFilters[0].primitives[0].attrs?.stdDeviation).toBe(
          stdDeviation
        );
        expect(svgFilters[0].primitives[0].attrs.stdDeviation).toBe(
          stdDeviation
        );
      })
    );
  });
});

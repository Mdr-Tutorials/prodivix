import { describe, expect, it } from 'vitest';
import type { AnimationRuntimeFrame } from '@prodivix/animation';
import { createBrowserAnimationEffectStore } from './index';

const createRuntimeFrame = (
  sequence: number,
  opacity: number
): AnimationRuntimeFrame =>
  Object.freeze({
    sequence,
    elapsedMs: sequence * 10,
    cursorMs: sequence * 10,
    animationDocumentId: 'animation-document',
    timelineId: 'timeline',
    targetDocumentId: 'page',
    frame: {
      stylesByNodeId: new Map([['node', { opacity }]]),
      svgFilters: [],
    },
    contributors: [
      {
        animationDocumentId: 'animation-document',
        timelineId: 'timeline',
        bindingId: 'binding',
        trackId: 'track',
        targetDocumentId: 'page',
        targetNodeId: 'node',
      },
    ],
  });

const acquire = (
  effects: ReturnType<
    ReturnType<typeof createBrowserAnimationEffectStore>['createRuntimePort']
  >['effects'],
  playbackId: string
) =>
  effects.acquire({
    playbackId,
    animationDocumentId: 'animation-document',
    timelineId: 'timeline',
    targetDocumentId: 'page',
    signal: { aborted: false },
  });

describe('browser animation effect store conformance', () => {
  it('generation-fences superseded and reset leases', async () => {
    const store = createBrowserAnimationEffectStore({
      targetDocumentId: 'page',
      targetNodeIds: ['node'],
    });
    const effects = store.createRuntimePort().effects;
    expect(
      effects.supportsTarget({
        targetDocumentId: 'page',
        targetNodeId: 'node',
        capability: 'style',
      })
    ).toBe(true);

    const first = await acquire(effects, 'first');
    await first.applyFrame(createRuntimeFrame(1, 0.1));
    expect(store.getSnapshot().preview.cssText).toContain('opacity:0.1;');

    const second = await acquire(effects, 'second');
    const secondRevision = store.getSnapshot().revision;
    await first.applyFrame(createRuntimeFrame(2, 0.2));
    await first.release({ outcome: 'cancelled', finalFramePolicy: 'clear' });
    expect(store.getSnapshot().revision).toBe(secondRevision);
    expect(store.getSnapshot().status).toBe('running');
    expect(store.getSnapshot().preview.cssText).toBe('');

    await second.applyFrame(createRuntimeFrame(1, 0.8));
    await second.release({
      outcome: 'completed',
      finalFramePolicy: 'retain',
    });
    expect(store.getSnapshot().status).toBe('completed');
    expect(store.getSnapshot().preview.cssText).toContain('opacity:0.8;');

    const third = await acquire(effects, 'third');
    await third.applyFrame(createRuntimeFrame(1, 0.3));
    store.reset();
    const resetRevision = store.getSnapshot().revision;
    await third.applyFrame(createRuntimeFrame(2, 0.9));
    await third.release({ outcome: 'completed', finalFramePolicy: 'retain' });
    expect(store.getSnapshot()).toMatchObject({
      revision: resetRevision,
      status: 'idle',
      cursorMs: null,
      elapsedMs: 0,
    });
    expect(store.getSnapshot().preview.cssText).toBe('');

    const fourth = await acquire(effects, 'fourth');
    await fourth.applyFrame(createRuntimeFrame(1, 0.4));
    store.dispose();
    const disposedRevision = store.getSnapshot().revision;
    await fourth.applyFrame(createRuntimeFrame(2, 1));
    await fourth.release({ outcome: 'completed', finalFramePolicy: 'retain' });
    expect(store.getSnapshot()).toMatchObject({
      revision: disposedRevision,
      status: 'disposed',
      cursorMs: null,
      elapsedMs: 0,
    });
    expect(store.getSnapshot().preview.cssText).toBe('');
    expect(() => store.createRuntimePort()).toThrow(/disposed/i);
  });
});

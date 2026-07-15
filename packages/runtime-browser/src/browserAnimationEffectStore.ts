import {
  ANIMATION_EFFECT_CAPABILITIES,
  type AnimationEffectHost,
  type AnimationEffectLeaseOutcome,
  type AnimationFrameScheduler,
  type AnimationRuntimeFrame,
  type AnimationRuntimePort,
} from '@prodivix/animation';
import {
  EMPTY_ANIMATION_PREVIEW_SNAPSHOT,
  projectAnimationFrameToBrowserPreview,
  type AnimationPreviewSnapshot,
} from './animationPreview';

export const BROWSER_ANIMATION_EFFECT_HOST_ID =
  'prodivix.browser.animation-preview';

export type BrowserAnimationEffectStoreStatus =
  'idle' | 'running' | AnimationEffectLeaseOutcome | 'disposed';

export type BrowserAnimationEffectSnapshot = Readonly<{
  revision: number;
  status: BrowserAnimationEffectStoreStatus;
  preview: AnimationPreviewSnapshot;
  cursorMs: number | null;
  elapsedMs: number;
  timelineId?: string;
}>;

export type BrowserAnimationEffectStore = Readonly<{
  getSnapshot(): BrowserAnimationEffectSnapshot;
  subscribe(listener: () => void): () => void;
  reset(): void;
  createRuntimePort(): AnimationRuntimePort;
  dispose(): void;
}>;

export type CreateBrowserAnimationEffectStoreInput = Readonly<{
  targetDocumentId: string;
  targetNodeIds: readonly string[];
}>;

const createInitialSnapshot = (
  revision: number,
  status: 'idle' | 'disposed'
): BrowserAnimationEffectSnapshot =>
  Object.freeze({
    revision,
    status,
    preview: EMPTY_ANIMATION_PREVIEW_SNAPSHOT,
    cursorMs: null,
    elapsedMs: 0,
  });

const createBrowserAnimationFrameScheduler = (): AnimationFrameScheduler =>
  Object.freeze({
    now: () => {
      if (typeof performance === 'undefined') {
        throw new Error(
          'The browser animation scheduler requires Performance.'
        );
      }
      return performance.now();
    },
    scheduleFrame: (callback) => {
      if (
        typeof requestAnimationFrame !== 'function' ||
        typeof cancelAnimationFrame !== 'function'
      ) {
        throw new Error(
          'The browser animation scheduler requires requestAnimationFrame.'
        );
      }
      let active = true;
      const frameId = requestAnimationFrame((timestampMs) => {
        if (!active) return;
        active = false;
        callback(timestampMs);
      });
      return () => {
        if (!active) return;
        active = false;
        cancelAnimationFrame(frameId);
      };
    },
  });

const normalizeRequiredId = (value: string, label: string): string => {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`${label} must be a non-empty string.`);
  return normalized;
};

/**
 * Creates the browser-owned effect surface used by Animation playback. The
 * store is React-neutral; UI surfaces consume it through getSnapshot/subscribe.
 */
export const createBrowserAnimationEffectStore = (
  input: CreateBrowserAnimationEffectStoreInput
): BrowserAnimationEffectStore => {
  const targetDocumentId = normalizeRequiredId(
    input.targetDocumentId,
    'targetDocumentId'
  );
  const targetNodeIds = new Set(
    input.targetNodeIds.map((nodeId) =>
      normalizeRequiredId(nodeId, 'targetNodeId')
    )
  );
  const capabilities = new Set(ANIMATION_EFFECT_CAPABILITIES);
  const listeners = new Set<() => void>();
  const scheduler = createBrowserAnimationFrameScheduler();
  let generation = 0;
  let disposed = false;
  let snapshot = createInitialSnapshot(0, 'idle');

  const publish = (
    next: Omit<BrowserAnimationEffectSnapshot, 'revision'>
  ): void => {
    snapshot = Object.freeze({ ...next, revision: snapshot.revision + 1 });
    [...listeners].forEach((listener) => {
      try {
        listener();
      } catch {
        // A broken observer must not corrupt playback or other observers.
      }
    });
  };

  const assertUsable = () => {
    if (disposed) {
      throw new Error('The browser animation effect store is disposed.');
    }
  };

  const effects: AnimationEffectHost = Object.freeze({
    descriptor: Object.freeze({
      id: BROWSER_ANIMATION_EFFECT_HOST_ID,
      version: '1',
      displayName: 'Browser Animation Preview',
      capabilities: ANIMATION_EFFECT_CAPABILITIES,
    }),
    supportsTarget: (target) =>
      !disposed &&
      target.targetDocumentId === targetDocumentId &&
      targetNodeIds.has(target.targetNodeId) &&
      capabilities.has(target.capability),
    acquire: (leaseInput) => {
      assertUsable();
      if (leaseInput.signal.aborted) {
        throw new Error(
          String(
            leaseInput.signal.reason ??
              'Animation playback was cancelled before acquiring effects.'
          )
        );
      }
      if (leaseInput.targetDocumentId !== targetDocumentId) {
        throw new Error(
          `Animation target document ${leaseInput.targetDocumentId} is not mounted by this effect store.`
        );
      }

      generation += 1;
      const leaseGeneration = generation;
      let released = false;
      let lastSequence = 0;
      publish({
        status: 'running',
        preview: EMPTY_ANIMATION_PREVIEW_SNAPSHOT,
        cursorMs: null,
        elapsedMs: 0,
        timelineId: leaseInput.timelineId,
      });

      const isCurrent = () =>
        !disposed && !released && generation === leaseGeneration;

      return Object.freeze({
        applyFrame: (runtimeFrame: AnimationRuntimeFrame) => {
          if (!isCurrent()) return;
          if (
            runtimeFrame.animationDocumentId !==
              leaseInput.animationDocumentId ||
            runtimeFrame.timelineId !== leaseInput.timelineId ||
            runtimeFrame.targetDocumentId !== targetDocumentId
          ) {
            throw new Error(
              'Animation runtime frame does not match its acquired effect lease.'
            );
          }
          if (runtimeFrame.sequence <= lastSequence) {
            throw new Error(
              'Animation runtime frame sequence must increase monotonically.'
            );
          }
          const unsupportedNodeId = [
            ...runtimeFrame.frame.stylesByNodeId.keys(),
            ...runtimeFrame.contributors.map(
              (contributor) => contributor.targetNodeId
            ),
          ].find((nodeId) => !targetNodeIds.has(nodeId));
          if (unsupportedNodeId) {
            throw new Error(
              `Animation target node ${unsupportedNodeId} is not mounted by this effect store.`
            );
          }

          lastSequence = runtimeFrame.sequence;
          publish({
            status: 'running',
            preview: projectAnimationFrameToBrowserPreview(
              runtimeFrame.frame,
              targetDocumentId
            ),
            cursorMs: runtimeFrame.cursorMs,
            elapsedMs: runtimeFrame.elapsedMs,
            timelineId: runtimeFrame.timelineId,
          });
        },
        release: ({ outcome, finalFramePolicy }) => {
          if (!isCurrent()) return;
          released = true;
          generation += 1;
          publish({
            status: outcome,
            preview:
              finalFramePolicy === 'retain'
                ? snapshot.preview
                : EMPTY_ANIMATION_PREVIEW_SNAPSHOT,
            cursorMs: finalFramePolicy === 'retain' ? snapshot.cursorMs : null,
            elapsedMs: snapshot.elapsedMs,
            timelineId: leaseInput.timelineId,
          });
        },
      });
    },
  });
  const runtimePort: AnimationRuntimePort = Object.freeze({
    scheduler,
    effects,
  });

  return Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      if (disposed) return () => undefined;
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      if (disposed) return;
      generation += 1;
      publish({
        status: 'idle',
        preview: EMPTY_ANIMATION_PREVIEW_SNAPSHOT,
        cursorMs: null,
        elapsedMs: 0,
      });
    },
    createRuntimePort: () => {
      assertUsable();
      return runtimePort;
    },
    dispose: () => {
      if (disposed) return;
      generation += 1;
      disposed = true;
      publish({
        status: 'disposed',
        preview: EMPTY_ANIMATION_PREVIEW_SNAPSHOT,
        cursorMs: null,
        elapsedMs: 0,
      });
      listeners.clear();
    },
  });
};

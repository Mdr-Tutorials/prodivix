import {
  evaluateAnimationFrame,
  resolveTimelineCursorMs,
} from './animationEvaluation';
import type { AnimationDefinition, AnimationTimeline } from './animation.types';
import type {
  AnimationEffectLease,
  AnimationPlayback,
  AnimationPlaybackResult,
  AnimationRuntimeContributor,
  AnimationRuntimeFrame,
  AnimationRuntimePort,
} from './animationRuntime';
import { getAnimationTimelineTotalDurationMs } from './animationRuntime';

export type StartAnimationPlaybackInput = Readonly<{
  playbackId: string;
  animationDocumentId: string;
  definition: AnimationDefinition;
  timeline: AnimationTimeline;
  runtime: AnimationRuntimePort;
  lease: AnimationEffectLease;
  signal: Readonly<{ readonly aborted: boolean; readonly reason?: unknown }>;
}>;

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const collectContributors = (
  animationDocumentId: string,
  definition: AnimationDefinition,
  timeline: AnimationTimeline
): readonly AnimationRuntimeContributor[] =>
  Object.freeze(
    timeline.bindings.flatMap((binding) =>
      binding.tracks.map((track) =>
        Object.freeze({
          animationDocumentId,
          timelineId: timeline.id,
          bindingId: binding.id,
          trackId: track.id,
          targetDocumentId: definition.target.documentId,
          targetNodeId: binding.targetNodeId,
        })
      )
    )
  );

/** Drives one timeline with serialized effect writes and a one-shot scheduler. */
export const startAnimationPlayback = (
  input: StartAnimationPlaybackInput
): AnimationPlayback => {
  const startedAt = input.runtime.scheduler.now();
  if (!Number.isFinite(startedAt)) {
    throw new TypeError('Animation scheduler must return a finite timestamp.');
  }

  const totalDurationMs = getAnimationTimelineTotalDurationMs(input.timeline);
  const contributors = collectContributors(
    input.animationDocumentId,
    input.definition,
    input.timeline
  );
  let lastElapsedMs = 0;
  let framesApplied = 0;
  let sequence = 0;
  let cancellationReason: string | undefined;
  let cancellationOutcome: 'cancelled' | 'timed-out' = 'cancelled';
  let cancelScheduledFrame: (() => void) | undefined;
  let finalization: Promise<AnimationPlaybackResult> | undefined;
  let work = Promise.resolve();
  let resolveCompletion: (result: AnimationPlaybackResult) => void = () =>
    undefined;
  const completion = new Promise<AnimationPlaybackResult>((resolve) => {
    resolveCompletion = resolve;
  });

  const releasePolicy = (
    outcome: AnimationPlaybackResult['status']
  ): 'retain' | 'clear' =>
    outcome === 'completed' &&
    (input.timeline.fillMode === 'forwards' ||
      input.timeline.fillMode === 'both')
      ? 'retain'
      : 'clear';

  const finalize = (
    status: AnimationPlaybackResult['status'],
    reason?: string
  ): Promise<AnimationPlaybackResult> => {
    if (finalization) return finalization;
    cancelScheduledFrame?.();
    cancelScheduledFrame = undefined;
    finalization = (async () => {
      let finalStatus = status;
      let finalReason = reason;
      try {
        await input.lease.release({
          outcome: status,
          finalFramePolicy: releasePolicy(status),
        });
      } catch (error) {
        finalStatus = 'failed';
        finalReason = errorMessage(error);
      }
      const result = Object.freeze({
        status: finalStatus,
        elapsedMs: lastElapsedMs,
        framesApplied,
        ...(finalReason ? { reason: finalReason } : {}),
      });
      resolveCompletion(result);
      return result;
    })();
    return finalization;
  };

  const isCancelled = () => input.signal.aborted || Boolean(cancellationReason);

  const applyAt = async (timestampMs: number): Promise<void> => {
    if (isCancelled()) {
      await finalize(
        cancellationOutcome,
        cancellationReason ?? String(input.signal.reason ?? 'Cancelled')
      );
      return;
    }
    if (!Number.isFinite(timestampMs)) {
      await finalize(
        'failed',
        'Animation scheduler emitted a non-finite timestamp.'
      );
      return;
    }

    const elapsedMs = Math.max(lastElapsedMs, timestampMs - startedAt, 0);
    lastElapsedMs = Number.isFinite(totalDurationMs)
      ? Math.min(elapsedMs, totalDurationMs)
      : elapsedMs;
    sequence += 1;
    const cursorMs = resolveTimelineCursorMs(input.timeline, lastElapsedMs);
    const runtimeFrame: AnimationRuntimeFrame = Object.freeze({
      sequence,
      elapsedMs: lastElapsedMs,
      cursorMs,
      animationDocumentId: input.animationDocumentId,
      timelineId: input.timeline.id,
      targetDocumentId: input.definition.target.documentId,
      frame: evaluateAnimationFrame({
        timelines: [input.timeline],
        globalMs: lastElapsedMs,
        svgFilters: input.definition.svgFilters ?? [],
      }),
      contributors,
    });
    try {
      await input.lease.applyFrame(runtimeFrame);
      framesApplied += 1;
    } catch (error) {
      await finalize('failed', errorMessage(error));
      return;
    }

    if (isCancelled()) {
      await finalize(
        cancellationOutcome,
        cancellationReason ?? String(input.signal.reason ?? 'Cancelled')
      );
      return;
    }
    if (lastElapsedMs >= totalDurationMs) {
      await finalize('completed');
      return;
    }
    cancelScheduledFrame = input.runtime.scheduler.scheduleFrame(
      (nextTimestampMs) => {
        cancelScheduledFrame = undefined;
        work = work
          .then(() => applyAt(nextTimestampMs))
          .catch(async (error: unknown) => {
            await finalize('failed', errorMessage(error));
          });
      }
    );
  };

  work = work
    .then(() => applyAt(startedAt))
    .catch(async (error: unknown) => {
      await finalize('failed', errorMessage(error));
    });

  return Object.freeze({
    completion,
    cancel: async (
      reason = 'Animation playback was cancelled.',
      outcome: 'cancelled' | 'timed-out' = 'cancelled'
    ) => {
      if (finalization) return finalization;
      cancellationReason = reason;
      cancellationOutcome = outcome;
      cancelScheduledFrame?.();
      cancelScheduledFrame = undefined;
      await work;
      return finalize(outcome, reason);
    },
  });
};

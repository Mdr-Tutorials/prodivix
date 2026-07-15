import type { RuntimeCancellationSignal } from '@prodivix/runtime-core';
import type {
  AnimationFrame,
  AnimationTimeline,
  AnimationTrack,
} from './animation.types';

export const ANIMATION_EFFECT_CAPABILITIES = Object.freeze([
  'style',
  'css-filter',
  'svg-filter',
] as const);

export type AnimationEffectCapability =
  (typeof ANIMATION_EFFECT_CAPABILITIES)[number];

export type AnimationFrameScheduler = Readonly<{
  now(): number;
  scheduleFrame(callback: (timestampMs: number) => void): () => void;
}>;

export type AnimationEffectHostDescriptor = Readonly<{
  id: string;
  version: string;
  displayName?: string;
  capabilities: readonly AnimationEffectCapability[];
}>;

export type AnimationEffectTarget = Readonly<{
  targetDocumentId: string;
  targetNodeId: string;
  capability: AnimationEffectCapability;
}>;

export type AnimationRuntimeContributor = Readonly<{
  animationDocumentId: string;
  timelineId: string;
  bindingId: string;
  trackId: string;
  targetDocumentId: string;
  targetNodeId: string;
}>;

export type AnimationRuntimeFrame = Readonly<{
  sequence: number;
  elapsedMs: number;
  cursorMs: number | null;
  animationDocumentId: string;
  timelineId: string;
  targetDocumentId: string;
  frame: AnimationFrame;
  contributors: readonly AnimationRuntimeContributor[];
}>;

export type AnimationEffectLeaseOutcome =
  'completed' | 'cancelled' | 'timed-out' | 'failed';

export type AnimationEffectLease = Readonly<{
  applyFrame(frame: AnimationRuntimeFrame): void | Promise<void>;
  release(
    input: Readonly<{
      outcome: AnimationEffectLeaseOutcome;
      finalFramePolicy: 'retain' | 'clear';
    }>
  ): void | Promise<void>;
}>;

export type AnimationEffectHost = Readonly<{
  descriptor: AnimationEffectHostDescriptor;
  supportsTarget(target: AnimationEffectTarget): boolean;
  acquire(
    input: Readonly<{
      playbackId: string;
      animationDocumentId: string;
      timelineId: string;
      targetDocumentId: string;
      signal: RuntimeCancellationSignal;
    }>
  ): AnimationEffectLease | Promise<AnimationEffectLease>;
}>;

export type AnimationRuntimePort = Readonly<{
  scheduler: AnimationFrameScheduler;
  effects: AnimationEffectHost;
}>;

export type AnimationPlaybackResult = Readonly<{
  status: 'completed' | 'cancelled' | 'timed-out' | 'failed';
  elapsedMs: number;
  framesApplied: number;
  reason?: string;
}>;

export type AnimationPlayback = Readonly<{
  completion: Promise<AnimationPlaybackResult>;
  cancel(
    reason?: string,
    outcome?: 'cancelled' | 'timed-out'
  ): Promise<AnimationPlaybackResult>;
}>;

export const getAnimationTrackEffectCapability = (
  track: AnimationTrack
): AnimationEffectCapability => {
  if (track.kind === 'style') return 'style';
  if (track.kind === 'css-filter') return 'css-filter';
  return 'svg-filter';
};

export const getAnimationTimelineTotalDurationMs = (
  timeline: AnimationTimeline
): number => {
  if (timeline.iterations === 'infinite') return Number.POSITIVE_INFINITY;
  const iterations =
    typeof timeline.iterations === 'number' && timeline.iterations > 0
      ? Math.floor(timeline.iterations)
      : 1;
  return Math.max(0, timeline.delayMs ?? 0) + timeline.durationMs * iterations;
};

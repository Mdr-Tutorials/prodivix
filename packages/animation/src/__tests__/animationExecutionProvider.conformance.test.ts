import { describe, expect, it } from 'vitest';
import {
  createExecutionRequest,
  type ExecutionJobEvent,
} from '@prodivix/runtime-core';
import {
  createAnimationExecutionInvocationInput,
  createAnimationExecutionProvider,
  readAnimationExecutionJobOutput,
  type AnimationDefinition,
  type AnimationEffectLeaseOutcome,
  type AnimationFrameScheduler,
  type AnimationRuntimeFrame,
  type AnimationRuntimePort,
} from '..';

const createDefinition = (
  overrides: Partial<AnimationDefinition['timelines'][number]> = {}
): AnimationDefinition => ({
  version: 1,
  target: { kind: 'pir-document', documentId: 'page-home' },
  timelines: [
    {
      id: 'intro',
      name: 'Intro',
      durationMs: 100,
      fillMode: 'forwards',
      bindings: [
        {
          id: 'hero-binding',
          targetNodeId: 'hero',
          tracks: [
            {
              id: 'opacity-track',
              kind: 'style',
              property: 'opacity',
              keyframes: [
                { atMs: 0, value: 0 },
                { atMs: 100, value: 1 },
              ],
            },
          ],
        },
      ],
      ...overrides,
    },
  ],
});

const createManualScheduler = () => {
  let now = 0;
  const callbacks = new Set<(timestampMs: number) => void>();
  const scheduler: AnimationFrameScheduler = {
    now: () => now,
    scheduleFrame: (callback) => {
      callbacks.add(callback);
      return () => callbacks.delete(callback);
    },
  };
  return {
    scheduler,
    advanceTo: async (timestampMs: number) => {
      for (let attempt = 0; attempt < 8 && !callbacks.size; attempt += 1) {
        await Promise.resolve();
      }
      now = timestampMs;
      const pending = [...callbacks];
      callbacks.clear();
      pending.forEach((callback) => callback(timestampMs));
      await Promise.resolve();
    },
  };
};

const createRuntime = () => {
  const manual = createManualScheduler();
  const frames: AnimationRuntimeFrame[] = [];
  const releases: AnimationEffectLeaseOutcome[] = [];
  const runtime: AnimationRuntimePort = {
    scheduler: manual.scheduler,
    effects: {
      descriptor: {
        id: 'test.animation-effects',
        version: '1',
        capabilities: ['style', 'css-filter', 'svg-filter'],
      },
      supportsTarget: ({ targetDocumentId, targetNodeId }) =>
        targetDocumentId === 'page-home' && targetNodeId === 'hero',
      acquire: () => ({
        applyFrame: (frame) => {
          frames.push(frame);
        },
        release: ({ outcome }) => {
          releases.push(outcome);
        },
      }),
    },
  };
  return { ...manual, frames, releases, runtime };
};

const createRequest = () =>
  createExecutionRequest({
    requestId: 'animation-request',
    profile: 'preview',
    runtimeZone: 'client',
    workspace: { workspaceId: 'workspace', snapshotId: 'snapshot' },
    invocation: {
      kind: 'animation',
      targetRef: {
        kind: 'animation-timeline',
        documentId: 'animation-document',
        timelineId: 'intro',
      },
      input: createAnimationExecutionInvocationInput('intro'),
    },
    requiredCapabilities: [
      'cancellation',
      'diagnostics',
      'source-trace',
      'streaming-logs',
    ],
  });

describe('Animation ExecutionProvider conformance', () => {
  it('serializes frames and maps one finite playback to a canonical job', async () => {
    const host = createRuntime();
    const provider = createAnimationExecutionProvider({
      resolveDocument: () => createDefinition(),
      resolveRuntime: () => host.runtime,
      createJobId: () => 'animation-job',
    });
    const job = await provider.start(createRequest());
    const events: ExecutionJobEvent[] = [];
    job.subscribe((event) => events.push(event));

    await host.advanceTo(100);
    const result = await job.completion;

    expect(result.status).toBe('succeeded');
    expect(readAnimationExecutionJobOutput(result)).toEqual({
      status: 'completed',
      timelineId: 'intro',
      elapsedMs: 100,
      framesApplied: 2,
    });
    expect(host.frames.map((frame) => frame.cursorMs)).toEqual([0, 100]);
    expect(host.releases).toEqual(['completed']);
    const traces = events.filter((event) => event.kind === 'trace');
    expect(traces).toHaveLength(2);
    expect(traces.map((event) => event.trace.phase)).toEqual(['start', 'end']);
    expect(traces[0]?.trace.spanId).toBe(traces[1]?.trace.spanId);
  });

  it('cancels an infinite playback and clears its effect lease', async () => {
    const host = createRuntime();
    const provider = createAnimationExecutionProvider({
      resolveDocument: () => createDefinition({ iterations: 'infinite' }),
      resolveRuntime: () => host.runtime,
    });
    const job = await provider.start(createRequest());
    await host.advanceTo(50);

    expect(await job.cancel({ reason: 'stop preview' })).toEqual({
      status: 'accepted',
    });
    await expect(job.completion).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'stop preview',
    });
    expect(host.releases).toEqual(['cancelled']);
  });

  it('fails closed when a timeline declares an unavailable CodeSlot', async () => {
    const host = createRuntime();
    const provider = createAnimationExecutionProvider({
      resolveDocument: () =>
        createDefinition({
          codeSlots: {
            script: {
              slotId: 'animation-code-slot:intro:script',
              reference: { artifactId: 'timeline-script' },
            },
          },
        }),
      resolveRuntime: () => host.runtime,
    });
    const job = await provider.start(createRequest());
    const result = await job.completion;

    expect(result.status).toBe('failed');
    expect(result.diagnostics).toMatchObject([
      {
        code: 'ANI-5101',
        targetRef: {
          kind: 'animation-timeline',
          documentId: 'animation-document',
          timelineId: 'intro',
        },
      },
    ]);
    expect(host.frames).toHaveLength(0);
  });
});

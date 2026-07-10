import { StrictMode, useEffect } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createWebPluginPlatform,
  useWebPluginRuntimeServices,
  WebPluginPlatformProvider,
  type WebPluginPlatform,
  type WebPluginPlatformFactory,
} from '@/plugins/platform';

const trackedPlatforms = new Set<WebPluginPlatform>();

const createDeferred = () => {
  let resolve!: (value: void | PromiseLike<void>) => void;
  const promise = new Promise<void>((currentResolve) => {
    resolve = currentResolve;
  });
  return Object.freeze({ promise, resolve });
};

const createTrackedFactory = (events: string[]) => {
  const factory: WebPluginPlatformFactory = ({ workspaceId }) => {
    events.push(`create:${workspaceId}`);
    let created: WebPluginPlatform | undefined;
    const result = createWebPluginPlatform({
      workspaceId,
      integrityService: {
        digestSha256: async () =>
          'sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      },
      onShutdown: () => {
        events.push(`closed:${workspaceId}`);
        if (created) trackedPlatforms.delete(created);
      },
    });
    if (result.ok) {
      created = result.value;
      trackedPlatforms.add(created);
    }
    return result;
  };
  return factory;
};

function WorkspaceProbe({
  events,
  blockedWorkspaceId,
  releaseCleanup,
}: Readonly<{
  events: string[];
  blockedWorkspaceId?: string;
  releaseCleanup?: Promise<void>;
}>) {
  const runtime = useWebPluginRuntimeServices();

  useEffect(() => {
    const cleanup = runtime.registerCleanup(async () => {
      events.push(`cleanup:start:${runtime.workspaceId}`);
      if (runtime.workspaceId === blockedWorkspaceId) {
        await releaseCleanup;
      }
      events.push(`cleanup:done:${runtime.workspaceId}`);
    });
    return () => {
      void cleanup.run().finally(() => cleanup.dispose());
    };
  }, [blockedWorkspaceId, events, releaseCleanup, runtime]);

  return <div>active:{runtime.workspaceId}</div>;
}

afterEach(async () => {
  await Promise.all(
    [...trackedPlatforms].map((platform) => platform.shutdown())
  );
  trackedPlatforms.clear();
});

describe('WebPluginPlatformProvider', () => {
  it('awaits workspace cleanup and shutdown before creating the next Host', async () => {
    const events: string[] = [];
    const cleanupGate = createDeferred();
    const factory = createTrackedFactory(events);
    const view = render(
      <WebPluginPlatformProvider
        workspaceId="workspace-a"
        sandboxUrl=""
        platformFactory={factory}
        fallback={<div>platform-loading</div>}
      >
        <WorkspaceProbe
          events={events}
          blockedWorkspaceId="workspace-a"
          releaseCleanup={cleanupGate.promise}
        />
      </WebPluginPlatformProvider>
    );
    await screen.findByText('active:workspace-a');

    view.rerender(
      <WebPluginPlatformProvider
        workspaceId="workspace-b"
        sandboxUrl=""
        platformFactory={factory}
        fallback={<div>platform-loading</div>}
      >
        <WorkspaceProbe events={events} />
      </WebPluginPlatformProvider>
    );

    await waitFor(() => {
      expect(events).toContain('cleanup:start:workspace-a');
    });
    expect(events).not.toContain('create:workspace-b');

    await act(async () => {
      cleanupGate.resolve(undefined);
      await cleanupGate.promise;
    });
    await screen.findByText('active:workspace-b');

    expect(events.indexOf('cleanup:done:workspace-a')).toBeLessThan(
      events.indexOf('closed:workspace-a')
    );
    expect(events.indexOf('closed:workspace-a')).toBeLessThan(
      events.indexOf('create:workspace-b')
    );

    view.unmount();
    await waitFor(() => expect(trackedPlatforms.size).toBe(0));
  });

  it('leaves no active Host after StrictMode teardown', async () => {
    const events: string[] = [];
    const factory = createTrackedFactory(events);
    const view = render(
      <StrictMode>
        <WebPluginPlatformProvider
          workspaceId="strict-workspace"
          sandboxUrl=""
          platformFactory={factory}
          fallback={<div>platform-loading</div>}
        >
          <WorkspaceProbe events={events} />
        </WebPluginPlatformProvider>
      </StrictMode>
    );
    await screen.findByText('active:strict-workspace');

    view.unmount();

    await waitFor(() => expect(trackedPlatforms.size).toBe(0));
    expect(events.filter((event) => event.startsWith('create:'))).toHaveLength(
      events.filter((event) => event.startsWith('closed:')).length
    );
  });
});

import { useCallback, useSyncExternalStore } from 'react';
import { executionSessionCoordinator } from './executionSessionEnvironment';

export const useExecutionSession = (sessionId: string) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      executionSessionCoordinator.subscribe((changedSessionId) => {
        if (changedSessionId === sessionId) onStoreChange();
      }),
    [sessionId]
  );
  const getSnapshot = useCallback(
    () => executionSessionCoordinator.getSnapshot(sessionId),
    [sessionId]
  );
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

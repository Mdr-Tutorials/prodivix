export type LatestResourceValuePersistenceController<T> = Readonly<{
  update(updater: (current: T) => T): void;
  syncExternal(value: T): void;
  waitForIdle(): Promise<void>;
  dispose(): void;
}>;

/** Keeps rapid local edits synchronous while coalescing full-document persistence. */
export const createLatestResourceValuePersistenceController = <T>(input: {
  initialValue: T;
  persist(value: T): Promise<void>;
  readExternal(): T;
  onValue(value: T): void;
  onError?(error: unknown): void;
}): LatestResourceValuePersistenceController<T> => {
  let current = input.initialValue;
  let pending: T | undefined;
  let drainPromise: Promise<void> | null = null;
  let disposed = false;

  const drain = (): Promise<void> => {
    if (drainPromise) return drainPromise;
    drainPromise = (async () => {
      try {
        while (!disposed && pending !== undefined) {
          const next = pending;
          pending = undefined;
          await input.persist(next);
        }
      } catch (error) {
        pending = undefined;
        if (!disposed) {
          current = input.readExternal();
          input.onValue(current);
          input.onError?.(error);
        }
      } finally {
        drainPromise = null;
        if (!disposed && pending !== undefined) void drain();
      }
    })();
    return drainPromise;
  };

  return {
    update(updater) {
      if (disposed) return;
      current = updater(current);
      pending = current;
      input.onValue(current);
      void drain();
    },
    syncExternal(value) {
      if (disposed || drainPromise || pending !== undefined) return;
      current = value;
      input.onValue(current);
    },
    async waitForIdle() {
      while (drainPromise) await drainPromise;
    },
    dispose() {
      disposed = true;
      pending = undefined;
    },
  };
};

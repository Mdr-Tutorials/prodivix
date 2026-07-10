export type PluginOperationCoordinator = Readonly<{
  run<T>(pluginId: string, operation: () => Promise<T>): Promise<T>;
}>;

export const createPluginOperationCoordinator =
  (): PluginOperationCoordinator => {
    const tails = new Map<string, Promise<void>>();
    return Object.freeze({
      run: <T>(pluginId: string, operation: () => Promise<T>): Promise<T> => {
        const previous = tails.get(pluginId) ?? Promise.resolve();
        const result = previous.catch(() => undefined).then(operation);
        const tail = result.then(
          () => undefined,
          () => undefined
        );
        tails.set(pluginId, tail);
        void tail.finally(() => {
          if (tails.get(pluginId) === tail) tails.delete(pluginId);
        });
        return result;
      },
    });
  };

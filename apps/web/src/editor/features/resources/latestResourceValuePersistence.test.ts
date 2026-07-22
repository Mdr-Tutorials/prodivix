import { describe, expect, it, vi } from 'vitest';
import { createLatestResourceValuePersistenceController } from './latestResourceValuePersistence';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
};

describe('latest resource value persistence', () => {
  it('composes rapid edits locally and persists the coalesced latest value', async () => {
    const firstWrite = deferred();
    const persisted: string[] = [];
    const onValue = vi.fn();
    const controller = createLatestResourceValuePersistenceController({
      initialValue: '',
      async persist(value) {
        persisted.push(value);
        if (persisted.length === 1) await firstWrite.promise;
      },
      readExternal: () => persisted.at(-1) ?? '',
      onValue,
    });

    controller.update((current) => `${current}你`);
    controller.update((current) => `${current}好`);

    expect(onValue).toHaveBeenLastCalledWith('你好');
    expect(persisted).toEqual(['你']);

    firstWrite.resolve();
    await controller.waitForIdle();
    expect(persisted).toEqual(['你', '你好']);
  });

  it('does not let an intermediate workspace echo replace a pending edit', async () => {
    const write = deferred();
    const onValue = vi.fn();
    const controller = createLatestResourceValuePersistenceController({
      initialValue: 'old',
      persist: async () => write.promise,
      readExternal: () => 'external',
      onValue,
    });

    controller.update(() => 'draft');
    controller.syncExternal('intermediate');
    expect(onValue).toHaveBeenLastCalledWith('draft');

    write.resolve();
    await controller.waitForIdle();
    controller.syncExternal('committed');
    expect(onValue).toHaveBeenLastCalledWith('committed');
  });
});

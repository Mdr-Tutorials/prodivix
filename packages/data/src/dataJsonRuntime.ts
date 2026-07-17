import type { DataJsonValue } from './data.types';

/** Clones untrusted runtime JSON into a deeply immutable value under explicit resource budgets. */
export const cloneDataJsonValue = (value: DataJsonValue): DataJsonValue => {
  const ancestors = new Set<object>();
  let nodes = 0;
  let textUnits = 0;
  const clone = (candidate: DataJsonValue, depth: number): DataJsonValue => {
    nodes += 1;
    if (nodes > 100_000 || depth > 128)
      throw new TypeError('Data JSON value exceeds the runtime budget.');
    if (candidate === null || typeof candidate === 'boolean') return candidate;
    if (typeof candidate === 'string') {
      textUnits += candidate.length;
      if (textUnits > 8 * 1_024 * 1_024)
        throw new TypeError('Data JSON value exceeds the runtime budget.');
      return candidate;
    }
    if (typeof candidate === 'number') {
      if (!Number.isFinite(candidate))
        throw new TypeError('Data JSON numbers must be finite.');
      return candidate;
    }
    if (typeof candidate !== 'object')
      throw new TypeError('Data operation payload must be JSON-compatible.');
    if (ancestors.has(candidate))
      throw new TypeError('Data operation payload must not contain cycles.');
    if (
      !Array.isArray(candidate) &&
      Object.getPrototypeOf(candidate) !== Object.prototype &&
      Object.getPrototypeOf(candidate) !== null
    )
      throw new TypeError('Data operation payload must use plain objects.');
    ancestors.add(candidate);
    const cloned = Array.isArray(candidate)
      ? Object.freeze(candidate.map((entry) => clone(entry, depth + 1)))
      : Object.freeze(
          Object.fromEntries(
            Object.entries(candidate)
              .sort(([left], [right]) => left.localeCompare(right))
              .map(([key, entry]) => {
                textUnits += key.length;
                if (textUnits > 8 * 1_024 * 1_024)
                  throw new TypeError(
                    'Data JSON value exceeds the runtime budget.'
                  );
                return [key, clone(entry, depth + 1)];
              })
          )
        );
    ancestors.delete(candidate);
    return cloned;
  };
  return clone(value, 0);
};

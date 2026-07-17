import type { DataOperationInputBinding } from '@prodivix/authoring';

const canonical = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value === value.trim() &&
  !value.includes('\0') &&
  value.length <= 4_096;

const validPointer = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.startsWith('/') &&
  !/~(?:[^01]|$)/u.test(value);

const validJson = (value: unknown, depth = 0): boolean => {
  if (depth > 32) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (Array.isArray(value))
    return value.every((item) => validJson(item, depth + 1));
  if (!value || typeof value !== 'object') return false;
  return Object.values(value).every((item) => validJson(item, depth + 1));
};

export type PIRDataInputFacts = Readonly<{
  runtimeValueIds: ReadonlySet<string>;
  usesTriggerPayload: boolean;
}>;

/** Validates PIR-local persistence constraints without depending on Data runtime. */
export const inspectPirDataOperationInput = (
  binding: DataOperationInputBinding
): PIRDataInputFacts | undefined => {
  const runtimeValueIds = new Set<string>();
  let usesTriggerPayload = false;
  let nodes = 0;
  const visit = (
    candidate: DataOperationInputBinding,
    depth: number
  ): boolean => {
    nodes += 1;
    if (
      nodes > 10_000 ||
      depth > 32 ||
      !candidate ||
      typeof candidate !== 'object'
    )
      return false;
    switch (candidate.kind) {
      case 'literal':
        return validJson(candidate.value);
      case 'trigger-payload':
        usesTriggerPayload = true;
        return candidate.path === undefined || validPointer(candidate.path);
      case 'runtime-value':
        if (!canonical(candidate.valueId)) return false;
        runtimeValueIds.add(candidate.valueId);
        return candidate.path === undefined || validPointer(candidate.path);
      case 'object':
        return (
          candidate.propertiesByKey !== null &&
          typeof candidate.propertiesByKey === 'object' &&
          !Array.isArray(candidate.propertiesByKey) &&
          Object.entries(candidate.propertiesByKey).every(
            ([key, child]) => canonical(key) && visit(child, depth + 1)
          )
        );
      case 'array':
        return (
          Array.isArray(candidate.items) &&
          candidate.items.every((child) => visit(child, depth + 1))
        );
      case 'code':
        return (
          canonical(candidate.slotId) &&
          canonical(candidate.reference?.artifactId) &&
          (candidate.reference.exportName === undefined ||
            canonical(candidate.reference.exportName)) &&
          (candidate.reference.symbolId === undefined ||
            canonical(candidate.reference.symbolId)) &&
          visit(candidate.input, depth + 1)
        );
    }
    return false;
  };
  return visit(binding, 0)
    ? Object.freeze({ runtimeValueIds, usesTriggerPayload })
    : undefined;
};

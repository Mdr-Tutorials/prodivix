import { useEffect, useState } from 'react';
import type {
  DataOperationInputBinding,
  DataOperationReference,
} from '@prodivix/data';
import { useInspectorContext } from '@/editor/features/blueprint/editor/inspector/InspectorContext';

type TriggerDataMutationFieldsProps = Readonly<{
  itemKey: string;
  operation?: DataOperationReference;
  input?: DataOperationInputBinding;
  disabled?: boolean;
}>;

const operationIdentity = (operation: DataOperationReference): string =>
  `${operation.documentId}\0${operation.operationId}`;

export function TriggerDataMutationFields({
  itemKey,
  operation,
  input,
  disabled = false,
}: TriggerDataMutationFieldsProps) {
  const { t, updateTrigger, dataMutationOptions } = useInspectorContext();
  const inputText = JSON.stringify(
    input ?? { kind: 'literal', value: null },
    null,
    2
  );
  const [draft, setDraft] = useState(inputText);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setDraft(inputText);
    setError(undefined);
  }, [inputText]);

  const selected = operation ? operationIdentity(operation) : '';
  const commitInput = (value: string) => {
    try {
      const parsed = JSON.parse(value) as DataOperationInputBinding;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new TypeError();
      setError(undefined);
      updateTrigger(itemKey, (current) => ({
        ...current,
        params: { ...current.params, input: parsed },
      }));
    } catch {
      setError('Enter a valid typed Data input binding.');
    }
  };

  return (
    <div className="grid gap-1.5 rounded-md border border-(--border-default) p-2">
      <select
        className="h-7 w-full rounded-md border border-(--border-default) bg-transparent px-2 text-xs text-(--text-primary) outline-none"
        value={selected}
        disabled={disabled || dataMutationOptions.length === 0}
        title={t('inspector.groups.triggers.dataMutation.operationHelp', {
          defaultValue: 'Select a mutation from the Workspace Semantic Index.',
        })}
        onChange={(event) => {
          const candidate = dataMutationOptions.find(
            (option) =>
              operationIdentity(option.reference) === event.target.value
          );
          if (!candidate) return;
          updateTrigger(itemKey, (current) => ({
            ...current,
            params: { ...current.params, operation: candidate.reference },
          }));
        }}
      >
        {dataMutationOptions.length === 0 ? (
          <option value="">No mutation available</option>
        ) : (
          dataMutationOptions.map((option) => (
            <option key={option.id} value={operationIdentity(option.reference)}>
              {option.label} · {option.detail}
            </option>
          ))
        )}
      </select>
      <textarea
        className="min-h-24 w-full resize-y rounded-md border border-(--border-default) bg-transparent p-2 font-mono text-[10px] text-(--text-primary) outline-none"
        value={draft}
        disabled={disabled}
        spellCheck={false}
        aria-label="Typed Data mutation input binding"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => commitInput(draft)}
      />
      <span className="text-[10px] text-(--text-muted)">
        {error ??
          'Literal, trigger-payload, runtime-value, object, array, and CodeSlot mappings are supported.'}
      </span>
    </div>
  );
}

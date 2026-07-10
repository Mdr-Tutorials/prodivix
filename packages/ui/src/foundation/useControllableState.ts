import { useCallback, useState } from 'react';

interface ControllableStateOptions<Value> {
  value?: Value;
  defaultValue: Value;
  onChange?: (value: Value) => void;
}

export function useControllableState<Value>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<Value>) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolledValue;

  const setValue = useCallback(
    (nextValue: Value) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }
      onChange?.(nextValue);
    },
    [isControlled, onChange]
  );

  return [currentValue, setValue] as const;
}

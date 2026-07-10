import './PdxCheckList.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxValidationState,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import { type PdxComponent } from '@prodivix/shared';
import { useId } from 'react';
import type React from 'react';

export interface PdxCheckListItem {
  label: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
}

interface PdxCheckListSpecificProps {
  items: PdxCheckListItem[];
  value?: string[];
  defaultValue?: string[];
  label?: React.ReactNode;
  description?: React.ReactNode;
  message?: React.ReactNode;
  orientation?: 'Vertical' | 'Horizontal';
  disabled?: boolean;
  required?: boolean;
  state?: PdxValidationState;
  onChange?: (values: string[]) => void;
}

export interface PdxCheckListProps
  extends PdxComponent, PdxCheckListSpecificProps {}

function PdxCheckList({
  items,
  value,
  defaultValue,
  label,
  description,
  message,
  orientation = 'Vertical',
  disabled = false,
  required = false,
  state = 'Default',
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxCheckListProps) {
  const generatedId = useId().replaceAll(':', '');
  const fieldId = id ?? `pdx-check-list-${generatedId}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const messageId = message ? `${fieldId}-message` : undefined;
  const initialValue =
    defaultValue ??
    items.filter((item) => item.checked).map((item) => item.value);
  const [selectedValues, setSelectedValues] = useControllableState({
    value,
    defaultValue: initialValue,
    onChange,
  });

  const toggleValue = (item: PdxCheckListItem) => {
    if (disabled || item.disabled) return;
    const itemValue = item.value;
    const exists = selectedValues.includes(itemValue);
    const nextValues = exists
      ? selectedValues.filter((val) => val !== itemValue)
      : [...selectedValues, itemValue];

    setSelectedValues(nextValues);
  };

  const describedBy =
    [descriptionId, messageId].filter(Boolean).join(' ') || undefined;
  const fullClassName = mergeClassNames(
    'PdxField',
    'PdxCheckList',
    orientation,
    state,
    disabled && 'Disabled',
    className
  );

  return (
    <fieldset
      aria-describedby={describedBy}
      className={fullClassName}
      disabled={disabled}
      id={fieldId}
      style={style as React.CSSProperties}
      {...getDataAttributes(dataAttributes)}
    >
      {label && (
        <legend className="PdxCheckListLegend">
          <span className="PdxFieldLabel">{label}</span>
          {required && (
            <span className="PdxFieldRequired" aria-hidden="true">
              *
            </span>
          )}
        </legend>
      )}
      {description && (
        <div className="PdxFieldDescription" id={descriptionId}>
          {description}
        </div>
      )}
      <ul className="PdxCheckListItems">
        {items.map((item) => {
          const checked = selectedValues.includes(item.value);
          return (
            <li key={item.value} className="PdxCheckListItem">
              <label
                className={mergeClassNames(
                  'PdxCheckListLabel',
                  item.disabled && 'Disabled'
                )}
              >
                <input
                  aria-invalid={state === 'Error' || undefined}
                  checked={checked}
                  disabled={item.disabled}
                  name={fieldId}
                  onChange={() => toggleValue(item)}
                  type="checkbox"
                  value={item.value}
                />
                <span>{item.label}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {message && (
        <div
          className="PdxFieldMessage"
          data-state={state}
          id={messageId}
          role={state === 'Error' ? 'alert' : 'status'}
        >
          {message}
        </div>
      )}
    </fieldset>
  );
}

export default PdxCheckList;

import './PdxColorPicker.scss';
import {
  mergeClassNames,
  type PdxValidationState,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import PdxField, { usePdxFieldIds } from './PdxField';
import { type PdxComponent } from '@prodivix/shared';
import { useEffect, useState } from 'react';
import type React from 'react';

interface PdxColorPickerSpecificProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  message?: React.ReactNode;
  value?: string;
  defaultValue?: string;
  size?: 'Small' | 'Medium' | 'Large';
  disabled?: boolean;
  required?: boolean;
  state?: PdxValidationState;
  showTextInput?: boolean;
  onChange?: (value: string) => void;
}

export interface PdxColorPickerProps
  extends PdxComponent, PdxColorPickerSpecificProps {}

const DEFAULT_COLOR = '#3F3F3F';

function parseHexColor(value: string) {
  const candidate = value.trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(candidate)) {
    return `#${candidate
      .split('')
      .map((character) => `${character}${character}`)
      .join('')}`.toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(candidate)) {
    return `#${candidate.toUpperCase()}`;
  }
  return undefined;
}

function PdxColorPicker({
  label,
  description,
  message,
  value,
  defaultValue = '#3f3f3f',
  size = 'Medium',
  disabled = false,
  required = false,
  state = 'Default',
  showTextInput = true,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxColorPickerProps) {
  const normalizedDefault = parseHexColor(defaultValue) ?? DEFAULT_COLOR;
  const [currentValue, setCurrentValue] = useControllableState({
    value,
    defaultValue: normalizedDefault,
    onChange,
  });
  const resolvedValue = parseHexColor(currentValue) ?? normalizedDefault;
  const [draftValue, setDraftValue] = useState(resolvedValue);
  const { controlId, descriptionId, messageId, describedBy } = usePdxFieldIds({
    id,
    description,
    message,
  });
  const colorInputId = showTextInput ? `${controlId}-swatch` : controlId;

  useEffect(() => {
    setDraftValue(resolvedValue);
  }, [resolvedValue]);

  const commitValue = (nextValue: string) => {
    const normalized = parseHexColor(nextValue);
    if (!normalized) return false;

    setDraftValue(normalized);
    setCurrentValue(normalized);
    return true;
  };

  const fullClassName = mergeClassNames(
    'PdxColorPicker',
    size,
    state,
    disabled && 'Disabled',
    className
  );

  return (
    <PdxField
      className={fullClassName}
      controlId={controlId}
      dataAttributes={dataAttributes}
      description={description}
      descriptionId={descriptionId}
      label={label}
      message={message}
      messageId={messageId}
      required={required}
      state={state}
      style={style as React.CSSProperties}
    >
      <div className="PdxColorPickerControls">
        <label
          aria-label={showTextInput ? 'Choose color' : undefined}
          className="PdxColorPickerSwatch"
          htmlFor={colorInputId}
          style={{ '--pdx-color-value': resolvedValue } as React.CSSProperties}
          title={resolvedValue}
        >
          <input
            aria-label={showTextInput ? 'Choose color' : undefined}
            aria-describedby={describedBy}
            aria-invalid={state === 'Error' || undefined}
            className="PdxColorPickerInput"
            disabled={disabled}
            id={colorInputId}
            onChange={(event) => commitValue(event.target.value)}
            type="color"
            value={resolvedValue}
          />
        </label>
        {showTextInput && (
          <input
            aria-describedby={describedBy}
            aria-invalid={state === 'Error' || undefined}
            aria-label={typeof label === 'string' ? label : 'Color value'}
            className="PdxColorPickerText"
            disabled={disabled}
            id={controlId}
            maxLength={7}
            onBlur={() => {
              if (!commitValue(draftValue)) setDraftValue(resolvedValue);
            }}
            onChange={(event) => {
              const nextValue = event.target.value.toUpperCase();
              setDraftValue(nextValue);
              commitValue(nextValue);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setDraftValue(resolvedValue);
                event.currentTarget.blur();
              }
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            required={required}
            spellCheck={false}
            type="text"
            value={draftValue}
          />
        )}
      </div>
    </PdxField>
  );
}

export default PdxColorPicker;

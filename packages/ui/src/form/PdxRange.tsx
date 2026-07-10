import './PdxRange.scss';
import {
  mergeClassNames,
  type PdxValidationState,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import PdxField, { usePdxFieldIds } from './PdxField';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

export interface PdxRangeValue {
  min: number;
  max: number;
}

interface PdxRangeSpecificProps {
  label?: React.ReactNode;
  description?: React.ReactNode;
  message?: React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
  value?: PdxRangeValue;
  defaultValue?: PdxRangeValue;
  size?: 'Small' | 'Medium' | 'Large';
  disabled?: boolean;
  required?: boolean;
  state?: PdxValidationState;
  showValue?: boolean;
  onChange?: (value: PdxRangeValue) => void;
}

export interface PdxRangeProps extends PdxComponent, PdxRangeSpecificProps {}

function PdxRange({
  label,
  description,
  message,
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  size = 'Medium',
  disabled = false,
  required = false,
  state = 'Default',
  showValue = true,
  onChange,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxRangeProps) {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);
  const safeStep = step > 0 ? step : 1;
  const normalizeValue = (nextValue: PdxRangeValue): PdxRangeValue => {
    const first = Math.min(upperBound, Math.max(lowerBound, nextValue.min));
    const second = Math.min(upperBound, Math.max(lowerBound, nextValue.max));
    return { min: Math.min(first, second), max: Math.max(first, second) };
  };
  const [rawValue, setRawValue] = useControllableState({
    value,
    defaultValue: normalizeValue(
      defaultValue ?? { min: lowerBound, max: upperBound }
    ),
    onChange,
  });
  const currentValue = normalizeValue(rawValue);
  const { controlId, descriptionId, messageId, describedBy } = usePdxFieldIds({
    id,
    description,
    message,
  });
  const maxControlId = `${controlId}-maximum`;

  const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextMin = Math.min(Number(event.target.value), currentValue.max);
    setRawValue({ min: nextMin, max: currentValue.max });
  };

  const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextMax = Math.max(Number(event.target.value), currentValue.min);
    setRawValue({ min: currentValue.min, max: nextMax });
  };

  const range = upperBound - lowerBound || 1;
  const startPercent = ((currentValue.min - lowerBound) / range) * 100;
  const endPercent = ((currentValue.max - lowerBound) / range) * 100;
  const trackStyle = {
    '--range-start': `${startPercent}%`,
    '--range-end': `${endPercent}%`,
  } as React.CSSProperties;

  const fullClassName = mergeClassNames(
    'PdxRange',
    size,
    state,
    disabled && 'Disabled',
    className
  );
  const labelText = typeof label === 'string' ? label : 'Range';

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
      {showValue && (
        <div className="PdxRangeValues" aria-live="off">
          <output className="PdxRangeValue" htmlFor={controlId}>
            {currentValue.min}
          </output>
          <span aria-hidden="true" className="PdxRangeValueSeparator">
            -
          </span>
          <output className="PdxRangeValue" htmlFor={maxControlId}>
            {currentValue.max}
          </output>
        </div>
      )}
      <div className="PdxRangeTrack" style={trackStyle}>
        <span aria-hidden="true" className="PdxRangeRail" />
        <input
          aria-describedby={describedBy}
          aria-invalid={state === 'Error' || undefined}
          aria-label={`${labelText} minimum`}
          className="PdxRangeInput"
          disabled={disabled}
          id={controlId}
          max={upperBound}
          min={lowerBound}
          onChange={handleMinChange}
          required={required}
          step={safeStep}
          style={{ zIndex: currentValue.min >= upperBound ? 3 : 2 }}
          type="range"
          value={currentValue.min}
        />
        <input
          aria-describedby={describedBy}
          aria-invalid={state === 'Error' || undefined}
          aria-label={`${labelText} maximum`}
          className="PdxRangeInput"
          disabled={disabled}
          id={maxControlId}
          max={upperBound}
          min={lowerBound}
          onChange={handleMaxChange}
          required={required}
          step={safeStep}
          style={{ zIndex: 2 }}
          type="range"
          value={currentValue.max}
        />
      </div>
    </PdxField>
  );
}

export default PdxRange;

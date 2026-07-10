import './PdxSelect.scss';
import {
  mergeClassNames,
  type PdxControlSize,
  type PdxNativeProps,
  type PdxValidationState,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import PdxField, { usePdxFieldIds } from './PdxField';
import { ChevronDown } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

export interface PdxSelectOption {
  disabled?: boolean;
  label: string;
  value: string;
}

export interface PdxSelectOwnProps {
  controlClassName?: string;
  defaultValue?: string;
  description?: ReactNode;
  label?: ReactNode;
  message?: ReactNode;
  onValueChange?: (value: string, option?: PdxSelectOption) => void;
  options: PdxSelectOption[];
  placeholder?: string;
  size?: PdxControlSize;
  state?: PdxValidationState;
  value?: string;
}

export type PdxSelectProps = Omit<
  PdxNativeProps<'select'>,
  'children' | 'defaultValue' | 'value'
> &
  PdxSelectOwnProps;

const PdxSelect = forwardRef<HTMLSelectElement, PdxSelectProps>(
  function PdxSelect(
    {
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      className,
      controlClassName,
      dataAttributes,
      defaultValue = '',
      description,
      disabled = false,
      id,
      label,
      message,
      onChange,
      onValueChange,
      options,
      placeholder = 'Select item',
      required = false,
      size = 'Medium',
      state = 'Default',
      style,
      value,
      ...rest
    },
    ref
  ) {
    const [currentValue, setCurrentValue] = useControllableState({
      value,
      defaultValue,
    });
    const fieldIds = usePdxFieldIds({
      id,
      description,
      message,
      describedBy: ariaDescribedBy,
    });

    return (
      <PdxField
        className={mergeClassNames('PdxSelect', size, className)}
        controlId={fieldIds.controlId}
        dataAttributes={dataAttributes}
        description={description}
        descriptionId={fieldIds.descriptionId}
        label={label}
        message={message}
        messageId={fieldIds.messageId}
        required={required}
        state={state}
        style={style}
      >
        <span className="PdxSelectControlWrapper">
          <select
            {...rest}
            aria-describedby={fieldIds.describedBy}
            aria-invalid={ariaInvalid ?? (state === 'Error' || undefined)}
            className={mergeClassNames(
              'PdxSelectControl',
              state !== 'Default' && state,
              controlClassName
            )}
            disabled={disabled}
            id={fieldIds.controlId}
            onChange={(event) => {
              onChange?.(event);
              const nextValue = event.currentTarget.value;
              const option = options.find((item) => item.value === nextValue);
              setCurrentValue(nextValue);
              onValueChange?.(nextValue, option);
            }}
            ref={ref}
            required={required}
            value={currentValue}
          >
            <option value="" disabled hidden>
              {placeholder}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                disabled={option.disabled}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="PdxSelectIndicator"
            aria-hidden="true"
            size={14}
          />
        </span>
      </PdxField>
    );
  }
);

export default PdxSelect;

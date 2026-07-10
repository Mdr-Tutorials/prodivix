import './PdxRadioGroup.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxControlSize,
  type PdxDataAttributeProps,
  type PdxValidationState,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import { usePdxFieldIds } from './PdxField';
import { forwardRef, type FieldsetHTMLAttributes, type ReactNode } from 'react';

export interface PdxRadioOption {
  description?: string;
  disabled?: boolean;
  label: string;
  value: string;
}

export interface PdxRadioGroupOwnProps {
  defaultValue?: string;
  description?: ReactNode;
  label?: ReactNode;
  layout?: 'Vertical' | 'Horizontal';
  message?: ReactNode;
  name?: string;
  onValueChange?: (value: string) => void;
  options: PdxRadioOption[];
  required?: boolean;
  size?: PdxControlSize;
  state?: PdxValidationState;
  value?: string;
}

export type PdxRadioGroupProps = Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'defaultValue' | 'value'
> &
  PdxDataAttributeProps &
  PdxRadioGroupOwnProps;

const PdxRadioGroup = forwardRef<HTMLFieldSetElement, PdxRadioGroupProps>(
  function PdxRadioGroup(
    {
      'aria-describedby': ariaDescribedBy,
      'aria-invalid': ariaInvalid,
      className,
      dataAttributes,
      defaultValue = '',
      description,
      disabled = false,
      id,
      label,
      layout = 'Vertical',
      message,
      name,
      onValueChange,
      options,
      required = false,
      size = 'Medium',
      state = 'Default',
      value,
      ...rest
    },
    ref
  ) {
    const [currentValue, setCurrentValue] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const fieldIds = usePdxFieldIds({
      id,
      description,
      message,
      describedBy: ariaDescribedBy,
    });
    const groupName = name ?? fieldIds.controlId;

    return (
      <fieldset
        {...rest}
        {...getDataAttributes(dataAttributes)}
        aria-describedby={fieldIds.describedBy}
        aria-invalid={ariaInvalid ?? (state === 'Error' || undefined)}
        className={mergeClassNames(
          'PdxField',
          'PdxRadioGroup',
          size,
          layout,
          disabled && 'Disabled',
          className
        )}
        disabled={disabled}
        id={fieldIds.controlId}
        ref={ref}
      >
        {label && (
          <legend className="PdxFieldHeader PdxRadioGroupLegend">
            <span className="PdxFieldLabel">{label}</span>
            {required && (
              <span className="PdxFieldRequired" aria-hidden="true">
                *
              </span>
            )}
          </legend>
        )}
        {description && (
          <div className="PdxFieldDescription" id={fieldIds.descriptionId}>
            {description}
          </div>
        )}
        <ul className="PdxRadioGroupList">
          {options.map((option, index) => {
            const optionId = `${fieldIds.controlId}-option-${index}`;
            const optionDescriptionId = option.description
              ? `${optionId}-description`
              : undefined;
            const isDisabled = disabled || option.disabled;

            return (
              <li key={option.value} className="PdxRadioGroupItem">
                <label
                  className={mergeClassNames(
                    'PdxRadioGroupLabel',
                    isDisabled && 'Disabled'
                  )}
                  htmlFor={optionId}
                >
                  <input
                    aria-describedby={optionDescriptionId}
                    aria-invalid={state === 'Error' || undefined}
                    checked={currentValue === option.value}
                    disabled={isDisabled}
                    id={optionId}
                    name={groupName}
                    onChange={() => setCurrentValue(option.value)}
                    required={required}
                    type="radio"
                    value={option.value}
                  />
                  <span className="PdxRadioGroupText">
                    <span>{option.label}</span>
                    {option.description && (
                      <span
                        className="PdxRadioGroupDescription"
                        id={optionDescriptionId}
                      >
                        {option.description}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {message && (
          <div
            className="PdxFieldMessage"
            data-state={state}
            id={fieldIds.messageId}
            role={state === 'Error' ? 'alert' : 'status'}
          >
            {message}
          </div>
        )}
      </fieldset>
    );
  }
);

export default PdxRadioGroup;

import './PdxInput.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxControlSize,
  type PdxNativeProps,
  type PdxValidationState,
} from '../foundation/component';
import { forwardRef, type ReactNode } from 'react';

export interface PdxInputOwnProps {
  icon?: ReactNode;
  iconPosition?: 'Left' | 'Right';
  onValueChange?: (value: string) => void;
  size?: PdxControlSize;
  state?: PdxValidationState;
}

export type PdxInputProps = PdxNativeProps<'input'> & PdxInputOwnProps;

const PdxInput = forwardRef<HTMLInputElement, PdxInputProps>(function PdxInput(
  {
    'aria-invalid': ariaInvalid,
    className,
    dataAttributes,
    icon,
    iconPosition = 'Left',
    onChange,
    onValueChange,
    size = 'Medium',
    state = 'Default',
    type = 'text',
    ...rest
  },
  ref
) {
  const input = (
    <input
      {...rest}
      {...getDataAttributes(dataAttributes)}
      aria-invalid={ariaInvalid ?? (state === 'Error' || undefined)}
      className={mergeClassNames(
        'PdxInput',
        size,
        state !== 'Default' && state,
        icon && 'WithIcon',
        icon && iconPosition,
        className
      )}
      onChange={(event) => {
        onChange?.(event);
        onValueChange?.(event.currentTarget.value);
      }}
      ref={ref}
      type={type}
    />
  );

  if (!icon) return input;

  return (
    <span className={mergeClassNames('PdxInputWrapper', size)}>
      {input}
      <span
        className={mergeClassNames('PdxInputIcon', iconPosition)}
        aria-hidden="true"
      >
        {icon}
      </span>
    </span>
  );
});

export default PdxInput;

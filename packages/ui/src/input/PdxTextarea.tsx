import './PdxTextarea.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxControlSize,
  type PdxNativeProps,
  type PdxValidationState,
} from '../foundation/component';
import { forwardRef } from 'react';

export type PdxTextareaResize = 'None' | 'Horizontal' | 'Vertical' | 'Both';

export interface PdxTextareaOwnProps {
  onValueChange?: (value: string) => void;
  resize?: PdxTextareaResize;
  size?: PdxControlSize;
  state?: PdxValidationState;
}

export type PdxTextareaProps = PdxNativeProps<'textarea'> & PdxTextareaOwnProps;

const PdxTextarea = forwardRef<HTMLTextAreaElement, PdxTextareaProps>(
  function PdxTextarea(
    {
      'aria-invalid': ariaInvalid,
      className,
      dataAttributes,
      onChange,
      onValueChange,
      resize = 'Both',
      rows = 4,
      size = 'Medium',
      state = 'Default',
      ...rest
    },
    ref
  ) {
    return (
      <textarea
        {...rest}
        {...getDataAttributes(dataAttributes)}
        aria-invalid={ariaInvalid ?? (state === 'Error' || undefined)}
        className={mergeClassNames(
          'PdxTextarea',
          size,
          resize,
          state !== 'Default' && state,
          className
        )}
        onChange={(event) => {
          onChange?.(event);
          onValueChange?.(event.currentTarget.value);
        }}
        ref={ref}
        rows={rows}
      />
    );
  }
);

export default PdxTextarea;

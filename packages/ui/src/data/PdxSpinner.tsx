import './PdxSpinner.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

interface PdxSpinnerSpecificProps {
  size?: 'Small' | 'Medium' | 'Large';
  label?: string;
  ariaLabel?: string;
  color?: string;
}

export interface PdxSpinnerProps
  extends PdxComponent, PdxSpinnerSpecificProps {}

function PdxSpinner({
  size = 'Medium',
  label,
  ariaLabel,
  color,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxSpinnerProps) {
  const fullClassName = mergeClassNames('PdxSpinner', size, className);
  const spinnerStyle = {
    ...(style as React.CSSProperties),
    ...(color ? { '--pdx-spinner-color': color } : {}),
  } as React.CSSProperties;

  return (
    <div
      aria-busy="true"
      aria-label={ariaLabel ?? (label ? undefined : 'Loading')}
      aria-live="polite"
      className={fullClassName}
      id={id}
      role="status"
      style={spinnerStyle}
      {...getDataAttributes(dataAttributes)}
    >
      <span aria-hidden="true" className="PdxSpinnerCircle" />
      {label && <span className="PdxSpinnerLabel">{label}</span>}
    </div>
  );
}

export default PdxSpinner;

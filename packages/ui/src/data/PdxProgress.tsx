import './PdxProgress.scss';
import { type PdxComponent } from '@prodivix/shared';
import { getDataAttributes } from '../foundation/component';
import type React from 'react';

interface PdxProgressSpecificProps {
  value: number;
  size?: 'Small' | 'Medium' | 'Large';
  status?: 'Default' | 'Success' | 'Warning' | 'Danger';
  showLabel?: boolean;
  label?: string;
}

export interface PdxProgressProps
  extends PdxComponent, PdxProgressSpecificProps {}

function PdxProgress({
  value,
  size = 'Medium',
  status = 'Default',
  showLabel = true,
  label,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const fullClassName =
    `PdxProgress ${size} ${status} ${className || ''}`.trim();
  const dataProps = getDataAttributes(dataAttributes);

  return (
    <div
      aria-label={label || 'Progress'}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={clampedValue}
      className={fullClassName}
      {...dataProps}
      id={id}
      role="progressbar"
      style={style as React.CSSProperties}
    >
      {(label || showLabel) && (
        <div className="PdxProgressHeader">
          {label && <span>{label}</span>}
          {showLabel && <span>{clampedValue}%</span>}
        </div>
      )}
      <div className="PdxProgressTrack" aria-hidden="true">
        <div className="PdxProgressBar" style={{ width: `${clampedValue}%` }} />
      </div>
    </div>
  );
}

export default PdxProgress;

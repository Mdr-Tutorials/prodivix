import './PdxSkeleton.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

interface PdxSkeletonSpecificProps {
  variant?: 'Text' | 'Circle' | 'Rect';
  width?: number | string;
  height?: number | string;
  lines?: number;
  animated?: boolean;
}

export interface PdxSkeletonProps
  extends PdxComponent, PdxSkeletonSpecificProps {}

function PdxSkeleton({
  variant = 'Text',
  width,
  height,
  lines = 1,
  animated = true,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxSkeletonProps) {
  const fullClassName = mergeClassNames(
    'PdxSkeleton',
    variant,
    animated && 'Animated',
    className
  );

  const baseStyle: React.CSSProperties = {
    width,
    height,
    ...(style as React.CSSProperties),
  };

  if (variant === 'Text' && lines > 1) {
    return (
      <div
        aria-hidden="true"
        className={mergeClassNames('PdxSkeletonGroup', className)}
        id={id}
        style={{ ...(style as React.CSSProperties), width }}
        {...getDataAttributes(dataAttributes)}
      >
        {Array.from({ length: lines }).map((_, index) => (
          <span
            key={index}
            className={mergeClassNames(
              'PdxSkeleton',
              'Text',
              animated && 'Animated'
            )}
            style={{
              height,
              width: width ?? (index === lines - 1 ? '72%' : '100%'),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={fullClassName}
      style={baseStyle}
      id={id}
      {...getDataAttributes(dataAttributes)}
    />
  );
}

export default PdxSkeleton;

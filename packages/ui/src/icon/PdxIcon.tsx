import './PdxIcon.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxNativeProps,
} from '../foundation/component';
import React, { forwardRef } from 'react';

export type PdxIconRenderable =
  | React.ReactElement<Record<string, unknown>>
  | React.ComponentType<Record<string, unknown>>;

export interface PdxIconOwnProps {
  color?: string;
  decorative?: boolean;
  icon: PdxIconRenderable;
  size?: number | string;
  title?: string;
}

export type PdxIconProps = Omit<
  PdxNativeProps<'span'>,
  'children' | 'color' | 'title'
> &
  PdxIconOwnProps;

const isComponentIcon = (
  value: unknown
): value is React.ComponentType<Record<string, unknown>> =>
  typeof value === 'function' ||
  (typeof value === 'object' && value !== null && '$$typeof' in value);

function renderFallbackIcon(
  size: number | string,
  color: string,
  decorative: boolean
) {
  return (
    <svg
      aria-hidden={decorative || undefined}
      fill="none"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <circle cx="12" cy="12" r="8" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function renderIcon(
  icon: PdxIconRenderable,
  size: number | string,
  color: string,
  decorative: boolean
) {
  const accessibilityProps = decorative
    ? { 'aria-hidden': true, focusable: false }
    : {};

  if (React.isValidElement(icon)) {
    const originalProps = icon.props ?? {};
    const style = originalProps.style as React.CSSProperties | undefined;

    return React.cloneElement(icon, {
      ...accessibilityProps,
      color,
      height: size,
      size,
      style: { ...style, color },
      width: size,
    });
  }

  if (!isComponentIcon(icon)) {
    return renderFallbackIcon(size, color, decorative);
  }

  const IconComponent = icon;
  return (
    <IconComponent
      {...accessibilityProps}
      color={color}
      height={size}
      size={size}
      width={size}
    />
  );
}

const PdxIcon = forwardRef<HTMLSpanElement, PdxIconProps>(function PdxIcon(
  {
    className,
    color = 'currentColor',
    dataAttributes,
    decorative,
    icon,
    size = 24,
    style,
    title,
    ...rest
  },
  ref
) {
  const isDecorative = decorative ?? !title;

  return (
    <span
      {...rest}
      {...getDataAttributes(dataAttributes)}
      aria-hidden={isDecorative || undefined}
      aria-label={isDecorative ? undefined : title}
      className={mergeClassNames('PdxIcon', className)}
      ref={ref}
      role={isDecorative ? undefined : 'img'}
      style={{
        fontSize: typeof size === 'number' ? `${size}px` : size,
        ...style,
      }}
    >
      {renderIcon(icon, size, color, isDecorative)}
    </span>
  );
});

export default PdxIcon;

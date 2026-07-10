import { getDataAttributes, mergeClassNames } from '../foundation/component';
import React from 'react';
import type { PdxComponent } from '@prodivix/shared';
import './PdxNav.scss';

interface PdxNavSpecificProps {
  columns?: 2 | 3;
  align?: 'Start' | 'Center' | 'End' | 'Baseline' | 'Stretch';
  canHide?: boolean;
  hidden?: boolean;
  isFloat?: boolean;
  backgroundStyle?: 'Transparent' | 'Solid' | 'Blurred';
  navigationLabel?: string;
  children?: React.ReactNode;
}

export interface PdxNavProps extends PdxComponent, PdxNavSpecificProps {}

function PdxNav({
  columns = 3,
  align = 'Center',
  canHide = false,
  hidden = false,
  isFloat = false,
  backgroundStyle = 'Solid',
  navigationLabel,
  children,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
  as: Component = 'nav',
}: PdxNavProps) {
  const fullClassName = mergeClassNames(
    'PdxNav',
    `Columns-${columns}`,
    `Align-${align}`,
    isFloat && 'Float',
    canHide && 'CanHide',
    canHide && hidden && 'Hidden',
    backgroundStyle,
    className
  );
  const Element = Component as React.ElementType;

  return (
    <Element
      aria-hidden={canHide && hidden ? true : undefined}
      aria-label={navigationLabel}
      className={fullClassName}
      id={id}
      inert={canHide && hidden ? true : undefined}
      onClick={onClick}
      style={style}
      {...getDataAttributes(dataAttributes)}
    >
      {children}
    </Element>
  );
}

interface PdxNavAreaProps {
  children?: React.ReactNode;
}

function PdxNavLeft({ children }: PdxNavAreaProps) {
  return <div className="PdxNavLeft">{children}</div>;
}

function PdxNavCenter({ children }: PdxNavAreaProps) {
  return <div className="PdxNavCenter">{children}</div>;
}

function PdxNavRight({ children }: PdxNavAreaProps) {
  return <div className="PdxNavRight">{children}</div>;
}

function PdxNavHeading({ heading }: { heading: string }) {
  return <span className="PdxNavHeading">{heading}</span>;
}

PdxNav.Left = PdxNavLeft;
PdxNav.Center = PdxNavCenter;
PdxNav.Right = PdxNavRight;
PdxNav.Heading = PdxNavHeading;

export default PdxNav;

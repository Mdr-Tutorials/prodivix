import './PdxHeading.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

interface PdxHeadingSpecificProps {
  children: React.ReactNode;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  weight?: 'Light' | 'Normal' | 'Medium' | 'SemiBold' | 'Bold';
  color?:
    | 'Default'
    | 'Muted'
    | 'Primary'
    | 'Secondary'
    | 'Danger'
    | 'Warning'
    | 'Success';
  align?: 'Left' | 'Center' | 'Right';
}

export interface PdxHeadingProps
  extends PdxComponent, PdxHeadingSpecificProps {}

function PdxHeading({
  children,
  level = 1,
  weight = 'Bold',
  color = 'Default',
  align = 'Left',
  as: Component,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
}: PdxHeadingProps) {
  const fullClassName = mergeClassNames(
    'PdxHeading',
    `Level${level}`,
    `Weight${weight}`,
    `Tone${color}`,
    `Align${align}`,
    className
  );

  const Element = (Component || `h${level}`) as React.ElementType;

  return (
    <Element
      className={fullClassName}
      id={id}
      onClick={onClick}
      style={style}
      {...getDataAttributes(dataAttributes)}
    >
      {children}
    </Element>
  );
}

export default PdxHeading;

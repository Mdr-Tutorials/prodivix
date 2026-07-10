import './PdxText.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

interface PdxTextSpecificProps {
  children: React.ReactNode;
  size?: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Big';
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
  truncate?: boolean;
}

export interface PdxTextProps extends PdxComponent, PdxTextSpecificProps {}

function PdxText({
  children,
  size = 'Medium',
  weight = 'Normal',
  color = 'Default',
  align = 'Left',
  truncate = false,
  as: Component = 'span',
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
}: PdxTextProps) {
  const fullClassName = mergeClassNames(
    'PdxText',
    `Size${size}`,
    `Weight${weight}`,
    `Tone${color}`,
    `Align${align}`,
    truncate && 'Truncate',
    className
  );

  const Element = Component as React.ElementType;

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

export default PdxText;

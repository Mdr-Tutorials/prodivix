import './PdxParagraph.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

interface PdxParagraphSpecificProps {
  children: React.ReactNode;
  size?: 'Small' | 'Medium' | 'Large';
  weight?: 'Light' | 'Normal' | 'Medium' | 'SemiBold';
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

export interface PdxParagraphProps
  extends PdxComponent, PdxParagraphSpecificProps {}

function PdxParagraph({
  children,
  size = 'Medium',
  weight = 'Normal',
  color = 'Default',
  align = 'Left',
  as: Component = 'p',
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
}: PdxParagraphProps) {
  const fullClassName = mergeClassNames(
    'PdxParagraph',
    `Size${size}`,
    `Weight${weight}`,
    `Tone${color}`,
    `Align${align}`,
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

export default PdxParagraph;

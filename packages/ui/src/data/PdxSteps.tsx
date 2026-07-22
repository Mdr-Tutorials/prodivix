import './PdxSteps.scss';
import { type PdxComponent } from '@prodivix/shared';
import { getDataAttributes } from '../foundation/component';
import { Check } from 'lucide-react';
import type React from 'react';

export interface PdxStepItem {
  title: string;
  description?: string;
}

interface PdxStepsSpecificProps {
  items: PdxStepItem[];
  current?: number;
  direction?: 'Horizontal' | 'Vertical';
}

export interface PdxStepsProps extends PdxComponent, PdxStepsSpecificProps {}

function PdxSteps({
  items,
  current = 0,
  direction = 'Horizontal',
  className,
  style,
  id,
  dataAttributes = {},
}: PdxStepsProps) {
  const fullClassName = `PdxSteps ${direction} ${className || ''}`.trim();
  const dataProps = getDataAttributes(dataAttributes);

  return (
    <ol
      className={fullClassName}
      {...dataProps}
      id={id}
      style={style as React.CSSProperties}
    >
      {items.map((item, index) => {
        const status =
          index < current
            ? 'Completed'
            : index === current
              ? 'Active'
              : 'Pending';
        return (
          <li
            aria-current={status === 'Active' ? 'step' : undefined}
            key={item.title}
            className={`PdxStep ${status}`}
          >
            <div className="PdxStepIndicator" aria-hidden="true">
              {status === 'Completed' ? (
                <Check size={15} strokeWidth={2.4} />
              ) : (
                index + 1
              )}
            </div>
            <div className="PdxStepContent">
              <div className="PdxStepTitle">{item.title}</div>
              {item.description && (
                <div className="PdxStepDescription">{item.description}</div>
              )}
            </div>
            {index < items.length - 1 && (
              <div className="PdxStepConnector" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default PdxSteps;

import './PdxEmpty.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxNativeProps,
} from '../foundation/component';
import { Inbox } from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

export interface PdxEmptyOwnProps {
  action?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  showIcon?: boolean;
  size?: 'Small' | 'Medium' | 'Large';
  title?: ReactNode;
  variant?: 'Plain' | 'Panel';
}

export type PdxEmptyProps = Omit<PdxNativeProps<'div'>, 'children' | 'title'> &
  PdxEmptyOwnProps;

const PdxEmpty = forwardRef<HTMLDivElement, PdxEmptyProps>(function PdxEmpty(
  {
    action,
    className,
    dataAttributes,
    description,
    icon,
    showIcon = true,
    size = 'Medium',
    title = 'No data',
    variant = 'Plain',
    ...rest
  },
  ref
) {
  return (
    <div
      {...rest}
      {...getDataAttributes(dataAttributes)}
      className={mergeClassNames('PdxEmpty', size, variant, className)}
      ref={ref}
    >
      {showIcon ? (
        <div aria-hidden="true" className="PdxEmptyIcon">
          {icon ?? <Inbox size={24} strokeWidth={1.7} />}
        </div>
      ) : null}
      <div className="PdxEmptyTitle">{title}</div>
      {description ? (
        <div className="PdxEmptyDescription">{description}</div>
      ) : null}
      {action ? <div className="PdxEmptyAction">{action}</div> : null}
    </div>
  );
});

export default PdxEmpty;

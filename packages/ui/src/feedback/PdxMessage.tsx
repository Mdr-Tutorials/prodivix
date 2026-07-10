import './PdxMessage.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxNativeProps,
} from '../foundation/component';
import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

export type PdxFeedbackType = 'Info' | 'Success' | 'Warning' | 'Danger';

export interface PdxMessageOwnProps {
  closable?: boolean;
  closeLabel?: string;
  icon?: ReactNode;
  onClose?: () => void;
  showIcon?: boolean;
  text: ReactNode;
  type?: PdxFeedbackType;
}

export type PdxMessageProps = Omit<PdxNativeProps<'div'>, 'children'> &
  PdxMessageOwnProps;

const MESSAGE_ICONS: Record<PdxFeedbackType, LucideIcon> = {
  Info,
  Success: CheckCircle2,
  Warning: AlertTriangle,
  Danger: CircleX,
};

const PdxMessage = forwardRef<HTMLDivElement, PdxMessageProps>(
  function PdxMessage(
    {
      className,
      closable = false,
      closeLabel = 'Dismiss message',
      dataAttributes,
      icon,
      onClose,
      role,
      showIcon = true,
      text,
      type = 'Info',
      ...rest
    },
    ref
  ) {
    const MessageIcon = MESSAGE_ICONS[type];

    return (
      <div
        {...rest}
        {...getDataAttributes(dataAttributes)}
        className={mergeClassNames('PdxMessage', type, className)}
        ref={ref}
        role={
          role ?? (type === 'Danger' || type === 'Warning' ? 'alert' : 'status')
        }
      >
        {showIcon ? (
          <span aria-hidden="true" className="PdxMessageIcon">
            {icon ?? <MessageIcon size={16} />}
          </span>
        ) : null}
        <span className="PdxMessageText">{text}</span>
        {closable ? (
          <button
            aria-label={closeLabel}
            className="PdxMessageClose"
            onClick={onClose}
            title={closeLabel}
            type="button"
          >
            <X aria-hidden="true" size={14} />
          </button>
        ) : null}
      </div>
    );
  }
);

export default PdxMessage;

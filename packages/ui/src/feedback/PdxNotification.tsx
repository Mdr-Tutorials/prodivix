import './PdxNotification.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxNativeProps,
} from '../foundation/component';
import type { PdxFeedbackType } from './PdxMessage';
import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { forwardRef, type ReactNode } from 'react';

export interface PdxNotificationOwnProps {
  actions?: ReactNode;
  closable?: boolean;
  closeLabel?: string;
  description?: ReactNode;
  icon?: ReactNode;
  onClose?: () => void;
  showIcon?: boolean;
  title: ReactNode;
  type?: PdxFeedbackType;
}

export type PdxNotificationProps = Omit<
  PdxNativeProps<'div'>,
  'children' | 'title'
> &
  PdxNotificationOwnProps;

const NOTIFICATION_ICONS: Record<PdxFeedbackType, LucideIcon> = {
  Info,
  Success: CheckCircle2,
  Warning: AlertTriangle,
  Danger: CircleX,
};

const PdxNotification = forwardRef<HTMLDivElement, PdxNotificationProps>(
  function PdxNotification(
    {
      actions,
      className,
      closable = false,
      closeLabel = 'Dismiss notification',
      dataAttributes,
      description,
      icon,
      onClose,
      role,
      showIcon = true,
      title,
      type = 'Info',
      ...rest
    },
    ref
  ) {
    const NotificationIcon = NOTIFICATION_ICONS[type];

    return (
      <div
        {...rest}
        {...getDataAttributes(dataAttributes)}
        className={mergeClassNames('PdxNotification', type, className)}
        ref={ref}
        role={
          role ?? (type === 'Danger' || type === 'Warning' ? 'alert' : 'status')
        }
      >
        {showIcon ? (
          <span aria-hidden="true" className="PdxNotificationIcon">
            {icon ?? <NotificationIcon size={18} />}
          </span>
        ) : null}
        <div className="PdxNotificationBody">
          <div className="PdxNotificationTitle">{title}</div>
          {description ? (
            <div className="PdxNotificationDescription">{description}</div>
          ) : null}
          {actions ? (
            <div className="PdxNotificationActions">{actions}</div>
          ) : null}
        </div>
        {closable ? (
          <button
            aria-label={closeLabel}
            className="PdxNotificationClose"
            onClick={onClose}
            title={closeLabel}
            type="button"
          >
            <X aria-hidden="true" size={15} />
          </button>
        ) : null}
      </div>
    );
  }
);

export default PdxNotification;

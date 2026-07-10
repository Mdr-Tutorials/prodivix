import './PdxField.scss';
import {
  getDataAttributes,
  mergeAriaDescribedBy,
  mergeClassNames,
  type PdxDataAttributeProps,
  type PdxValidationState,
} from '../foundation/component';
import { useId, type HTMLAttributes, type ReactNode } from 'react';

interface PdxFieldIdOptions {
  id?: string;
  description?: ReactNode;
  message?: ReactNode;
  describedBy?: string;
}

export function usePdxFieldIds({
  id,
  description,
  message,
  describedBy,
}: PdxFieldIdOptions) {
  const generatedId = useId().replaceAll(':', '');
  const controlId = id ?? `pdx-control-${generatedId}`;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const messageId = message ? `${controlId}-message` : undefined;

  return {
    controlId,
    descriptionId,
    messageId,
    describedBy: mergeAriaDescribedBy(describedBy, descriptionId, messageId),
  };
}

export interface PdxFieldProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    PdxDataAttributeProps {
  children: ReactNode;
  controlId: string;
  description?: ReactNode;
  descriptionId?: string;
  label?: ReactNode;
  message?: ReactNode;
  messageId?: string;
  required?: boolean;
  state?: PdxValidationState;
}

function PdxField({
  children,
  className,
  controlId,
  dataAttributes,
  description,
  descriptionId,
  label,
  message,
  messageId,
  required = false,
  state = 'Default',
  ...rest
}: PdxFieldProps) {
  return (
    <div
      {...rest}
      {...getDataAttributes(dataAttributes)}
      className={mergeClassNames('PdxField', className)}
      data-state={state}
    >
      {label && (
        <div className="PdxFieldHeader">
          <label className="PdxFieldLabel" htmlFor={controlId}>
            {label}
          </label>
          {required && (
            <span className="PdxFieldRequired" aria-hidden="true">
              *
            </span>
          )}
        </div>
      )}
      {description && (
        <div className="PdxFieldDescription" id={descriptionId}>
          {description}
        </div>
      )}
      {children}
      {message && (
        <div
          className="PdxFieldMessage"
          data-state={state}
          id={messageId}
          role={state === 'Error' ? 'alert' : 'status'}
        >
          {message}
        </div>
      )}
    </div>
  );
}

export default PdxField;

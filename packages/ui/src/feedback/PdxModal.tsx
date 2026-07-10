import './PdxModal.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export type PdxModalSize = 'Small' | 'Medium' | 'Large';

export interface PdxModalProps {
  children?: ReactNode;
  className?: string;
  closeLabel?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  dataAttributes?: Record<string, string>;
  description?: ReactNode;
  footer?: ReactNode;
  id?: string;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  open: boolean;
  portal?: boolean;
  showClose?: boolean;
  size?: PdxModalSize;
  style?: CSSProperties;
  title: ReactNode;
}

function PdxModal({
  children,
  className,
  closeLabel = 'Close dialog',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  dataAttributes,
  description,
  footer,
  id,
  onClose,
  onOpenChange,
  open,
  portal = true,
  showClose = true,
  size = 'Medium',
  style,
  title,
}: PdxModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) onClose?.();
  };

  const content = (
    <>
      <DialogPrimitive.Overlay className="PdxModalOverlay" />
      <DialogPrimitive.Content
        {...getDataAttributes(dataAttributes)}
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={mergeClassNames('PdxModal', size, className)}
        id={id}
        onEscapeKeyDown={(event) => {
          if (!closeOnEscape) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!closeOnOverlayClick) event.preventDefault();
        }}
        style={style}
      >
        <header className="PdxModalHeader">
          <div className="PdxModalHeading">
            <DialogPrimitive.Title className="PdxModalTitle">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="PdxModalDescription">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {showClose ? (
            <DialogPrimitive.Close asChild>
              <button
                aria-label={closeLabel}
                className="PdxModalClose"
                title={closeLabel}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </DialogPrimitive.Close>
          ) : null}
        </header>
        <div className="PdxModalBody">{children}</div>
        {footer ? <footer className="PdxModalFooter">{footer}</footer> : null}
      </DialogPrimitive.Content>
    </>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      {portal ? (
        <DialogPrimitive.Portal>{content}</DialogPrimitive.Portal>
      ) : (
        content
      )}
    </DialogPrimitive.Root>
  );
}

export default PdxModal;

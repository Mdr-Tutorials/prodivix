import './PdxDrawer.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';

export type PdxDrawerPlacement = 'Left' | 'Right' | 'Top' | 'Bottom';

export interface PdxDrawerProps {
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
  placement?: PdxDrawerPlacement;
  portal?: boolean;
  showClose?: boolean;
  size?: number | string;
  style?: CSSProperties;
  title: ReactNode;
}

function PdxDrawer({
  children,
  className,
  closeLabel = 'Close drawer',
  closeOnEscape = true,
  closeOnOverlayClick = true,
  dataAttributes,
  description,
  footer,
  id,
  onClose,
  onOpenChange,
  open,
  placement = 'Right',
  portal = true,
  showClose = true,
  size = 360,
  style,
  title,
}: PdxDrawerProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    if (!nextOpen) onClose?.();
  };
  const dimension = typeof size === 'number' ? `${size}px` : size;
  const drawerStyle: CSSProperties =
    placement === 'Top' || placement === 'Bottom'
      ? { height: dimension, ...style }
      : { width: dimension, ...style };

  const content = (
    <>
      <DialogPrimitive.Overlay className="PdxDrawerOverlay" />
      <DialogPrimitive.Content
        {...getDataAttributes(dataAttributes)}
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={mergeClassNames('PdxDrawer', placement, className)}
        id={id}
        onEscapeKeyDown={(event) => {
          if (!closeOnEscape) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!closeOnOverlayClick) event.preventDefault();
        }}
        style={drawerStyle}
      >
        <header className="PdxDrawerHeader">
          <div className="PdxDrawerHeading">
            <DialogPrimitive.Title className="PdxDrawerTitle">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="PdxDrawerDescription">
                {description}
              </DialogPrimitive.Description>
            ) : null}
          </div>
          {showClose ? (
            <DialogPrimitive.Close asChild>
              <button
                aria-label={closeLabel}
                className="PdxDrawerClose"
                title={closeLabel}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </DialogPrimitive.Close>
          ) : null}
        </header>
        <div className="PdxDrawerBody">{children}</div>
        {footer ? <footer className="PdxDrawerFooter">{footer}</footer> : null}
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

export default PdxDrawer;

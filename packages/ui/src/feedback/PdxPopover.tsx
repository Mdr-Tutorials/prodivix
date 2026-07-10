import './PdxPopover.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import type { PdxFloatingAlign, PdxFloatingPlacement } from './PdxTooltip';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  useId,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';

export interface PdxPopoverProps {
  align?: PdxFloatingAlign;
  children: ReactElement;
  className?: string;
  collisionPadding?: number;
  content: ReactNode;
  dataAttributes?: Record<string, string>;
  defaultOpen?: boolean;
  id?: string;
  modal?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  panelClassName?: string;
  panelLabel: string;
  panelStyle?: CSSProperties;
  placement?: PdxFloatingPlacement;
  portal?: boolean;
  sideOffset?: number;
  style?: CSSProperties;
  title?: ReactNode;
}

const toSide = (placement: PdxFloatingPlacement) =>
  placement.toLowerCase() as Lowercase<PdxFloatingPlacement>;
const toAlign = (align: PdxFloatingAlign) =>
  align.toLowerCase() as Lowercase<PdxFloatingAlign>;

function PdxPopover({
  align = 'Start',
  children,
  className,
  collisionPadding = 12,
  content,
  dataAttributes,
  defaultOpen,
  id,
  modal = false,
  onOpenChange,
  open,
  panelClassName,
  panelLabel,
  panelStyle,
  placement = 'Bottom',
  portal = true,
  sideOffset = 7,
  style,
  title,
}: PdxPopoverProps) {
  const titleId = useId();

  const popoverContent = (
    <PopoverPrimitive.Content
      align={toAlign(align)}
      aria-label={title ? undefined : panelLabel}
      aria-labelledby={title ? titleId : undefined}
      className={mergeClassNames('PdxPopoverPanel', panelClassName)}
      collisionPadding={collisionPadding}
      side={toSide(placement)}
      sideOffset={sideOffset}
      style={panelStyle}
    >
      {title ? (
        <div className="PdxPopoverTitle" id={titleId}>
          {title}
        </div>
      ) : null}
      <div className="PdxPopoverContent">{content}</div>
      <PopoverPrimitive.Arrow className="PdxPopoverArrow" />
    </PopoverPrimitive.Content>
  );

  return (
    <span
      {...getDataAttributes(dataAttributes)}
      className={mergeClassNames('PdxPopover', className)}
      id={id}
      style={style}
    >
      <PopoverPrimitive.Root
        defaultOpen={defaultOpen}
        modal={modal}
        onOpenChange={onOpenChange}
        open={open}
      >
        <PopoverPrimitive.Trigger asChild>{children}</PopoverPrimitive.Trigger>
        {portal ? (
          <PopoverPrimitive.Portal>{popoverContent}</PopoverPrimitive.Portal>
        ) : (
          popoverContent
        )}
      </PopoverPrimitive.Root>
    </span>
  );
}

export default PdxPopover;

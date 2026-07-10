import './PdxTooltip.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type { CSSProperties, ReactElement, ReactNode } from 'react';

export type PdxFloatingPlacement = 'Top' | 'Right' | 'Bottom' | 'Left';
export type PdxFloatingAlign = 'Start' | 'Center' | 'End';

export interface PdxTooltipProps {
  align?: PdxFloatingAlign;
  children: ReactElement;
  className?: string;
  content: ReactNode;
  dataAttributes?: Record<string, string>;
  defaultOpen?: boolean;
  delayDuration?: number;
  disabled?: boolean;
  id?: string;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  placement?: PdxFloatingPlacement;
  portal?: boolean;
  sideOffset?: number;
  style?: CSSProperties;
}

const toSide = (placement: PdxFloatingPlacement) =>
  placement.toLowerCase() as Lowercase<PdxFloatingPlacement>;
const toAlign = (align: PdxFloatingAlign) =>
  align.toLowerCase() as Lowercase<PdxFloatingAlign>;

function PdxTooltip({
  align = 'Center',
  children,
  className,
  content,
  dataAttributes,
  defaultOpen,
  delayDuration = 400,
  disabled = false,
  id,
  onOpenChange,
  open,
  placement = 'Top',
  portal = true,
  sideOffset = 7,
  style,
}: PdxTooltipProps) {
  if (disabled) return children;

  const tooltipContent = (
    <TooltipPrimitive.Content
      align={toAlign(align)}
      className={mergeClassNames('PdxTooltipContent', className)}
      side={toSide(placement)}
      sideOffset={sideOffset}
      style={style}
    >
      {content}
      <TooltipPrimitive.Arrow className="PdxTooltipArrow" />
    </TooltipPrimitive.Content>
  );

  return (
    <span {...getDataAttributes(dataAttributes)} className="PdxTooltip" id={id}>
      <TooltipPrimitive.Provider delayDuration={delayDuration}>
        <TooltipPrimitive.Root
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          open={open}
        >
          <TooltipPrimitive.Trigger asChild>
            {children}
          </TooltipPrimitive.Trigger>
          {portal ? (
            <TooltipPrimitive.Portal>{tooltipContent}</TooltipPrimitive.Portal>
          ) : (
            tooltipContent
          )}
        </TooltipPrimitive.Root>
      </TooltipPrimitive.Provider>
    </span>
  );
}

export default PdxTooltip;

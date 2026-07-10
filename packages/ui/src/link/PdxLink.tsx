import './PdxLink.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxDataAttributeProps,
} from '../foundation/component';
import { forwardRef, type ReactNode } from 'react';
import { Link, type LinkProps, type To } from 'react-router';

export interface PdxLinkProps
  extends Omit<LinkProps, 'children' | 'to'>, PdxDataAttributeProps {
  children?: ReactNode;
  disabled?: boolean;
  text?: string;
  to: To;
  underline?: boolean;
}

const PdxLink = forwardRef<HTMLAnchorElement, PdxLinkProps>(function PdxLink(
  {
    children,
    className,
    dataAttributes,
    disabled = false,
    onClick,
    tabIndex,
    text,
    to,
    underline = true,
    ...rest
  },
  ref
) {
  return (
    <Link
      {...rest}
      {...getDataAttributes(dataAttributes)}
      aria-disabled={disabled || undefined}
      className={mergeClassNames(
        'PdxLink',
        !underline && 'NoUnderline',
        disabled && 'Disabled',
        className
      )}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      ref={ref}
      tabIndex={disabled ? -1 : tabIndex}
      to={to}
    >
      {children ?? text ?? 'Link'}
    </Link>
  );
});

export default PdxLink;

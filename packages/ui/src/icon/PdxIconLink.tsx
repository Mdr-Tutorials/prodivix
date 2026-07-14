import './PdxIconLink.scss';
import PdxIcon, { type PdxIconOwnProps } from './PdxIcon';
import PdxLink, { type PdxLinkProps } from '../link/PdxLink';
import { forwardRef, type ReactNode } from 'react';

export interface PdxIconLinkProps
  extends
    Omit<PdxLinkProps, 'aria-label' | 'children' | 'text'>,
    Pick<PdxIconOwnProps, 'color' | 'icon' | 'size'> {
  badge?: ReactNode;
  label: string;
}

const PdxIconLink = forwardRef<HTMLAnchorElement, PdxIconLinkProps>(
  function PdxIconLink(
    { badge, className, color, icon, label, size = 20, title, ...rest },
    ref
  ) {
    const hasBadge =
      badge !== undefined &&
      badge !== null &&
      badge !== false &&
      badge !== '' &&
      badge !== 0;
    return (
      <PdxLink
        {...rest}
        aria-label={label}
        className={`PdxIconLink ${className ?? ''}`.trim()}
        ref={ref}
        title={title ?? label}
        underline={false}
      >
        <PdxIcon color={color} decorative icon={icon} size={size} />
        {hasBadge ? (
          <span aria-hidden="true" className="PdxIconLinkBadge">
            {badge}
          </span>
        ) : null}
      </PdxLink>
    );
  }
);

export default PdxIconLink;

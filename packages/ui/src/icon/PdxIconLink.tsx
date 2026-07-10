import './PdxIconLink.scss';
import PdxIcon, { type PdxIconOwnProps } from './PdxIcon';
import PdxLink, { type PdxLinkProps } from '../link/PdxLink';
import { forwardRef } from 'react';

export interface PdxIconLinkProps
  extends
    Omit<PdxLinkProps, 'aria-label' | 'children' | 'text'>,
    Pick<PdxIconOwnProps, 'color' | 'icon' | 'size'> {
  label: string;
}

const PdxIconLink = forwardRef<HTMLAnchorElement, PdxIconLinkProps>(
  function PdxIconLink(
    { className, color, icon, label, size = 20, title, ...rest },
    ref
  ) {
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
      </PdxLink>
    );
  }
);

export default PdxIconLink;

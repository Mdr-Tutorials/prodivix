import {
  ButtonContent,
  getButtonClassName,
  type PdxButtonContentProps,
  type PdxButtonVisualProps,
} from './PdxButton';
import PdxLink, { type PdxLinkProps } from '../link/PdxLink';
import { forwardRef } from 'react';

export type PdxButtonLinkProps = Omit<
  PdxLinkProps,
  'children' | 'text' | 'underline'
> &
  PdxButtonVisualProps &
  PdxButtonContentProps;

const PdxButtonLink = forwardRef<HTMLAnchorElement, PdxButtonLinkProps>(
  function PdxButtonLink(
    {
      children,
      className,
      disabled = false,
      icon,
      iconOnly = false,
      iconPosition = 'Left',
      loading = false,
      loadingText,
      size = 'Medium',
      text,
      tone = 'Neutral',
      variant = 'Secondary',
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <PdxLink
        {...rest}
        aria-busy={loading || undefined}
        className={getButtonClassName({
          className: `PdxButtonLink ${className ?? ''}`.trim(),
          disabled: isDisabled,
          iconOnly,
          loading,
          size,
          tone,
          variant,
        })}
        disabled={isDisabled}
        ref={ref}
        underline={false}
      >
        <ButtonContent
          icon={icon}
          iconOnly={iconOnly}
          iconPosition={iconPosition}
          loading={loading}
          loadingText={loadingText}
          text={text}
        >
          {children}
        </ButtonContent>
      </PdxLink>
    );
  }
);

export default PdxButtonLink;

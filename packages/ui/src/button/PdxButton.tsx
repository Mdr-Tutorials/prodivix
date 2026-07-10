import './PdxButton.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxControlSize,
  type PdxNativeProps,
} from '../foundation/component';
import { forwardRef, type ReactNode } from 'react';

export type PdxButtonVariant = 'Primary' | 'Secondary' | 'Ghost';
export type PdxButtonTone = 'Neutral' | 'Danger' | 'Warning';
export type PdxButtonIconPosition = 'Left' | 'Right';

export interface PdxButtonVisualProps {
  icon?: ReactNode;
  iconPosition?: PdxButtonIconPosition;
  loading?: boolean;
  loadingText?: string;
  size?: PdxControlSize;
  text?: string;
  tone?: PdxButtonTone;
  variant?: PdxButtonVariant;
}

interface RegularButtonContentProps {
  children?: ReactNode;
  iconOnly?: false;
}

interface IconOnlyButtonContentProps {
  'aria-label': string;
  children?: never;
  icon: ReactNode;
  iconOnly: true;
  text?: never;
}

export type PdxButtonContentProps =
  IconOnlyButtonContentProps | RegularButtonContentProps;

export type PdxButtonProps = Omit<PdxNativeProps<'button'>, 'children'> &
  PdxButtonVisualProps &
  PdxButtonContentProps;

interface ButtonClassNameOptions {
  className?: string;
  disabled?: boolean;
  iconOnly?: boolean;
  loading?: boolean;
  size: PdxControlSize;
  tone: PdxButtonTone;
  variant: PdxButtonVariant;
}

export function getButtonClassName({
  className,
  disabled,
  iconOnly,
  loading,
  size,
  tone,
  variant,
}: ButtonClassNameOptions) {
  return mergeClassNames(
    'PdxButton',
    size,
    `Variant${variant}`,
    `Tone${tone}`,
    iconOnly && 'IconOnly',
    loading && 'Loading',
    disabled && 'Disabled',
    className
  );
}

interface ButtonContentRenderProps extends PdxButtonVisualProps {
  children?: ReactNode;
  iconOnly?: boolean;
}

export function ButtonContent({
  children,
  icon,
  iconOnly,
  iconPosition = 'Left',
  loading,
  loadingText,
  text,
}: ButtonContentRenderProps) {
  const content = children ?? text;

  if (loading) {
    return (
      <>
        <span className="PdxButtonSpinner" aria-hidden="true" />
        {!iconOnly && <span>{loadingText ?? content}</span>}
      </>
    );
  }

  if (iconOnly) {
    return <span className="PdxButtonIcon">{icon}</span>;
  }

  return (
    <>
      {icon && iconPosition === 'Left' && (
        <span className="PdxButtonIcon" aria-hidden="true">
          {icon}
        </span>
      )}
      {content !== undefined && <span>{content}</span>}
      {icon && iconPosition === 'Right' && (
        <span className="PdxButtonIcon" aria-hidden="true">
          {icon}
        </span>
      )}
    </>
  );
}

const PdxButton = forwardRef<HTMLButtonElement, PdxButtonProps>(
  function PdxButton(
    {
      children,
      className,
      dataAttributes,
      disabled = false,
      icon,
      iconOnly = false,
      iconPosition = 'Left',
      loading = false,
      loadingText,
      size = 'Medium',
      text,
      tone = 'Neutral',
      type = 'button',
      variant = 'Secondary',
      ...rest
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        {...rest}
        {...getDataAttributes(dataAttributes)}
        aria-busy={loading || undefined}
        className={getButtonClassName({
          className,
          disabled: isDisabled,
          iconOnly,
          loading,
          size,
          tone,
          variant,
        })}
        disabled={isDisabled}
        ref={ref}
        type={type}
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
      </button>
    );
  }
);

export default PdxButton;

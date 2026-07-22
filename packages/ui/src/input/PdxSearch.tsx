import './PdxSearch.scss';
import {
  assignRef,
  getDataAttributes,
  mergeClassNames,
  type PdxControlSize,
  type PdxNativeProps,
  type PdxValidationState,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import { forwardRef, useCallback, useRef } from 'react';

export interface PdxSearchOwnProps {
  clearLabel?: string;
  defaultValue?: string;
  inputClassName?: string;
  onClear?: () => void;
  onSearch?: (value: string) => void;
  onValueChange?: (value: string) => void;
  size?: PdxControlSize;
  state?: PdxValidationState;
  value?: string;
}

export type PdxSearchProps = Omit<
  PdxNativeProps<'input'>,
  'defaultValue' | 'type' | 'value'
> &
  PdxSearchOwnProps;

const PdxSearch = forwardRef<HTMLInputElement, PdxSearchProps>(
  function PdxSearch(
    {
      'aria-invalid': ariaInvalid,
      className,
      clearLabel = 'Clear search',
      dataAttributes,
      defaultValue = '',
      disabled = false,
      inputClassName,
      onChange,
      onClear,
      onKeyDown,
      onSearch,
      onValueChange,
      placeholder = 'Search…',
      readOnly = false,
      size = 'Medium',
      state = 'Default',
      style,
      value,
      ...rest
    },
    forwardedRef
  ) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [currentValue, setCurrentValue] = useControllableState({
      value,
      defaultValue,
      onChange: onValueChange,
    });
    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        assignRef(forwardedRef, node);
      },
      [forwardedRef]
    );

    return (
      <span
        {...getDataAttributes(dataAttributes)}
        className={mergeClassNames(
          'PdxSearch',
          size,
          state !== 'Default' && state,
          disabled && 'Disabled',
          readOnly && 'ReadOnly',
          currentValue.length > 0 && 'HasValue',
          className
        )}
        style={style}
      >
        <span className="PdxSearchIcon" aria-hidden="true">
          <svg fill="none" height="16" viewBox="0 0 24 24" width="16">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          {...rest}
          aria-invalid={ariaInvalid ?? (state === 'Error' || undefined)}
          className={inputClassName}
          disabled={disabled}
          onChange={(event) => {
            onChange?.(event);
            setCurrentValue(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.defaultPrevented &&
              !event.nativeEvent.isComposing
            ) {
              onSearch?.(currentValue);
            }
            onKeyDown?.(event);
          }}
          placeholder={placeholder}
          readOnly={readOnly}
          ref={setInputRef}
          type="search"
          value={currentValue}
        />
        {currentValue.length > 0 && !disabled && !readOnly && (
          <button
            type="button"
            className="PdxSearchClear"
            aria-label={clearLabel}
            onClick={() => {
              setCurrentValue('');
              onClear?.();
              inputRef.current?.focus();
            }}
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="14"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

export default PdxSearch;

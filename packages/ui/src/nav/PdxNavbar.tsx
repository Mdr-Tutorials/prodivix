import './PdxNavbar.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

export interface PdxNavbarItem {
  label: string;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  target?: React.HTMLAttributeAnchorTarget;
}

interface PdxNavbarSpecificProps {
  brand?: React.ReactNode;
  items?: PdxNavbarItem[];
  actions?: React.ReactNode;
  variant?: 'Solid' | 'Transparent' | 'Blurred';
  size?: 'Small' | 'Medium' | 'Large';
  sticky?: boolean;
  navigationLabel?: string;
  onItemSelect?: (item: PdxNavbarItem, index: number) => void;
  children?: React.ReactNode;
}

export interface PdxNavbarProps extends PdxComponent, PdxNavbarSpecificProps {}

function PdxNavbar({
  brand,
  items = [],
  actions,
  variant = 'Solid',
  size = 'Medium',
  sticky = false,
  navigationLabel,
  onItemSelect,
  children,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
}: PdxNavbarProps) {
  const fullClassName = mergeClassNames(
    'PdxNavbar',
    size,
    variant,
    sticky && 'Sticky',
    children && 'CustomContent',
    className
  );

  return (
    <nav
      aria-label={navigationLabel}
      className={fullClassName}
      id={id}
      onClick={onClick}
      style={style as React.CSSProperties}
      {...getDataAttributes(dataAttributes)}
    >
      {children ? (
        children
      ) : (
        <>
          <div className="PdxNavbarBrand">{brand}</div>
          <ul className="PdxNavbarItems">
            {items.map((item, index) => {
              const itemClassName = mergeClassNames(
                'PdxNavbarItem',
                item.active && 'Active',
                item.disabled && 'Disabled'
              );
              const handleSelect = (
                event: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>
              ) => {
                if (item.disabled) {
                  event.preventDefault();
                  return;
                }
                onItemSelect?.(item, index);
              };

              return (
                <li key={`${item.label}-${index}`}>
                  {item.href ? (
                    <a
                      aria-current={item.active ? 'page' : undefined}
                      aria-disabled={item.disabled || undefined}
                      className={itemClassName}
                      href={item.href}
                      onClick={handleSelect}
                      rel={item.target === '_blank' ? 'noreferrer' : undefined}
                      tabIndex={item.disabled ? -1 : undefined}
                      target={item.target}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      aria-current={item.active ? 'page' : undefined}
                      className={itemClassName}
                      disabled={item.disabled}
                      onClick={handleSelect}
                      type="button"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="PdxNavbarActions">{actions}</div>
        </>
      )}
    </nav>
  );
}

export default PdxNavbar;

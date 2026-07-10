import './PdxSidebar.scss';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

export interface PdxSidebarItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
}

interface PdxSidebarSpecificProps {
  title?: string;
  items?: PdxSidebarItem[];
  footer?: React.ReactNode;
  collapsed?: boolean;
  width?: number;
  children?: React.ReactNode;
  onItemSelect?: (item: PdxSidebarItem) => void;
}

export interface PdxSidebarProps
  extends PdxComponent, PdxSidebarSpecificProps {}

function PdxSidebar({
  title,
  items = [],
  footer,
  collapsed = false,
  width = 240,
  children,
  onItemSelect,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxSidebarProps) {
  const fullClassName =
    `PdxSidebar ${collapsed ? 'Collapsed' : ''} ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <aside
      className={fullClassName}
      {...dataProps}
      id={id}
      style={{
        width: collapsed ? 64 : width,
        ...(style as React.CSSProperties),
      }}
    >
      {title && (
        <div
          aria-label={collapsed ? title : undefined}
          className="PdxSidebarTitle"
          title={collapsed ? title : undefined}
        >
          {collapsed ? title.slice(0, 1) : title}
        </div>
      )}
      {children ? (
        children
      ) : (
        <nav aria-label={title || 'Sidebar'} className="PdxSidebarNav">
          {items.map((item) => (
            <a
              aria-current={item.active ? 'page' : undefined}
              aria-disabled={item.disabled || undefined}
              key={item.label}
              href={item.href || '#'}
              className={`PdxSidebarItem ${item.active ? 'Active' : ''} ${item.disabled ? 'Disabled' : ''}`}
              onClick={(event) => {
                if (!item.href || item.disabled) event.preventDefault();
                if (!item.disabled) onItemSelect?.(item);
              }}
              tabIndex={item.disabled ? -1 : undefined}
              title={collapsed ? item.label : undefined}
            >
              {item.icon ? (
                <span className="PdxSidebarIcon" aria-hidden="true">
                  {item.icon}
                </span>
              ) : collapsed ? (
                <span className="PdxSidebarFallbackIcon" aria-hidden="true">
                  {item.label.slice(0, 1)}
                </span>
              ) : null}
              {!collapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
      )}
      {footer && <div className="PdxSidebarFooter">{footer}</div>}
    </aside>
  );
}

export default PdxSidebar;

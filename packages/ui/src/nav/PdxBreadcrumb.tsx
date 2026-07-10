import './PdxBreadcrumb.scss';
import { type PdxComponent } from '@prodivix/shared';
import { ChevronRight } from 'lucide-react';
import type React from 'react';

export interface PdxBreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PdxBreadcrumbSpecificProps {
  items: PdxBreadcrumbItem[];
  separator?: React.ReactNode;
}

export interface PdxBreadcrumbProps
  extends PdxComponent, PdxBreadcrumbSpecificProps {}

function PdxBreadcrumb({
  items,
  separator = <ChevronRight aria-hidden="true" size={14} strokeWidth={1.8} />,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxBreadcrumbProps) {
  const fullClassName = `PdxBreadcrumb ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <nav
      aria-label="Breadcrumb"
      className={fullClassName}
      {...dataProps}
      id={id}
      style={style as React.CSSProperties}
    >
      <ol className="PdxBreadcrumbList">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;
          return (
            <li key={item.label} className="PdxBreadcrumbItem">
              <span className="PdxBreadcrumbItemContent">
                {item.icon && (
                  <span className="PdxBreadcrumbIcon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                {item.href && !isCurrent ? (
                  <a href={item.href}>{item.label}</a>
                ) : (
                  <span aria-current={isCurrent ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </span>
              {!isCurrent && (
                <span className="PdxBreadcrumbSeparator" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default PdxBreadcrumb;

import './PdxAnchorNavigation.scss';
import { type PdxComponent } from '@prodivix/shared';
import { getDataAttributes } from '../foundation/component';

export interface PdxAnchorItem {
  id: string;
  label: string;
  href?: string;
}

interface PdxAnchorNavigationSpecificProps {
  items: PdxAnchorItem[];
  activeId?: string;
  orientation?: 'Vertical' | 'Horizontal';
  onSelect?: (item: PdxAnchorItem) => void;
}

export interface PdxAnchorNavigationProps
  extends PdxComponent, PdxAnchorNavigationSpecificProps {}

function PdxAnchorNavigation({
  items,
  activeId,
  orientation = 'Vertical',
  onSelect,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxAnchorNavigationProps) {
  const fullClassName =
    `PdxAnchorNavigation ${orientation} ${className || ''}`.trim();
  return (
    <nav
      aria-label="On this page"
      className={fullClassName}
      {...getDataAttributes(dataAttributes)}
      id={id}
      style={style as React.CSSProperties}
    >
      {items.map((item) => (
        <a
          key={item.id}
          aria-current={activeId === item.id ? 'location' : undefined}
          href={item.href || `#${item.id}`}
          className={`PdxAnchorNavigationItem ${activeId === item.id ? 'Active' : ''}`}
          onClick={() => onSelect?.(item)}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

export default PdxAnchorNavigation;

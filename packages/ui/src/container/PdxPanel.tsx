import './PdxPanel.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import { type PdxComponent } from '@prodivix/shared';
import { ChevronDown } from 'lucide-react';
import { useId } from 'react';

interface PdxPanelSpecificProps {
  children: React.ReactNode;
  size?: 'Small' | 'Medium' | 'Large';
  variant?: 'Default' | 'Bordered' | 'Filled';
  padding?: 'None' | 'Small' | 'Medium' | 'Large';
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  title?: string;
}

export interface PdxPanelProps extends PdxComponent, PdxPanelSpecificProps {}

function PdxPanel({
  children,
  size = 'Medium',
  variant = 'Default',
  padding = 'Medium',
  collapsible = false,
  collapsed,
  defaultCollapsed = false,
  onToggle,
  title,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
}: PdxPanelProps) {
  const generatedId = useId().replaceAll(':', '');
  const contentId = `${id ?? `pdx-panel-${generatedId}`}-content`;
  const [isCollapsed, setIsCollapsed] = useControllableState({
    value: collapsed,
    defaultValue: defaultCollapsed,
    onChange: onToggle,
  });

  const handleToggle = () => {
    if (collapsible) setIsCollapsed(!isCollapsed);
  };

  const fullClassName = mergeClassNames(
    'PdxPanel',
    size,
    variant,
    `Padding${padding}`,
    collapsible && 'Collapsible',
    isCollapsed && 'Collapsed',
    className
  );

  return (
    <div
      className={fullClassName}
      id={id}
      onClick={onClick}
      style={style as React.CSSProperties | undefined}
      {...getDataAttributes(dataAttributes)}
    >
      {collapsible && (
        <button
          aria-controls={contentId}
          aria-expanded={!isCollapsed}
          aria-label={title ? undefined : 'Toggle panel'}
          className="PdxPanelHeader PdxPanelHeaderButton"
          onClick={handleToggle}
          type="button"
        >
          {title && <span className="PdxPanelTitle">{title}</span>}
          <ChevronDown
            aria-hidden="true"
            className="PdxPanelToggleIcon"
            size={16}
          />
        </button>
      )}
      {title && !collapsible && (
        <div className="PdxPanelHeader">
          <h3 className="PdxPanelTitle">{title}</h3>
        </div>
      )}
      <div className="PdxPanelContent" hidden={isCollapsed} id={contentId}>
        {children}
      </div>
    </div>
  );
}

export default PdxPanel;

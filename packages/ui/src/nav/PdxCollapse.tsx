import './PdxCollapse.scss';
import {
  getDataAttributes,
  mergeClassNames,
  type PdxNativeProps,
} from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import { ChevronDown } from 'lucide-react';
import { forwardRef, useId, type ReactNode } from 'react';

export interface PdxCollapseItem {
  content: ReactNode;
  disabled?: boolean;
  key: string;
  title: ReactNode;
}

export interface PdxCollapseOwnProps {
  accordion?: boolean;
  activeKeys?: string[];
  defaultActiveKeys?: string[];
  items: PdxCollapseItem[];
  keepMounted?: boolean;
  onExpandedKeysChange?: (keys: string[]) => void;
}

export type PdxCollapseProps = Omit<PdxNativeProps<'div'>, 'children'> &
  PdxCollapseOwnProps;

const PdxCollapse = forwardRef<HTMLDivElement, PdxCollapseProps>(
  function PdxCollapse(
    {
      accordion = false,
      activeKeys,
      className,
      dataAttributes,
      defaultActiveKeys = [],
      items,
      keepMounted = false,
      onExpandedKeysChange,
      ...rest
    },
    ref
  ) {
    const baseId = useId();
    const [expandedKeys, setExpandedKeys] = useControllableState({
      value: activeKeys,
      defaultValue: accordion
        ? defaultActiveKeys.slice(0, 1)
        : defaultActiveKeys,
      onChange: onExpandedKeysChange,
    });

    const toggleKey = (key: string) => {
      const nextKeys = accordion
        ? expandedKeys.includes(key)
          ? []
          : [key]
        : expandedKeys.includes(key)
          ? expandedKeys.filter((item) => item !== key)
          : [...expandedKeys, key];
      setExpandedKeys(nextKeys);
    };

    return (
      <div
        {...rest}
        {...getDataAttributes(dataAttributes)}
        className={mergeClassNames('PdxCollapse', className)}
        ref={ref}
      >
        {items.map((item, index) => {
          const isOpen = expandedKeys.includes(item.key);
          const triggerId = `${baseId}-trigger-${index}`;
          const panelId = `${baseId}-panel-${index}`;
          return (
            <section
              className={mergeClassNames('PdxCollapseItem', isOpen && 'Open')}
              key={item.key}
            >
              <h3 className="PdxCollapseHeading">
                <button
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  className="PdxCollapseTrigger"
                  disabled={item.disabled}
                  id={triggerId}
                  onClick={() => toggleKey(item.key)}
                  type="button"
                >
                  <span>{item.title}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="PdxCollapseIcon"
                    size={16}
                  />
                </button>
              </h3>
              {isOpen || keepMounted ? (
                <div
                  aria-labelledby={triggerId}
                  className="PdxCollapsePanel"
                  hidden={!isOpen}
                  id={panelId}
                  role="region"
                >
                  <div className="PdxCollapseContent">{item.content}</div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    );
  }
);

export default PdxCollapse;

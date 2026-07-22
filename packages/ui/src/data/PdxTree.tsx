import './PdxTree.scss';
import { type PdxComponent } from '@prodivix/shared';
import { getDataAttributes } from '../foundation/component';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type React from 'react';

export interface PdxTreeNode {
  id: string;
  label: string;
  children?: PdxTreeNode[];
  disabled?: boolean;
}

interface PdxTreeSpecificProps {
  data: PdxTreeNode[];
  expandedKeys?: string[];
  defaultExpandedKeys?: string[];
  selectedKey?: string;
  onToggle?: (keys: string[]) => void;
  onSelect?: (node: PdxTreeNode) => void;
}

export interface PdxTreeProps extends PdxComponent, PdxTreeSpecificProps {}

function PdxTree({
  data,
  expandedKeys,
  defaultExpandedKeys,
  selectedKey,
  onToggle,
  onSelect,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxTreeProps) {
  const [internalExpanded, setInternalExpanded] = useState<string[]>(
    defaultExpandedKeys || []
  );

  useEffect(() => {
    if (expandedKeys) {
      setInternalExpanded(expandedKeys);
    }
  }, [expandedKeys]);

  const currentExpanded = expandedKeys ?? internalExpanded;
  const expandedSet = useMemo(
    () => new Set(currentExpanded),
    [currentExpanded]
  );

  const toggleNode = (nodeId: string) => {
    const nextExpanded = expandedSet.has(nodeId)
      ? currentExpanded.filter((key) => key !== nodeId)
      : [...currentExpanded, nodeId];

    if (expandedKeys === undefined) {
      setInternalExpanded(nextExpanded);
    }
    if (onToggle) {
      onToggle(nextExpanded);
    }
  };

  const handleSelect = (node: PdxTreeNode) => {
    if (node.disabled) return;
    if (onSelect) {
      onSelect(node);
    }
  };

  const renderNodes = (nodes: PdxTreeNode[], depth: number) => {
    return nodes.map((node) => {
      const hasChildren = !!node.children?.length;
      const isExpanded = expandedSet.has(node.id);
      return (
        <div key={node.id} className="PdxTreeNode">
          <div
            className={`PdxTreeRow ${selectedKey === node.id ? 'Selected' : ''} ${node.disabled ? 'Disabled' : ''}`}
            style={{ paddingLeft: depth * 16 }}
          >
            {hasChildren ? (
              <button
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.label}`}
                className="PdxTreeToggle"
                onClick={() => toggleNode(node.id)}
                type="button"
              >
                {isExpanded ? (
                  <ChevronDown aria-hidden="true" size={15} />
                ) : (
                  <ChevronRight aria-hidden="true" size={15} />
                )}
              </button>
            ) : (
              <span className="PdxTreeSpacer" />
            )}
            <button
              aria-selected={selectedKey === node.id}
              className="PdxTreeLabel"
              disabled={node.disabled}
              onClick={() => handleSelect(node)}
              role="treeitem"
              type="button"
            >
              {node.label}
            </button>
          </div>
          {hasChildren && isExpanded && (
            <div className="PdxTreeChildren" role="group">
              {renderNodes(node.children || [], depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const fullClassName = `PdxTree ${className || ''}`.trim();
  const dataProps = getDataAttributes(dataAttributes);

  return (
    <div
      className={fullClassName}
      {...dataProps}
      id={id}
      role="tree"
      style={style as React.CSSProperties}
    >
      {renderNodes(data, 0)}
    </div>
  );
}

export default PdxTree;

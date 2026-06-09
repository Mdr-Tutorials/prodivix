import { Plus } from 'lucide-react';
import {
  normalizeCases,
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import {
  BranchListEditor,
  buildNodeContainerClass,
  NODE_ICON_BUTTON_CLASS,
  NodeHeader,
} from './nodePrimitives';
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

export const renderSwitchGraphNode = ({ id, nodeData, selected, t }: Props) => {
  const cases = normalizeCases(nodeData.cases);
  const isCollapsed = Boolean(nodeData.collapsed);
  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[220px]')}>
      {isCollapsed ? (
        <>
          {renderTarget(
            id,
            'in.control.prev',
            'control',
            resolveMultiplicity('target', 'control'),
            '25%',
            nodeData.onPortContextMenu
          )}
          {renderTarget(
            id,
            'in.data.value',
            'data',
            resolveMultiplicity('target', 'data'),
            '50%',
            nodeData.onPortContextMenu
          )}
          {cases.map((caseItem) => (
            <div
              key={`collapsed-left-condition-${caseItem.id}`}
              className="contents"
            >
              {renderTarget(
                id,
                `in.condition.case-${caseItem.id}`,
                'condition',
                resolveMultiplicity('target', 'condition'),
                '75%',
                nodeData.onPortContextMenu
              )}
            </div>
          ))}
        </>
      ) : null}
      <NodeHeader
        title={nodeData.label}
        collapsed={isCollapsed}
        onToggleCollapse={() => nodeData.onToggleCollapse?.(id)}
        collapseAriaLabel={
          isCollapsed
            ? tNode(t, 'common.aria.expandKind', 'expand {{kind}}', {
                kind: nodeData.label,
              })
            : tNode(t, 'common.aria.collapseKind', 'collapse {{kind}}', {
                kind: nodeData.label,
              })
        }
        leftSlot={
          isCollapsed
            ? null
            : renderTarget(
                id,
                'in.control.prev',
                'control',
                resolveMultiplicity('target', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
        }
        actions={
          <button
            type="button"
            className={NODE_ICON_BUTTON_CLASS}
            onClick={(event) => {
              event.stopPropagation();
              nodeData.onAddCase?.(id);
            }}
            aria-label={tNode(t, 'switch.aria.addCase', 'add case')}
          >
            <Plus size={14} />
          </button>
        }
      />
      {isCollapsed ? (
        <div className="relative flex min-h-7 items-center px-4 pb-2 text-[11px] font-normal text-(--nodegraph-muted-text)">
          <span>
            {tNode(t, 'switch.caseCount', '{{count}} cases', {
              count: cases.length,
            })}
          </span>
          {cases.map((caseItem) => (
            <div key={`collapsed-output-${caseItem.id}`} className="contents">
              {renderSource(
                id,
                `out.control.case-${caseItem.id}`,
                'control',
                resolveMultiplicity('source', 'control'),
                '82%',
                nodeData.onPortContextMenu
              )}
            </div>
          ))}
          {renderSource(
            id,
            'out.control.default',
            'control',
            resolveMultiplicity('source', 'control'),
            '82%',
            nodeData.onPortContextMenu
          )}
        </div>
      ) : (
        <div className="pb-2">
          <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-(--nodegraph-muted-text)">
            {renderTarget(
              id,
              'in.data.value',
              'data',
              resolveMultiplicity('target', 'data'),
              undefined,
              nodeData.onPortContextMenu
            )}
            <span>{tNode(t, 'switch.rows.switchValue', 'switch value')}</span>
          </div>
          <BranchListEditor
            t={t}
            items={cases}
            onRemove={(branchId) => nodeData.onRemoveCase?.(id, branchId)}
            onChangeLabel={
              nodeData.onChangeBranchLabel
                ? (branchId, label) =>
                    nodeData.onChangeBranchLabel?.(id, branchId, label)
                : undefined
            }
            renderStart={(caseItem) =>
              renderTarget(
                id,
                `in.condition.case-${caseItem.id}`,
                'condition',
                resolveMultiplicity('target', 'condition'),
                undefined,
                nodeData.onPortContextMenu
              )
            }
            renderEnd={(caseItem) =>
              renderSource(
                id,
                `out.control.case-${caseItem.id}`,
                'control',
                resolveMultiplicity('source', 'control'),
                undefined,
                nodeData.onPortContextMenu
              )
            }
          />
          <div className="relative flex min-h-7 items-center gap-2 px-4 text-[11px] font-normal text-(--nodegraph-text)">
            <span>{tNode(t, 'common.rows.default', 'default')}</span>
            {renderSource(
              id,
              'out.control.default',
              'control',
              resolveMultiplicity('source', 'control'),
              undefined,
              nodeData.onPortContextMenu
            )}
          </div>
        </div>
      )}
    </div>
  );
};

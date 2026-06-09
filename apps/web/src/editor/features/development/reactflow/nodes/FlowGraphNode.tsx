import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
} from '@/editor/features/development/reactflow/graphNodeShared';
import { getNodePortHandle } from '@/editor/features/development/reactflow/nodeCatalog';
import { buildNodeContainerClass } from './nodePrimitives';
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

export const renderFlowGraphNode = ({ id, nodeData, selected, t }: Props) => {
  const rows = [
    {
      semantic: 'control' as const,
      inHandle: getNodePortHandle(nodeData.kind, 'in', 'control'),
      outHandle: getNodePortHandle(nodeData.kind, 'out', 'control'),
    },
    {
      semantic: 'data' as const,
      inHandle: getNodePortHandle(nodeData.kind, 'in', 'data'),
      outHandle: getNodePortHandle(nodeData.kind, 'out', 'data'),
    },
    {
      semantic: 'condition' as const,
      inHandle: getNodePortHandle(nodeData.kind, 'in', 'condition'),
      outHandle: getNodePortHandle(nodeData.kind, 'out', 'condition'),
    },
  ].filter((row) => row.inHandle || row.outHandle);

  return (
    <div className={buildNodeContainerClass(selected, 'min-w-[200px]')}>
      <div className="px-4 pt-2.5 pb-2 text-[13px] font-medium tracking-[0.01em] text-(--nodegraph-strong-text)">
        {nodeData.label}
      </div>
      <div className="pb-2">
        {rows.map((row) => (
          <div
            key={`${nodeData.kind}-${row.semantic}`}
            className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-(--nodegraph-text)"
          >
            {row.inHandle
              ? renderTarget(
                  id,
                  row.inHandle,
                  row.semantic,
                  resolveMultiplicity('target', row.semantic),
                  undefined,
                  nodeData.onPortContextMenu
                )
              : null}
            <span>
              {rows.length === 1
                ? nodeData.label
                : tNode(t, `common.semantic.${row.semantic}`, row.semantic)}
            </span>
            {row.outHandle
              ? renderSource(
                  id,
                  row.outHandle,
                  row.semantic,
                  resolveMultiplicity('source', row.semantic),
                  undefined,
                  nodeData.onPortContextMenu
                )
              : null}
          </div>
        ))}
      </div>
    </div>
  );
};

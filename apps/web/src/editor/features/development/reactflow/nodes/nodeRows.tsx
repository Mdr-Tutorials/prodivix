import {
  renderSource,
  renderTarget,
  resolveMultiplicity,
  type GraphNodeData,
  type PortSemantic,
} from '@/editor/features/development/reactflow/graphNodeShared';

type NodeRowOptions = {
  inHandle?: string | null;
  outHandle?: string | null;
  inSemantic?: PortSemantic;
  outSemantic?: PortSemantic;
};

export const renderNodeRow = (
  id: string,
  nodeData: GraphNodeData,
  label: string,
  options: NodeRowOptions = {}
) => {
  const inSemantic = options.inSemantic ?? 'control';
  const outSemantic = options.outSemantic ?? 'control';
  return (
    <div className="relative flex min-h-7 items-center px-4 text-[11px] font-normal text-(--nodegraph-text)">
      {options.inHandle
        ? renderTarget(
            id,
            options.inHandle,
            inSemantic,
            resolveMultiplicity('target', inSemantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
      <span>{label}</span>
      {options.outHandle
        ? renderSource(
            id,
            options.outHandle,
            outSemantic,
            resolveMultiplicity('source', outSemantic),
            undefined,
            nodeData.onPortContextMenu
          )
        : null}
    </div>
  );
};

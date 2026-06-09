import type { GraphNodeData } from '@/editor/features/development/reactflow/graphNodeShared';
import { StickyNoteEditor } from './StickyNoteEditor';
import type { NodeI18n } from './nodeI18n';
import { tNode } from './nodeI18n';

type Props = {
  id: string;
  nodeData: GraphNodeData;
  selected: boolean;
  t: NodeI18n;
};

const parseSize = (
  value: string | number | undefined,
  fallback: number,
  min: number,
  max: number
) => {
  const parsed =
    typeof value === 'number'
      ? value
      : Number.parseInt(typeof value === 'string' ? value : '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const GROUP_COLOR_THEMES: Record<
  string,
  { border: string; bg: string; headerBg: string; text: string }
> = {
  minimal: {
    border: 'border-(--nodegraph-node-border-strong)',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-(--nodegraph-text)',
  },
  mono: {
    border: 'border-(--nodegraph-node-border)',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-(--nodegraph-strong-text)',
  },
  slate: {
    border: 'border-(--nodegraph-node-border-strong)',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-(--nodegraph-strong-text)',
  },
  cyan: {
    border: 'border-(--nodegraph-info)',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-(--nodegraph-info)',
  },
  amber: {
    border: 'border-(--nodegraph-warning)',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-(--nodegraph-warning)',
  },
  rose: {
    border: 'border-(--nodegraph-danger)',
    bg: 'bg-transparent',
    headerBg: 'bg-transparent',
    text: 'text-(--nodegraph-danger)',
  },
};

export const renderAnnotationGraphNode = ({
  id,
  nodeData,
  selected,
  t,
}: Props) => {
  if (nodeData.kind === 'groupBox') {
    const themeKey = nodeData.color || 'minimal';
    const width = parseSize(
      nodeData.autoBoxWidth ?? nodeData.boxWidth,
      360,
      220,
      1800
    );
    const height = parseSize(
      nodeData.autoBoxHeight ?? nodeData.boxHeight,
      220,
      140,
      1400
    );
    const theme = GROUP_COLOR_THEMES[themeKey] || GROUP_COLOR_THEMES.minimal;
    const isMinimalTheme = themeKey === 'minimal';
    return (
      <div
        className={
          isMinimalTheme
            ? `relative overflow-hidden rounded-xl border ${theme.border} ${theme.bg} ${
                selected ? 'ring-1 ring-(--nodegraph-selection-ring)' : ''
              }`
            : `relative overflow-hidden rounded-xl border-2 border-dashed ${theme.border} ${theme.bg} ${
                selected ? 'ring-1 ring-(--nodegraph-selection-ring)' : ''
              }`
        }
        style={{ width, height }}
      >
        <div
          className={`nodrag nopan flex items-center gap-1 px-2 py-1 ${theme.headerBg} ${
            isMinimalTheme
              ? 'border-b border-(--nodegraph-node-border-strong)'
              : 'border-b border-dashed'
          }`}
        >
          <input
            className={`h-6 min-w-0 flex-1 px-2 text-[11px] font-medium outline-none ${
              isMinimalTheme
                ? 'rounded-none border-none bg-transparent text-(--nodegraph-strong-text)'
                : 'rounded border border-(--nodegraph-node-border) bg-(--nodegraph-node-bg-translucent) text-(--nodegraph-strong-text) focus:border-(--nodegraph-node-border-strong)'
            }`}
            value={nodeData.value ?? ''}
            onChange={(event) =>
              nodeData.onChangeField?.(id, 'value', event.target.value)
            }
            placeholder={tNode(
              t,
              'annotation.groupBox.titlePlaceholder',
              'Group title'
            )}
            spellCheck={false}
          />
        </div>
        {isMinimalTheme ? null : (
          <div
            className={`pointer-events-none px-3 py-2 text-xl font-semibold ${theme.text}`}
          >
            {nodeData.value?.trim() || ''}
          </div>
        )}
      </div>
    );
  }

  if (nodeData.kind === 'stickyNote')
    return (
      <StickyNoteEditor id={id} nodeData={nodeData} selected={selected} t={t} />
    );

  return null;
};

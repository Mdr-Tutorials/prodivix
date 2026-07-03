import { layoutIconDefaults, type LayoutIconProps } from '../iconProps';

type Axis = 'x' | 'y';
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Content =
  'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' | 'stretch';

function GridIconFrame({ children, ...props }: LayoutIconProps) {
  return (
    <svg {...layoutIconDefaults} {...props}>
      {children}
    </svg>
  );
}

function GridLines() {
  return (
    <>
      <rect x="3" y="3" width="18" height="18" rx="1.5" strokeWidth="1" />
      <line x1="9" y1="3" x2="9" y2="21" strokeWidth="1" />
      <line x1="15" y1="3" x2="15" y2="21" strokeWidth="1" />
      <line x1="3" y1="9" x2="21" y2="9" strokeWidth="1" />
      <line x1="3" y1="15" x2="21" y2="15" strokeWidth="1" />
    </>
  );
}

function CellBlock({
  x,
  y,
  w = 3.5,
  h = 3.5,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
}) {
  return <rect x={x} y={y} width={w} height={h} rx="0.7" strokeWidth="1" />;
}

function GridFlowIcon({
  axis,
  dense = false,
  ...props
}: LayoutIconProps & { axis: Axis; dense?: boolean }) {
  const cells =
    axis === 'x'
      ? [
          [4.25, 4.25],
          [10.25, 4.25],
          [16.25, 4.25],
          [4.25, 10.25],
        ]
      : [
          [4.25, 4.25],
          [4.25, 10.25],
          [4.25, 16.25],
          [10.25, 4.25],
        ];

  return (
    <GridIconFrame {...props}>
      <GridLines />
      {cells.map(([x, y]) => (
        <CellBlock key={`${x}-${y}`} x={x} y={y} />
      ))}
      {dense ? (
        <>
          <CellBlock x={16.5} y={10.5} w={2.4} h={2.4} />
          <path
            d={
              axis === 'x'
                ? 'M14 12h3.8l-1.2-1.2M17.8 12l-1.2 1.2'
                : 'M12 14v3.8l-1.2-1.2M12 17.8l1.2-1.2'
            }
            strokeWidth="1"
          />
        </>
      ) : (
        <path
          d={
            axis === 'x'
              ? 'M16 19h4l-1.4-1.4M20 19l-1.4 1.4'
              : 'M19 16v4l-1.4-1.4M19 20l1.4-1.4'
          }
          strokeWidth="1"
        />
      )}
    </GridIconFrame>
  );
}

function GridItemsIcon({
  axis,
  align,
  ...props
}: LayoutIconProps & { axis: Axis; align: Align }) {
  const cell = { x: 5, y: 5, size: 14 };
  const itemLength = align === 'stretch' ? 10 : 5;
  const itemCross = 4;
  const inlineStart =
    align === 'start'
      ? cell.x + 2
      : align === 'center'
        ? 12 - itemLength / 2
        : align === 'end'
          ? cell.x + cell.size - itemLength - 2
          : cell.x + 2;
  const blockStart =
    align === 'start'
      ? cell.y + 2
      : align === 'center'
        ? 12 - itemLength / 2
        : align === 'end'
          ? cell.y + cell.size - itemLength - 2
          : cell.y + 2;
  const rect =
    axis === 'x'
      ? { x: inlineStart, y: 10, w: itemLength, h: itemCross }
      : {
          x: 10,
          y: align === 'baseline' ? 12 : blockStart,
          w: itemCross,
          h: align === 'baseline' ? 5 : itemLength,
        };

  return (
    <GridIconFrame {...props}>
      <rect x="3" y="3" width="18" height="18" rx="1.5" strokeWidth="1" />
      <rect
        x={cell.x}
        y={cell.y}
        width={cell.size}
        height={cell.size}
        rx="1"
        strokeWidth="1"
      />
      {align === 'baseline' ? (
        <line
          x1="7"
          y1="17"
          x2="17"
          y2="17"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      ) : null}
      {(align === 'start' || align === 'end' || align === 'center') &&
      axis === 'x' ? (
        <line
          x1={align === 'center' ? 12 : align === 'start' ? 7 : 17}
          y1="7"
          x2={align === 'center' ? 12 : align === 'start' ? 7 : 17}
          y2="17"
          strokeWidth="1"
        />
      ) : null}
      {(align === 'start' || align === 'end' || align === 'center') &&
      axis === 'y' ? (
        <line
          x1="7"
          y1={align === 'center' ? 12 : align === 'start' ? 7 : 17}
          x2="17"
          y2={align === 'center' ? 12 : align === 'start' ? 7 : 17}
          strokeWidth="1"
        />
      ) : null}
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx="1"
        strokeWidth="1"
      />
    </GridIconFrame>
  );
}

function contentOffsets(content: Content, axis: Axis) {
  if (content === 'start')
    return axis === 'x' ? { x: 5, y: 8 } : { x: 8, y: 5 };
  if (content === 'center') return { x: 8, y: 8 };
  if (content === 'end')
    return axis === 'x' ? { x: 11, y: 8 } : { x: 8, y: 11 };
  return { x: 8, y: 8 };
}

function MiniGrid({
  x,
  y,
  stretchX = false,
  stretchY = false,
}: {
  x: number;
  y: number;
  stretchX?: boolean;
  stretchY?: boolean;
}) {
  const w = stretchX ? 14 : 8;
  const h = stretchY ? 14 : 8;

  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1" strokeWidth="1" />
      <line
        x1={x + w / 2}
        y1={y + 1}
        x2={x + w / 2}
        y2={y + h - 1}
        strokeWidth="1"
      />
      <line
        x1={x + 1}
        y1={y + h / 2}
        x2={x + w - 1}
        y2={y + h / 2}
        strokeWidth="1"
      />
    </g>
  );
}

function GridContentIcon({
  axis,
  content,
  ...props
}: LayoutIconProps & { axis: Axis; content: Content }) {
  const offset = contentOffsets(content, axis);
  const isDistributed = ['between', 'around', 'evenly'].includes(content);
  const isStretch = content === 'stretch';
  const distribution = {
    between: [5.2, 12, 18.8],
    around: [6.2, 12, 17.8],
    evenly: [7, 12, 17],
  };

  return (
    <GridIconFrame {...props}>
      <rect x="3" y="3" width="18" height="18" rx="1.5" strokeWidth="1" />
      {isDistributed ? (
        (distribution[content as 'between' | 'around' | 'evenly'] ?? []).map(
          (pos) =>
            axis === 'x' ? (
              <rect
                key={pos}
                x={pos - 1.25}
                y="8"
                width="2.5"
                height="8"
                rx="1.25"
                strokeWidth="1"
              />
            ) : (
              <rect
                key={pos}
                x="8"
                y={pos - 1.25}
                width="8"
                height="2.5"
                rx="1.25"
                strokeWidth="1"
              />
            )
        )
      ) : (
        <MiniGrid
          x={isStretch && axis === 'x' ? 5 : offset.x}
          y={isStretch && axis === 'y' ? 5 : offset.y}
          stretchX={isStretch && axis === 'x'}
          stretchY={isStretch && axis === 'y'}
        />
      )}
    </GridIconFrame>
  );
}

export const GridAutoFlowFieldIcon = (props: LayoutIconProps) => (
  <GridIconFrame {...props}>
    <rect x="5" y="5" width="5" height="5" rx="0.8" strokeWidth="1" />
    <rect x="14" y="5" width="5" height="5" rx="0.8" strokeWidth="1" />
    <rect x="5" y="14" width="5" height="5" rx="0.8" strokeWidth="1" />
    <path d="M10.8 7.5h2.4M16.5 10.8v2.4" strokeWidth="1" />
  </GridIconFrame>
);

export const GridJustifyItemsFieldIcon = (props: LayoutIconProps) => (
  <GridIconFrame {...props}>
    <rect x="5" y="6" width="14" height="12" rx="1.4" strokeWidth="1" />
    <line x1="12" y1="8" x2="12" y2="16" strokeWidth="1" />
    <rect x="9.5" y="10" width="5" height="4" rx="1" strokeWidth="1" />
  </GridIconFrame>
);

export const GridAlignItemsFieldIcon = (props: LayoutIconProps) => (
  <GridIconFrame {...props}>
    <rect x="6" y="5" width="12" height="14" rx="1.4" strokeWidth="1" />
    <line x1="8" y1="12" x2="16" y2="12" strokeWidth="1" />
    <rect x="10" y="9.5" width="4" height="5" rx="1" strokeWidth="1" />
  </GridIconFrame>
);

export const GridJustifyContentFieldIcon = (props: LayoutIconProps) => (
  <GridIconFrame {...props}>
    <rect x="5" y="6" width="14" height="12" rx="1.4" strokeWidth="1" />
    <line x1="8" y1="8" x2="8" y2="16" strokeWidth="1" />
    <line x1="16" y1="8" x2="16" y2="16" strokeWidth="1" />
    <rect x="10" y="9.5" width="4" height="5" rx="0.9" strokeWidth="1" />
  </GridIconFrame>
);

export const GridAlignContentFieldIcon = (props: LayoutIconProps) => (
  <GridIconFrame {...props}>
    <rect x="6" y="5" width="12" height="14" rx="1.4" strokeWidth="1" />
    <line x1="8" y1="8" x2="16" y2="8" strokeWidth="1" />
    <line x1="8" y1="16" x2="16" y2="16" strokeWidth="1" />
    <rect x="9.5" y="10" width="5" height="4" rx="0.9" strokeWidth="1" />
  </GridIconFrame>
);

export const GridFlowRowIcon = (props: LayoutIconProps) => (
  <GridFlowIcon axis="x" {...props} />
);
export const GridFlowColumnIcon = (props: LayoutIconProps) => (
  <GridFlowIcon axis="y" {...props} />
);
export const GridFlowRowDenseIcon = (props: LayoutIconProps) => (
  <GridFlowIcon axis="x" dense {...props} />
);
export const GridFlowColumnDenseIcon = (props: LayoutIconProps) => (
  <GridFlowIcon axis="y" dense {...props} />
);

export const GridJustifyItemsStartIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="x" align="start" {...props} />
);
export const GridJustifyItemsCenterIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="x" align="center" {...props} />
);
export const GridJustifyItemsEndIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="x" align="end" {...props} />
);
export const GridJustifyItemsStretchIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="x" align="stretch" {...props} />
);
export const GridAlignItemsStartIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="y" align="start" {...props} />
);
export const GridAlignItemsCenterIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="y" align="center" {...props} />
);
export const GridAlignItemsEndIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="y" align="end" {...props} />
);
export const GridAlignItemsStretchIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="y" align="stretch" {...props} />
);
export const GridAlignItemsBaselineIcon = (props: LayoutIconProps) => (
  <GridItemsIcon axis="y" align="baseline" {...props} />
);

export const GridJustifyContentStartIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="start" {...props} />
);
export const GridJustifyContentCenterIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="center" {...props} />
);
export const GridJustifyContentEndIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="end" {...props} />
);
export const GridJustifyContentBetweenIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="between" {...props} />
);
export const GridJustifyContentAroundIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="around" {...props} />
);
export const GridJustifyContentEvenlyIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="evenly" {...props} />
);
export const GridJustifyContentStretchIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="x" content="stretch" {...props} />
);
export const GridAlignContentStartIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="start" {...props} />
);
export const GridAlignContentCenterIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="center" {...props} />
);
export const GridAlignContentEndIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="end" {...props} />
);
export const GridAlignContentBetweenIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="between" {...props} />
);
export const GridAlignContentAroundIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="around" {...props} />
);
export const GridAlignContentEvenlyIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="evenly" {...props} />
);
export const GridAlignContentStretchIcon = (props: LayoutIconProps) => (
  <GridContentIcon axis="y" content="stretch" {...props} />
);

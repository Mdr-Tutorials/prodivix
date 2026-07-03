import type React from 'react';
import { layoutIconDefaults, type LayoutIconProps } from '../iconProps';

type Axis = 'x' | 'y';
type Distribution =
  'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type Alignment = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Direction = 'row' | 'row-reverse' | 'column' | 'column-reverse';

type Pill = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function FlexIcon({ children, ...props }: LayoutIconProps) {
  return (
    <svg {...layoutIconDefaults} viewBox="0 0 24 24" {...props}>
      {children}
    </svg>
  );
}

function AxisTransform({
  axis,
  children,
}: {
  axis: Axis;
  children: React.ReactNode;
}) {
  return axis === 'x' ? (
    <>{children}</>
  ) : (
    <g transform="rotate(90 12 12)">{children}</g>
  );
}

function PillRect({ x, y, w, h }: Pill) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={Math.min(w, h) / 2}
      strokeWidth="1"
    />
  );
}

function FlexDirectionIcon({
  flexDirection,
  ...props
}: Omit<LayoutIconProps, 'direction'> & { flexDirection: Direction }) {
  const isColumn =
    flexDirection === 'column' || flexDirection === 'column-reverse';
  const isReverse =
    flexDirection === 'row-reverse' || flexDirection === 'column-reverse';

  return (
    <FlexIcon {...props}>
      <AxisTransform axis={isColumn ? 'y' : 'x'}>
        <line
          x1={isReverse ? 18.5 : 5.5}
          y1="12"
          x2={isReverse ? 5.5 : 18.5}
          y2="12"
          strokeWidth="1"
        />
        <path
          d={
            isReverse
              ? 'M5.5 12 8.4 9.8M5.5 12 8.4 14.2'
              : 'M18.5 12 15.6 9.8M18.5 12 15.6 14.2'
          }
          strokeWidth="1"
        />
      </AxisTransform>
    </FlexIcon>
  );
}

function justifyPills(distribution: Distribution): Pill[] {
  const short = { w: 3, h: 8 };
  const long = { w: 3, h: 10 };
  const centered = (center: number, pill: { w: number; h: number }) => ({
    x: center - pill.w / 2,
    y: 12 - pill.h / 2,
    ...pill,
  });

  switch (distribution) {
    case 'start':
      return [centered(6.5, short), centered(10.5, long)];
    case 'center':
      return [centered(10, short), centered(14, long)];
    case 'end':
      return [centered(13.5, short), centered(17.5, long)];
    case 'between':
      return [centered(5.5, short), centered(18.5, long)];
    case 'around':
      return [centered(7, short), centered(17, long)];
    case 'evenly':
      return [centered(8.5, short), centered(15.5, long)];
  }
}

function JustifyIcon({
  axis,
  distribution,
  ...props
}: LayoutIconProps & { axis: Axis; distribution: Distribution }) {
  return (
    <FlexIcon {...props}>
      <AxisTransform axis={axis}>
        <line x1="4" y1="12" x2="20" y2="12" strokeWidth="1" />
        {justifyPills(distribution).map((pill, index) => (
          <PillRect key={index} {...pill} />
        ))}
      </AxisTransform>
    </FlexIcon>
  );
}

function alignPills(alignment: Alignment): Pill[] {
  if (alignment === 'stretch') {
    return [
      { x: 7, y: 6.5, w: 3, h: 11 },
      { x: 14, y: 6.5, w: 3, h: 11 },
    ];
  }

  const tallHeight = 10;
  const shortHeight = 6;
  const yFor = (height: number) => {
    if (alignment === 'start') return 6.5;
    if (alignment === 'center') return 12 - height / 2;
    if (alignment === 'end') return 17.5 - height;
    return 16 - height;
  };

  return [
    { x: 7, y: yFor(shortHeight), w: 3, h: shortHeight },
    { x: 14, y: yFor(tallHeight), w: 3, h: tallHeight },
  ];
}

function AlignIcon({
  axis,
  alignment,
  ...props
}: LayoutIconProps & { axis: Axis; alignment: Alignment }) {
  return (
    <FlexIcon {...props}>
      <AxisTransform axis={axis}>
        <line x1="5" y1="6" x2="19" y2="6" strokeWidth="1" />
        <line x1="5" y1="18" x2="19" y2="18" strokeWidth="1" />
        {alignment === 'baseline' ? (
          <line
            x1="5.4"
            y1="16"
            x2="18.6"
            y2="16"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        ) : null}
        {alignPills(alignment).map((pill, index) => (
          <PillRect key={index} {...pill} />
        ))}
      </AxisTransform>
    </FlexIcon>
  );
}

export const FlexDirectionFieldIcon = (props: LayoutIconProps) => (
  <FlexIcon {...props}>
    <path
      d="M12 5v14M12 5l-2 2M12 5l2 2M12 19l-2-2M12 19l2-2"
      strokeWidth="1"
    />
    <path
      d="M5 12h14M5 12l2-2M5 12l2 2M19 12l-2-2M19 12l-2 2"
      strokeWidth="1"
    />
  </FlexIcon>
);

export const FlexJustifyFieldIcon = (props: LayoutIconProps) => (
  <FlexIcon {...props}>
    <line x1="5" y1="12" x2="19" y2="12" strokeWidth="1" />
    <line x1="5" y1="9" x2="5" y2="15" strokeWidth="1" />
    <line x1="19" y1="9" x2="19" y2="15" strokeWidth="1" />
    <rect x="10.5" y="8" width="3" height="8" rx="1.5" strokeWidth="1" />
  </FlexIcon>
);

export const FlexAlignFieldIcon = (props: LayoutIconProps) => (
  <FlexIcon {...props}>
    <line x1="6" y1="7" x2="18" y2="7" strokeWidth="1" />
    <line x1="6" y1="17" x2="18" y2="17" strokeWidth="1" />
    <line x1="12" y1="7" x2="12" y2="17" strokeWidth="1" />
    <path d="M10 12h4" strokeWidth="1" />
  </FlexIcon>
);

export const FlexRowIcon = (props: LayoutIconProps) => (
  <FlexDirectionIcon flexDirection="row" {...props} />
);
export const FlexRowReverseIcon = (props: LayoutIconProps) => (
  <FlexDirectionIcon flexDirection="row-reverse" {...props} />
);
export const FlexColumnIcon = (props: LayoutIconProps) => (
  <FlexDirectionIcon flexDirection="column" {...props} />
);
export const FlexColumnReverseIcon = (props: LayoutIconProps) => (
  <FlexDirectionIcon flexDirection="column-reverse" {...props} />
);

export const JustifyStartIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="x" distribution="start" {...props} />
);
export const JustifyCenterIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="x" distribution="center" {...props} />
);
export const JustifyEndIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="x" distribution="end" {...props} />
);
export const JustifySpaceBetweenIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="x" distribution="between" {...props} />
);
export const JustifySpaceAroundIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="x" distribution="around" {...props} />
);
export const JustifySpaceEvenlyIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="x" distribution="evenly" {...props} />
);
export const JustifyStartColumnIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="y" distribution="start" {...props} />
);
export const JustifyCenterColumnIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="y" distribution="center" {...props} />
);
export const JustifyEndColumnIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="y" distribution="end" {...props} />
);
export const JustifySpaceBetweenColumnIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="y" distribution="between" {...props} />
);
export const JustifySpaceAroundColumnIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="y" distribution="around" {...props} />
);
export const JustifySpaceEvenlyColumnIcon = (props: LayoutIconProps) => (
  <JustifyIcon axis="y" distribution="evenly" {...props} />
);

export const AlignStartIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="x" alignment="start" {...props} />
);
export const AlignCenterIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="x" alignment="center" {...props} />
);
export const AlignEndIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="x" alignment="end" {...props} />
);
export const AlignStretchIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="x" alignment="stretch" {...props} />
);
export const AlignBaselineIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="x" alignment="baseline" {...props} />
);
export const AlignStartColumnIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="y" alignment="start" {...props} />
);
export const AlignCenterColumnIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="y" alignment="center" {...props} />
);
export const AlignEndColumnIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="y" alignment="end" {...props} />
);
export const AlignStretchColumnIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="y" alignment="stretch" {...props} />
);
export const AlignBaselineColumnIcon = (props: LayoutIconProps) => (
  <AlignIcon axis="y" alignment="baseline" {...props} />
);

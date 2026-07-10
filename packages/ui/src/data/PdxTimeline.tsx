import './PdxTimeline.scss';
import { type PdxComponent } from '@prodivix/shared';
import type React from 'react';

export interface PdxTimelineItem {
  title: string;
  time?: string;
  description?: string;
  status?: 'Default' | 'Success' | 'Warning' | 'Danger';
}

interface PdxTimelineSpecificProps {
  items: PdxTimelineItem[];
}

export interface PdxTimelineProps
  extends PdxComponent, PdxTimelineSpecificProps {}

function PdxTimeline({
  items,
  className,
  style,
  id,
  dataAttributes = {},
}: PdxTimelineProps) {
  const fullClassName = `PdxTimeline ${className || ''}`.trim();
  const dataProps = { ...dataAttributes };

  return (
    <ol
      className={fullClassName}
      {...dataProps}
      id={id}
      style={style as React.CSSProperties}
    >
      {items.map((item, index) => (
        <li key={index} className="PdxTimelineItem">
          <div
            aria-hidden="true"
            className={`PdxTimelineDot ${item.status || 'Default'}`}
          />
          <div className="PdxTimelineContent">
            <div className="PdxTimelineTitle">{item.title}</div>
            {item.time && <div className="PdxTimelineTime">{item.time}</div>}
            {item.description && (
              <div className="PdxTimelineDescription">{item.description}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export default PdxTimeline;

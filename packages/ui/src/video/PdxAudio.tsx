import './PdxAudio.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import React from 'react';
import type { PdxComponent } from '@prodivix/shared';

interface PdxAudioSpecificProps {
  src: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  preload?: 'None' | 'Metadata' | 'Auto';
  onPlay?: React.ReactEventHandler<HTMLAudioElement>;
  onPause?: React.ReactEventHandler<HTMLAudioElement>;
  onEnded?: React.ReactEventHandler<HTMLAudioElement>;
  onTimeUpdate?: React.ReactEventHandler<HTMLAudioElement>;
  onProgress?: React.ReactEventHandler<HTMLAudioElement>;
  onLoadedMetadata?: React.ReactEventHandler<HTMLAudioElement>;
}

export interface PdxAudioProps extends PdxComponent, PdxAudioSpecificProps {}

function PdxAudio({
  src,
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  preload = 'Metadata',
  className,
  style,
  id,
  dataAttributes = {},
  onPlay,
  onPause,
  onEnded,
  onTimeUpdate,
  onProgress,
  onLoadedMetadata,
  onClick,
}: PdxAudioProps) {
  const fullClassName = mergeClassNames('PdxAudio', className);
  const normalizedSrc = src?.trim() ? src : undefined;

  return (
    <div
      className={fullClassName}
      id={id}
      onClick={onClick}
      style={style as React.CSSProperties}
      {...getDataAttributes(dataAttributes)}
    >
      <audio
        autoPlay={autoplay}
        className="PdxAudioElement"
        controls={controls}
        loop={loop}
        muted={muted}
        preload={preload.toLowerCase() as 'none' | 'metadata' | 'auto'}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onTimeUpdate={onTimeUpdate}
        onProgress={onProgress}
        onLoadedMetadata={onLoadedMetadata}
        src={normalizedSrc}
      />
    </div>
  );
}

export default PdxAudio;

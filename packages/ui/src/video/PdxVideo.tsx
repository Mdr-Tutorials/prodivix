import './PdxVideo.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { getAspectRatioStyle, type PdxAspectRatio } from '../foundation/media';
import React from 'react';
import type { PdxComponent } from '@prodivix/shared';

interface PdxVideoSpecificProps {
  src: string;
  poster?: string;
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'None' | 'Metadata' | 'Auto';
  width?: number | string;
  height?: number | string;
  aspectRatio?: PdxAspectRatio;
  onPlay?: React.ReactEventHandler<HTMLVideoElement>;
  onPause?: React.ReactEventHandler<HTMLVideoElement>;
  onEnded?: React.ReactEventHandler<HTMLVideoElement>;
  onTimeUpdate?: React.ReactEventHandler<HTMLVideoElement>;
  onProgress?: React.ReactEventHandler<HTMLVideoElement>;
  onLoadedMetadata?: React.ReactEventHandler<HTMLVideoElement>;
}

export interface PdxVideoProps extends PdxComponent, PdxVideoSpecificProps {}

function PdxVideo({
  src,
  poster,
  autoplay = false,
  controls = true,
  loop = false,
  muted = false,
  playsInline = true,
  preload = 'Metadata',
  width,
  height,
  aspectRatio = '16:9',
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
}: PdxVideoProps) {
  const fullClassName = mergeClassNames(
    'PdxVideo',
    `aspect-${aspectRatio.replace(':', '-')}`,
    height !== undefined && 'HasExplicitHeight',
    className
  );
  const normalizedSrc = src?.trim() ? src : undefined;
  const normalizedPoster = poster?.trim() ? poster : undefined;

  const containerStyle = {
    ...getAspectRatioStyle(aspectRatio),
    ...(style as React.CSSProperties),
    width: width ?? style?.width ?? '100%',
    ...(height !== undefined ? { height } : {}),
  } as React.CSSProperties;

  return (
    <div
      className={fullClassName}
      id={id}
      onClick={onClick}
      style={containerStyle}
      {...getDataAttributes(dataAttributes)}
    >
      <div className="PdxVideoFrame">
        <video
          autoPlay={autoplay}
          className="PdxVideoElement"
          controls={controls}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={preload.toLowerCase() as 'none' | 'metadata' | 'auto'}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onTimeUpdate={onTimeUpdate}
          onProgress={onProgress}
          onLoadedMetadata={onLoadedMetadata}
          poster={normalizedPoster}
          src={normalizedSrc}
        />
      </div>
    </div>
  );
}

export default PdxVideo;

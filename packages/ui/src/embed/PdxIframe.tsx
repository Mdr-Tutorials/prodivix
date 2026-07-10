import './PdxIframe.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import {
  enumValueToKebabCase,
  getAspectRatioStyle,
  type PdxAspectRatio,
} from '../foundation/media';
import React from 'react';
import type { PdxComponent } from '@prodivix/shared';

interface PdxIframeSpecificProps {
  src: string;
  srcDoc?: string;
  title?: string;
  allow?: string;
  allowFullScreen?: boolean;
  loading?: 'Eager' | 'Lazy';
  referrerPolicy?:
    | 'NoReferrer'
    | 'NoReferrerWhenDowngrade'
    | 'Origin'
    | 'OriginWhenCrossOrigin'
    | 'SameOrigin'
    | 'StrictOrigin'
    | 'StrictOriginWhenCrossOrigin'
    | 'UnsafeUrl';
  sandbox?: string;
  width?: number | string;
  height?: number | string;
  aspectRatio?: PdxAspectRatio;
}

type PdxIframeNativeProps = Omit<
  React.IframeHTMLAttributes<HTMLIFrameElement>,
  | 'width'
  | 'height'
  | 'loading'
  | 'referrerPolicy'
  | 'src'
  | 'srcDoc'
  | 'title'
  | 'allow'
  | 'allowFullScreen'
  | 'sandbox'
  | 'className'
  | 'style'
  | 'id'
  | 'onClick'
  | 'onLoad'
  | 'onError'
>;

export interface PdxIframeProps
  extends
    Omit<PdxComponent, 'as'>,
    PdxIframeSpecificProps,
    PdxIframeNativeProps {
  onLoad?: React.ReactEventHandler<HTMLIFrameElement>;
  onError?: React.ReactEventHandler<HTMLIFrameElement>;
}

function PdxIframe({
  src,
  srcDoc,
  title,
  allow,
  allowFullScreen = false,
  loading = 'Lazy',
  referrerPolicy,
  sandbox,
  width,
  height,
  aspectRatio = '16:9',
  className,
  style,
  id,
  dataAttributes = {},
  onLoad,
  onError,
  onClick,
  ...rest
}: PdxIframeProps) {
  const fullClassName = mergeClassNames(
    'PdxIframe',
    `aspect-${aspectRatio.replace(':', '-')}`,
    height !== undefined && 'HasExplicitHeight',
    className
  );

  const containerStyle: React.CSSProperties = {
    ...getAspectRatioStyle(aspectRatio),
    ...(style as React.CSSProperties | undefined),
    width: width ?? style?.width ?? '100%',
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      className={fullClassName}
      id={id}
      onClick={onClick}
      style={containerStyle}
      {...getDataAttributes(dataAttributes)}
    >
      <div className="PdxIframeFrame">
        <iframe
          allow={allow}
          allowFullScreen={allowFullScreen}
          className="PdxIframeElement"
          loading={loading.toLowerCase() as 'eager' | 'lazy'}
          referrerPolicy={
            referrerPolicy
              ? (enumValueToKebabCase(
                  referrerPolicy
                ) as React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy'])
              : undefined
          }
          sandbox={sandbox}
          onError={onError}
          onLoad={onLoad}
          src={src}
          srcDoc={srcDoc}
          title={title || 'Embedded content'}
          {...rest}
        />
      </div>
    </div>
  );
}

export default PdxIframe;

import './PdxImageGallery.scss';
import { getDataAttributes, mergeClassNames } from '../foundation/component';
import { useControllableState } from '../foundation/useControllableState';
import { type PdxComponent } from '@prodivix/shared';
import { Check, Images } from 'lucide-react';
import type React from 'react';

export interface PdxImageGalleryItem {
  src: string;
  alt?: string;
  thumbnail?: string;
  caption?: string;
}

interface PdxImageGallerySpecificProps {
  images: PdxImageGalleryItem[];
  layout?: 'Grid' | 'List' | 'Masonry';
  columns?: number;
  gap?: 'None' | 'Small' | 'Medium' | 'Large';
  size?: 'Small' | 'Medium' | 'Large';
  shape?: 'Square' | 'Rounded' | 'Circle';
  fit?: 'Cover' | 'Contain' | 'Fill' | 'None' | 'ScaleDown';
  showCaptions?: boolean;
  selectable?: boolean;
  selectedIndices?: number[];
  defaultSelectedIndices?: number[];
  maxSelection?: number;
  disabled?: boolean;
  emptyMessage?: React.ReactNode;
  onImageClick?: (image: PdxImageGalleryItem, index: number) => void;
  onSelectionChange?: (selectedIndices: number[]) => void;
}

export interface PdxImageGalleryProps
  extends PdxComponent, PdxImageGallerySpecificProps {}

function PdxImageGallery({
  images,
  layout = 'Grid',
  columns = 3,
  gap = 'Medium',
  size = 'Medium',
  shape = 'Rounded',
  fit = 'Cover',
  showCaptions = false,
  selectable = false,
  selectedIndices: controlledSelectedIndices,
  defaultSelectedIndices = [],
  maxSelection,
  disabled = false,
  emptyMessage = 'No images',
  onImageClick,
  onSelectionChange,
  className,
  style,
  id,
  dataAttributes = {},
  onClick,
}: PdxImageGalleryProps) {
  const [rawSelectedIndices, setSelectedIndices] = useControllableState({
    value: controlledSelectedIndices,
    defaultValue: defaultSelectedIndices,
    onChange: onSelectionChange,
  });
  const selectionLimit =
    maxSelection === undefined ? undefined : Math.max(0, maxSelection);
  const selectedIndices = [...new Set(rawSelectedIndices)]
    .filter((index) => index >= 0 && index < images.length)
    .slice(0, selectionLimit);
  const resolvedColumns = Math.min(12, Math.max(1, Math.round(columns)));
  const isInteractive = selectable || Boolean(onImageClick);
  const fullClassName = mergeClassNames(
    'PdxImageGallery',
    layout,
    `Gap${gap}`,
    disabled && 'Disabled',
    className
  );
  const galleryStyle = {
    '--pdx-gallery-columns': resolvedColumns,
    '--pdx-gallery-mobile-columns': Math.min(2, resolvedColumns),
    ...(style as React.CSSProperties),
  } as React.CSSProperties;

  const handleImageClick = (image: PdxImageGalleryItem, index: number) => {
    if (disabled) return;
    onImageClick?.(image, index);
    if (!selectable) return;

    const isSelected = selectedIndices.includes(index);
    if (
      !isSelected &&
      selectionLimit !== undefined &&
      selectedIndices.length >= selectionLimit
    ) {
      return;
    }

    setSelectedIndices(
      isSelected
        ? selectedIndices.filter((selectedIndex) => selectedIndex !== index)
        : [...selectedIndices, index]
    );
  };

  if (images.length === 0) {
    return (
      <div
        className={fullClassName}
        id={id}
        onClick={onClick}
        style={galleryStyle}
        {...getDataAttributes(dataAttributes)}
      >
        <div className="PdxImageGalleryEmpty" role="status">
          <Images aria-hidden="true" size={20} strokeWidth={1.6} />
          <span>{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={selectable ? 'Image selection' : undefined}
      className={fullClassName}
      id={id}
      onClick={onClick}
      role={selectable ? 'group' : undefined}
      style={galleryStyle}
      {...getDataAttributes(dataAttributes)}
    >
      {images.map((image, index) => {
        const isSelected = selectedIndices.includes(index);
        const alt = image.alt || `Image ${index + 1}`;
        const media = (
          <>
            <img
              alt={alt}
              className={mergeClassNames('PdxImageGalleryImage', fit)}
              loading="lazy"
              src={image.thumbnail || image.src}
            />
            {selectable && isSelected && (
              <span className="PdxImageGallerySelection" aria-hidden="true">
                <Check size={14} strokeWidth={2.4} />
              </span>
            )}
          </>
        );

        return (
          <figure
            key={`${image.src}-${index}`}
            className={mergeClassNames(
              'PdxImageGalleryItem',
              size,
              shape,
              isSelected && 'Selected'
            )}
          >
            {isInteractive ? (
              <button
                aria-label={
                  selectable
                    ? `${isSelected ? 'Deselect' : 'Select'} ${alt}`
                    : alt
                }
                aria-pressed={selectable ? isSelected : undefined}
                className="PdxImageGallerySurface"
                disabled={disabled}
                onClick={() => handleImageClick(image, index)}
                type="button"
              >
                {media}
              </button>
            ) : (
              <div className="PdxImageGallerySurface">{media}</div>
            )}
            {showCaptions && image.caption && (
              <figcaption className="PdxImageGalleryCaption">
                {image.caption}
              </figcaption>
            )}
          </figure>
        );
      })}
    </div>
  );
}

export default PdxImageGallery;

import {
  PdxButton,
  PdxButtonLink,
  PdxHeading,
  PdxIcon,
  PdxIconLink,
  PdxLink,
  PdxParagraph,
  PdxText,
} from '@prodivix/ui';
import type {
  PdxButtonTone,
  PdxButtonVariant,
  PdxControlSize,
} from '@prodivix/ui';
import { Sparkles } from 'lucide-react';
import type { ComponentGroup } from '@/editor/features/blueprint/editor/model/types';
import { buildVariants } from '@/editor/features/blueprint/catalog/helpers';
import {
  BUTTON_SIZE_OPTIONS,
  SIZE_OPTIONS,
  TEXT_SIZE_OPTIONS,
} from '@/editor/features/blueprint/catalog/sizeOptions';

const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
const BUTTON_PRESENTATIONS = [
  'Primary',
  'Secondary',
  'Danger',
  'SubtleDanger',
  'Warning',
  'SubtleWarning',
  'Ghost',
] as const;
type ButtonPresentation = (typeof BUTTON_PRESENTATIONS)[number];

const BUTTON_STYLE_BY_PRESENTATION: Record<
  ButtonPresentation,
  { variant: PdxButtonVariant; tone: PdxButtonTone }
> = {
  Primary: { variant: 'Primary', tone: 'Neutral' },
  Secondary: { variant: 'Secondary', tone: 'Neutral' },
  Danger: { variant: 'Primary', tone: 'Danger' },
  SubtleDanger: { variant: 'Secondary', tone: 'Danger' },
  Warning: { variant: 'Primary', tone: 'Warning' },
  SubtleWarning: { variant: 'Secondary', tone: 'Warning' },
  Ghost: { variant: 'Ghost', tone: 'Neutral' },
};

export const BASE_GROUP: ComponentGroup = {
  id: 'base',
  title: '基础组件',
  items: [
    {
      id: 'text',
      name: 'Text',
      preview: <PdxText size="Medium">Text</PdxText>,
      sizeOptions: TEXT_SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <PdxText
          size={
            (size ?? 'Medium') as 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Big'
          }
        >
          Text
        </PdxText>
      ),
    },
    {
      id: 'heading',
      name: 'Heading',
      preview: <PdxHeading level={2}>Heading</PdxHeading>,
      variants: buildVariants(
        HEADING_LEVELS,
        (level) => <PdxHeading level={level}>H{level}</PdxHeading>,
        (level) => `H${level}`,
        undefined,
        undefined,
        (level) => ({ level })
      ),
    },
    {
      id: 'paragraph',
      name: 'Paragraph',
      preview: <PdxParagraph size="Medium">Paragraph</PdxParagraph>,
      sizeOptions: SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <PdxParagraph size={(size ?? 'Medium') as 'Small' | 'Medium' | 'Large'}>
          Paragraph
        </PdxParagraph>
      ),
    },
    {
      id: 'button',
      name: 'Button',
      preview: <PdxButton text="Button" size="Medium" variant="Primary" />,
      sizeOptions: BUTTON_SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <PdxButton
          text="Button"
          size={(size ?? 'Medium') as PdxControlSize}
          variant="Primary"
        />
      ),
      variants: buildVariants(
        BUTTON_PRESENTATIONS,
        (presentation) => (
          <PdxButton
            text={presentation}
            size="Medium"
            {...BUTTON_STYLE_BY_PRESENTATION[presentation]}
          />
        ),
        undefined,
        undefined,
        (presentation, { size }) => (
          <PdxButton
            text={presentation}
            size={(size ?? 'Medium') as PdxControlSize}
            {...BUTTON_STYLE_BY_PRESENTATION[presentation]}
          />
        ),
        (presentation) => ({ ...BUTTON_STYLE_BY_PRESENTATION[presentation] })
      ),
    },
    {
      id: 'button-link',
      name: 'ButtonLink',
      preview: (
        <PdxButtonLink
          text="Link"
          to="/blueprint"
          size="Medium"
          variant="Secondary"
        />
      ),
      sizeOptions: BUTTON_SIZE_OPTIONS,
      renderPreview: ({ size }) => (
        <PdxButtonLink
          text="Link"
          to="/blueprint"
          size={(size ?? 'Medium') as PdxControlSize}
          variant="Secondary"
        />
      ),
      variants: buildVariants(
        BUTTON_PRESENTATIONS,
        (presentation) => (
          <PdxButtonLink
            text={presentation}
            to="/blueprint"
            size="Medium"
            {...BUTTON_STYLE_BY_PRESENTATION[presentation]}
          />
        ),
        undefined,
        undefined,
        (presentation, { size }) => (
          <PdxButtonLink
            text={presentation}
            to="/blueprint"
            size={(size ?? 'Medium') as PdxControlSize}
            {...BUTTON_STYLE_BY_PRESENTATION[presentation]}
          />
        ),
        (presentation) => ({ ...BUTTON_STYLE_BY_PRESENTATION[presentation] })
      ),
    },
    {
      id: 'icon',
      name: 'Icon',
      preview: <PdxIcon icon={Sparkles} size={20} />,
      variants: buildVariants(
        [12, 16, 20, 24] as const,
        (size) => <PdxIcon icon={Sparkles} size={size} />,
        (size) => `${size}px`,
        undefined,
        undefined,
        (size) => ({ size })
      ),
    },
    {
      id: 'icon-link',
      name: 'IconLink',
      preview: (
        <PdxIconLink
          icon={Sparkles}
          label="Open blueprint"
          to="/blueprint"
          size={18}
        />
      ),
      variants: buildVariants(
        [14, 18, 22] as const,
        (size) => (
          <PdxIconLink
            icon={Sparkles}
            label="Open blueprint"
            to="/blueprint"
            size={size}
          />
        ),
        (size) => `${size}px`,
        undefined,
        undefined,
        (size) => ({ size })
      ),
    },
    {
      id: 'link',
      name: 'Link',
      preview: <PdxLink to="/blueprint" text="Link" />,
    },
  ],
};

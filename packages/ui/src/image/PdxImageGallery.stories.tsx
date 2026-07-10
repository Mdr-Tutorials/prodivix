import type { Meta, StoryObj } from '@storybook/react';
import PdxImageGallery from './PdxImageGallery';
import accessibilityImage from '../stories/assets/accessibility.png';
import assetsImage from '../stories/assets/assets.png';
import contextImage from '../stories/assets/context.png';
import stylingImage from '../stories/assets/styling.png';
import testingImage from '../stories/assets/testing.png';
import themingImage from '../stories/assets/theming.png';

const sampleImages = [
  {
    src: accessibilityImage,
    alt: 'Accessibility audit panel',
    caption: 'Accessibility audit',
  },
  {
    src: contextImage,
    alt: 'Component context panel',
    caption: 'Component context',
  },
  {
    src: assetsImage,
    alt: 'Asset browser panel',
    caption: 'Asset browser',
  },
  {
    src: stylingImage,
    alt: 'Styling controls',
    caption: 'Styling controls',
  },
  {
    src: testingImage,
    alt: 'Component testing panel',
    caption: 'Component testing',
  },
  {
    src: themingImage,
    alt: 'Theme controls',
    caption: 'Theme controls',
  },
];

const meta: Meta<typeof PdxImageGallery> = {
  title: 'Components/ImageGallery',
  component: PdxImageGallery,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'select',
      options: ['Grid', 'List', 'Masonry'],
      description: '布局方式',
    },
    columns: {
      control: { type: 'number', min: 1, max: 6 },
      description: '列数',
    },
    gap: {
      control: 'select',
      options: ['None', 'Small', 'Medium', 'Large'],
      description: '间距',
    },
    size: {
      control: 'select',
      options: ['Small', 'Medium', 'Large'],
      description: '图片尺寸',
    },
    shape: {
      control: 'select',
      options: ['Square', 'Rounded', 'Circle'],
      description: '图片形状',
    },
    fit: {
      control: 'select',
      options: ['Cover', 'Contain', 'Fill', 'None', 'ScaleDown'],
      description: '图片填充方式',
    },
    showCaptions: {
      control: 'boolean',
      description: '显示标题',
    },
    selectable: {
      control: 'boolean',
      description: '可选择',
    },
    maxSelection: {
      control: { type: 'number', min: 1 },
      description: '最大选择数',
    },
    onImageClick: { action: 'image clicked' },
    onSelectionChange: { action: 'selection changed' },
  },
};

export default meta;
type Story = StoryObj<typeof PdxImageGallery>;

export const Default: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Medium',
    shape: 'Rounded',
    fit: 'Cover',
    showCaptions: true,
  },
};

export const GridLayout: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Medium',
    shape: 'Rounded',
  },
};

export const ListLayout: Story = {
  args: {
    images: sampleImages,
    layout: 'List',
    gap: 'Medium',
    size: 'Medium',
    shape: 'Rounded',
  },
};

export const WithCaptions: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Medium',
    shape: 'Rounded',
    showCaptions: true,
  },
};

export const Selectable: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Medium',
    shape: 'Rounded',
    selectable: true,
  },
};

export const WithMaxSelection: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Medium',
    shape: 'Rounded',
    selectable: true,
    maxSelection: 3,
  },
};

export const DifferentSizes: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Small',
    shape: 'Rounded',
  },
};

export const DifferentShapes: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 3,
    gap: 'Medium',
    size: 'Medium',
    shape: 'Circle',
  },
};

export const CustomColumns: Story = {
  args: {
    images: sampleImages,
    layout: 'Grid',
    columns: 4,
    gap: 'Small',
    size: 'Medium',
    shape: 'Rounded',
  },
};

export const Empty: Story = {
  args: {
    images: [],
  },
};

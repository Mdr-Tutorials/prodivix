import type { Meta, StoryObj } from '@storybook/react';
import PdxButton from './PdxButton';

const meta: Meta<typeof PdxButton> = {
  title: 'Components/Button',
  component: PdxButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['ExtraSmall', 'Small', 'Medium', 'Large'],
      description: '按钮尺寸',
    },
    variant: {
      control: 'select',
      options: ['Primary', 'Secondary', 'Ghost'],
      description: '按钮层级',
    },
    tone: {
      control: 'select',
      options: ['Neutral', 'Danger', 'Warning'],
      description: '按钮语义色调',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    iconPosition: {
      control: 'select',
      options: ['Left', 'Right'],
      description: '图标位置',
    },
    iconOnly: {
      control: 'boolean',
      description: '仅显示图标',
    },
    loading: {
      control: 'boolean',
      description: '是否正在执行操作',
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof PdxButton>;

export const Primary: Story = {
  args: {
    text: 'Primary Button',
    variant: 'Primary',
    size: 'Medium',
  },
};

export const Secondary: Story = {
  args: {
    text: 'Secondary Button',
    variant: 'Secondary',
    size: 'Medium',
  },
};

export const Danger: Story = {
  args: {
    text: 'Danger Button',
    variant: 'Primary',
    tone: 'Danger',
    size: 'Medium',
  },
};

export const Warning: Story = {
  args: {
    text: 'Warning Button',
    variant: 'Primary',
    tone: 'Warning',
    size: 'Medium',
  },
};

export const Ghost: Story = {
  args: {
    text: 'Ghost Button',
    variant: 'Ghost',
    size: 'Medium',
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <PdxButton text="Large" size="Large" />
      <PdxButton text="Medium" size="Medium" />
      <PdxButton text="Small" size="Small" />
      <PdxButton text="Extra small" size="ExtraSmall" />
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    text: 'With Icon',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
    iconPosition: 'Left',
  },
};

export const IconRight: Story = {
  args: {
    text: 'With Icon',
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    ),
    iconPosition: 'Right',
  },
};

export const IconOnly: Story = {
  args: {
    'aria-label': 'Add item',
    iconOnly: true,
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
};

export const Loading: Story = {
  args: {
    text: 'Publish',
    loading: true,
    loadingText: 'Publishing',
    variant: 'Primary',
  },
};

export const Disabled: Story = {
  args: {
    text: 'Disabled Button',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <PdxButton text="Primary" variant="Primary" />
        <PdxButton text="Secondary" variant="Secondary" />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <PdxButton text="Danger" variant="Primary" tone="Danger" />
        <PdxButton text="Subtle danger" variant="Secondary" tone="Danger" />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <PdxButton text="Warning" variant="Primary" tone="Warning" />
        <PdxButton text="Subtle warning" variant="Secondary" tone="Warning" />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <PdxButton text="Ghost" variant="Ghost" />
      </div>
    </div>
  ),
};

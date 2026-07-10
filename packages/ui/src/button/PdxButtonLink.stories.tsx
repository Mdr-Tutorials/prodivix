import type { Meta, StoryObj } from '@storybook/react';
import PdxButtonLink from './PdxButtonLink';

const meta: Meta<typeof PdxButtonLink> = {
  title: 'Components/ButtonLink',
  component: PdxButtonLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    to: { control: 'text', description: '跳转链接' },
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
  },
};

export default meta;
type Story = StoryObj<typeof PdxButtonLink>;

export const Primary: Story = {
  args: {
    to: '/example',
    text: 'Primary Link',
    variant: 'Primary',
    size: 'Medium',
  },
};

export const Secondary: Story = {
  args: {
    to: '/example',
    text: 'Secondary Link',
    variant: 'Secondary',
    size: 'Medium',
  },
};

export const WithIcon: Story = {
  args: {
    to: '/example',
    text: 'Click Me',
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
    to: '/example',
    'aria-label': 'Open details',
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
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
};

export const Loading: Story = {
  args: {
    to: '/example',
    text: 'Opening',
    loading: true,
    variant: 'Primary',
  },
};

export const Disabled: Story = {
  args: {
    to: '/example',
    text: 'Disabled Link',
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '12px' }}>
        <PdxButtonLink to="/example" text="Primary" variant="Primary" />
        <PdxButtonLink to="/example" text="Secondary" variant="Secondary" />
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <PdxButtonLink
          to="/example"
          text="Danger"
          variant="Primary"
          tone="Danger"
        />
        <PdxButtonLink
          to="/example"
          text="Warning"
          variant="Primary"
          tone="Warning"
        />
      </div>
    </div>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import PdxColorPicker from './PdxColorPicker';

const meta: Meta<typeof PdxColorPicker> = {
  title: 'Components/ColorPicker',
  component: PdxColorPicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PdxColorPicker>;

export const Default: Story = {
  args: {
    label: 'Theme color',
    description: 'Used for focused and selected controls.',
    defaultValue: '#2F6FED',
  },
};

export const WithoutTextInput: Story = {
  args: {
    label: 'Accent',
    showTextInput: false,
    defaultValue: '#FFB007',
  },
};

export const ValidationStates: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16, width: 320 }}>
      <PdxColorPicker defaultValue="#2F6FED" label="Brand color" size="Small" />
      <PdxColorPicker
        defaultValue="#D14343"
        label="Invalid token"
        message="Use a six-digit hexadecimal value."
        state="Error"
      />
      <PdxColorPicker defaultValue="#3F3F3F" disabled label="Inherited color" />
    </div>
  ),
};

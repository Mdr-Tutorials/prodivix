import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import PdxTabs from './PdxTabs';

const meta: Meta<typeof PdxTabs> = {
  title: 'Components/Tabs',
  component: PdxTabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PdxTabs>;

export const Default: Story = {
  args: {
    items: [
      { key: 'overview', label: 'Overview', content: 'Overview content' },
      { key: 'details', label: 'Details', content: 'Details content' },
      {
        key: 'settings',
        label: 'Settings',
        content: 'Settings content',
        disabled: true,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const overview = canvas.getByRole('tab', { name: 'Overview' });
    overview.focus();
    await userEvent.keyboard('{ArrowRight}');

    await expect(canvas.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent(
      'Details content'
    );
  },
};

export const Pills: Story = {
  args: {
    items: [
      { key: 'canvas', label: 'Canvas', content: 'Canvas settings' },
      { key: 'code', label: 'Code', content: 'Code settings' },
    ],
    variant: 'Pills',
  },
};

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import PdxPopover from './PdxPopover';
import PdxButton from '../button/PdxButton';

const meta: Meta<typeof PdxPopover> = {
  title: 'Components/Popover',
  component: PdxPopover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PdxPopover>;

export const Default: Story = {
  render: () => (
    <PdxPopover
      title="Details"
      panelLabel="Details"
      content="Popover content goes here"
    >
      <PdxButton text="Click" size="Small" />
    </PdxPopover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const page = within(canvasElement.ownerDocument.body);
    const trigger = canvas.getByRole('button', { name: 'Click' });
    await userEvent.click(trigger);
    await waitFor(() => {
      expect(page.getByRole('dialog', { name: 'Details' })).toBeVisible();
    });
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(page.queryByRole('dialog', { name: 'Details' })).toBeNull();
    });
    await expect(trigger).toHaveFocus();
  },
};

export const TopAligned: Story = {
  render: () => (
    <PdxPopover
      align="End"
      content="The panel automatically avoids viewport collisions."
      panelLabel="Placement example"
      placement="Top"
      title="Placement"
    >
      <PdxButton text="Open above" size="Small" />
    </PdxPopover>
  ),
};

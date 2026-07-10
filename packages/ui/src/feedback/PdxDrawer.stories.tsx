import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import PdxDrawer from './PdxDrawer';
import PdxButton from '../button/PdxButton';

const meta: Meta<typeof PdxDrawer> = {
  title: 'Components/Drawer',
  component: PdxDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PdxDrawer>;

export const Default: Story = {
  args: {
    open: true,
    title: 'Settings',
    children: 'Drawer content goes here.',
    footer: <PdxButton text="Save" size="Small" variant="Primary" />,
  },
};

export const Left: Story = {
  args: {
    open: true,
    title: 'Filters',
    placement: 'Left',
    children: 'Filter options',
  },
};

function InteractiveDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <PdxButton text="Open drawer" onClick={() => setOpen(true)} />
      <PdxDrawer
        description="Configure project-level preferences."
        footer={
          <PdxButton
            text="Save"
            variant="Primary"
            onClick={() => setOpen(false)}
          />
        }
        onOpenChange={setOpen}
        open={open}
        title="Project settings"
      >
        Drawer content goes here.
      </PdxDrawer>
    </>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDrawer />,
};

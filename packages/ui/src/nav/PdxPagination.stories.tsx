import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from 'storybook/test';
import { useState } from 'react';
import PdxPagination from './PdxPagination';

const meta: Meta<typeof PdxPagination> = {
  title: 'Components/Pagination',
  component: PdxPagination,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof PdxPagination>;

export const Default: Story = {
  args: {
    page: 2,
    total: 120,
    pageSize: 10,
  },
};

export const FewPages: Story = {
  args: {
    page: 1,
    total: 30,
    pageSize: 10,
  },
};

function InteractivePagination() {
  const [page, setPage] = useState(2);
  return (
    <PdxPagination
      onPageChange={setPage}
      page={page}
      pageSize={10}
      total={120}
    />
  );
}

export const Interactive: Story = {
  render: () => <InteractivePagination />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Go to page 3' }));
    await expect(
      canvas.getByRole('button', { name: 'Go to page 3' })
    ).toHaveAttribute('aria-current', 'page');
  },
};

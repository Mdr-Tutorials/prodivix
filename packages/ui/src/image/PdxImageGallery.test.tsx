import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PdxImageGallery from './PdxImageGallery';

const images = [
  { src: 'first.png', alt: 'First preview' },
  { src: 'second.png', alt: 'Second preview' },
];

describe('PdxImageGallery', () => {
  it('supports keyboard selection and enforces the selection limit', async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PdxImageGallery
        images={images}
        maxSelection={1}
        onSelectionChange={onSelectionChange}
        selectable
      />
    );

    const first = screen.getByRole('button', { name: 'Select First preview' });
    first.focus();
    await user.keyboard('{Enter}');

    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(onSelectionChange).toHaveBeenLastCalledWith([0]);

    await user.click(
      screen.getByRole('button', { name: 'Select Second preview' })
    );
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
  });
});

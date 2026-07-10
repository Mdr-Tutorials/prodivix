import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PdxModal from './PdxModal';

describe('PdxModal', () => {
  it('announces its title and requests close on Escape', async () => {
    const onClose = vi.fn();
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PdxModal
        onClose={onClose}
        onOpenChange={onOpenChange}
        open
        title="Delete project"
      >
        This cannot be undone.
      </PdxModal>
    );

    expect(
      screen.getByRole('dialog', { name: 'Delete project' })
    ).toBeVisible();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

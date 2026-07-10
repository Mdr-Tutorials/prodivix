import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import PdxButton from './PdxButton';
import PdxButtonLink from './PdxButtonLink';

describe('PdxButton', () => {
  it('exposes an accessible icon-only action', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <PdxButton
        aria-label="Add item"
        icon={<span>+</span>}
        iconOnly
        onClick={onClick}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables interaction while loading', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <PdxButton loading onClick={onClick} text="Publish" variant="Primary" />
    );

    const button = screen.getByRole('button', { name: 'Publish' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders button links as one accessible link', () => {
    render(
      <MemoryRouter>
        <PdxButtonLink text="Open project" to="/project" variant="Primary" />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Open project' })).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

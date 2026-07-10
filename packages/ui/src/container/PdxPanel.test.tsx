import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PdxPanel from './PdxPanel';

describe('PdxPanel', () => {
  it('toggles uncontrolled content with an accessible header button', async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();

    render(
      <PdxPanel collapsible defaultCollapsed onToggle={onToggle} title="Files">
        Project files
      </PdxPanel>
    );

    const toggle = screen.getByRole('button', { name: 'Files' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Project files')).not.toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Project files')).toBeVisible();
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it('follows controlled collapsed updates', () => {
    const { rerender } = render(
      <PdxPanel collapsible collapsed title="Inspector">
        Inspector content
      </PdxPanel>
    );

    expect(screen.getByText('Inspector content')).not.toBeVisible();
    rerender(
      <PdxPanel collapsible collapsed={false} title="Inspector">
        Inspector content
      </PdxPanel>
    );
    expect(screen.getByText('Inspector content')).toBeVisible();
  });
});

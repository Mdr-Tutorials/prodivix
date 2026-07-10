import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PdxTabs from './PdxTabs';

const items = [
  { key: 'overview', label: 'Overview', content: 'Overview content' },
  {
    key: 'disabled',
    label: 'Disabled',
    content: 'Disabled content',
    disabled: true,
  },
  { key: 'details', label: 'Details', content: 'Details content' },
];

describe('PdxTabs', () => {
  it('moves and activates focus with arrow keys while skipping disabled tabs', async () => {
    const onActiveKeyChange = vi.fn();
    const user = userEvent.setup();

    render(<PdxTabs items={items} onActiveKeyChange={onActiveKeyChange} />);
    const overview = screen.getByRole('tab', { name: 'Overview' });
    overview.focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Details content');
    expect(onActiveKeyChange).toHaveBeenCalledWith('details');
  });
});

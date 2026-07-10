import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PdxCheckList from './PdxCheckList';

const items = [
  { label: 'Email notifications', value: 'email', checked: true },
  { label: 'Push notifications', value: 'push' },
];

describe('PdxCheckList', () => {
  it('treats an empty controlled value as the source of truth', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(
      <PdxCheckList items={items} onChange={onChange} value={[]} />
    );
    const email = screen.getByRole('checkbox', {
      name: 'Email notifications',
    });

    expect(email).not.toBeChecked();
    await user.click(email);
    expect(onChange).toHaveBeenCalledWith(['email']);
    expect(email).not.toBeChecked();

    rerender(
      <PdxCheckList items={items} onChange={onChange} value={['email']} />
    );
    expect(email).toBeChecked();
  });
});

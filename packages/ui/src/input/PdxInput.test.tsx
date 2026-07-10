import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChangeEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import PdxInput from './PdxInput';

describe('PdxInput', () => {
  it('preserves native change events and emits value changes', async () => {
    let nativeValue = '';
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => {
      nativeValue = event.currentTarget.value;
    });
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <PdxInput
        aria-label="Project name"
        onChange={onChange}
        onValueChange={onValueChange}
      />
    );

    await user.type(screen.getByRole('textbox', { name: 'Project name' }), 'A');
    expect(onChange).toHaveBeenCalledOnce();
    expect(nativeValue).toBe('A');
    expect(onValueChange).toHaveBeenCalledWith('A');
  });
});

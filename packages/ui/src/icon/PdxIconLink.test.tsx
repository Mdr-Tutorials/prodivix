import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import PdxIconLink from './PdxIconLink';

describe('PdxIconLink', () => {
  it('shows only a positive count badge', () => {
    const { rerender } = render(
      <MemoryRouter>
        <PdxIconLink badge={0} icon={<span>!</span>} label="Issues" to="/" />
      </MemoryRouter>
    );

    expect(screen.queryByText('0')).not.toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <PdxIconLink badge={3} icon={<span>!</span>} label="Issues" to="/" />
      </MemoryRouter>
    );

    expect(screen.getByText('3')).toBeVisible();
  });
});

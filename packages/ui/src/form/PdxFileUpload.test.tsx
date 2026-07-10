import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PdxFileUpload from './PdxFileUpload';

describe('PdxFileUpload', () => {
  it('reports selected files and supports removing them', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const first = new File(['first'], 'first.txt', { type: 'text/plain' });
    const second = new File(['second'], 'second.txt', { type: 'text/plain' });

    render(<PdxFileUpload label="Attachments" multiple onChange={onChange} />);

    await user.upload(screen.getByLabelText('Attachments'), [first, second]);
    expect(onChange).toHaveBeenLastCalledWith([first, second]);
    expect(screen.getByText('first.txt')).toBeVisible();
    expect(screen.getByText('second.txt')).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Remove first.txt' }));
    expect(onChange).toHaveBeenLastCalledWith([second]);
    expect(screen.queryByText('first.txt')).not.toBeInTheDocument();
  });

  it('honors a controlled empty file list', () => {
    const file = new File(['draft'], 'draft.txt', { type: 'text/plain' });

    render(
      <PdxFileUpload
        defaultValue={[file]}
        label="Controlled attachments"
        value={[]}
      />
    );

    expect(screen.queryByText('draft.txt')).not.toBeInTheDocument();
  });
});

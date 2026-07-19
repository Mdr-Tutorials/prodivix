import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportCodeHeader } from './ExportCodeHeader';

describe('ExportCodeHeader target surface', () => {
  it('offers Vue/Vite as a first-class export view with ZIP download', () => {
    const onDownloadZip = vi.fn();
    render(
      <ExportCodeHeader
        activeTab="vue"
        title="Vue / Vite"
        description="Vue product export"
        viewMenuOpen={false}
        viewOptions={[
          { value: 'react', label: 'React / Vite' },
          { value: 'vue', label: 'Vue / Vite' },
          { value: 'vfs', label: 'Workspace VFS' },
        ]}
        titleLabel="Export code"
        downloadingZip={false}
        canDownloadZip
        downloadingLabel="Downloading"
        downloadZipLabel="Download ZIP"
        onOpenViewMenuChange={vi.fn()}
        onSelectTab={vi.fn()}
        onDownloadZip={onDownloadZip}
      />
    );

    expect(screen.getByRole('heading', { name: 'Vue / Vite' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Download ZIP' }));
    expect(onDownloadZip).toHaveBeenCalledOnce();
  });

  it('keeps blocked Vue output visible but disables ZIP download', () => {
    render(
      <ExportCodeHeader
        activeTab="vue"
        title="Vue / Vite"
        description="Protected Server Runtime requires a gateway"
        viewMenuOpen={false}
        viewOptions={[]}
        titleLabel="Export code"
        downloadingZip={false}
        canDownloadZip={false}
        downloadingLabel="Downloading"
        downloadZipLabel="Download ZIP"
        onOpenViewMenuChange={vi.fn()}
        onSelectTab={vi.fn()}
        onDownloadZip={vi.fn()}
      />
    );

    expect(
      screen
        .getByRole('button', { name: 'Download ZIP' })
        .hasAttribute('disabled')
    ).toBe(true);
  });
});

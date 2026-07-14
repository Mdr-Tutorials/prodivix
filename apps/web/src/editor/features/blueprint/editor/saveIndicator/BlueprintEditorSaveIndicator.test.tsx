import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlueprintEditorSaveIndicator } from './BlueprintEditorSaveIndicator';

describe('BlueprintEditorSaveIndicator', () => {
  it('copies the displayed error details when the error indicator is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    const error = 'Workspace commit failed: revision mismatch.';

    render(
      <BlueprintEditorSaveIndicator
        status="error"
        transport="workspace"
        label={error}
        tone="error"
        isWorkspaceSaveDisabled={false}
        hasPendingChanges
        isManualSave={false}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: `Copy error details: ${error}` })
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(error));
    expect(
      screen.getByRole('button', { name: `Error details copied: ${error}` })
    ).toBeTruthy();
  });
});

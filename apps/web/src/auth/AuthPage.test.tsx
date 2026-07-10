import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';
import { authApi } from './authApi';

const { setSession } = vi.hoisted(() => ({ setSession: vi.fn() }));

vi.mock('./useAuthStore', () => ({
  useAuthStore: (
    selector: (state: { setSession: typeof setSession }) => unknown
  ) => selector({ setSession }),
}));

describe('AuthPage', () => {
  beforeEach(() => {
    setSession.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('submits valid login credentials and opens the profile', async () => {
    const login = vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'token',
      expiresAt: '2099-01-01T00:00:00.000Z',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        name: 'User',
        createdAt: '2026-07-10T00:00:00.000Z',
      },
    });

    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<div>Profile</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('fields.email'), {
      target: { value: ' user@example.com ' },
    });
    fireEvent.change(screen.getByLabelText('fields.password'), {
      target: { value: 'password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'actions.login' }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password',
      });
    });
    expect(await screen.findByText('Profile')).toBeTruthy();
  });
});

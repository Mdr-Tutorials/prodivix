import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

    const loginPanel = screen.getByRole('tabpanel');
    fireEvent.change(within(loginPanel).getByLabelText('fields.email'), {
      target: { value: ' user@example.com ' },
    });
    fireEvent.change(within(loginPanel).getByLabelText('fields.password'), {
      target: { value: 'password' },
    });
    fireEvent.click(
      within(loginPanel).getByRole('button', { name: 'actions.login' })
    );

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password',
      });
    });
    expect(await screen.findByText('Profile')).toBeTruthy();
  });

  it('returns an accepted registration to login without creating a session', async () => {
    const register = vi
      .spyOn(authApi, 'register')
      .mockResolvedValue({ accepted: true });
    render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<div>Profile</div>} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('tab', { name: 'tabs.register' }));
    const registerPanel = screen.getByRole('tabpanel');
    fireEvent.change(within(registerPanel).getByLabelText('fields.name'), {
      target: { value: ' User ' },
    });
    fireEvent.change(within(registerPanel).getByLabelText('fields.email'), {
      target: { value: ' user@example.com ' },
    });
    fireEvent.change(
      within(registerPanel).getByPlaceholderText('placeholders.password'),
      { target: { value: 'password' } }
    );
    fireEvent.click(
      within(registerPanel).getByRole('button', { name: 'actions.register' })
    );

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        name: 'User',
        email: 'user@example.com',
        password: 'password',
        description: '',
      })
    );
    expect(await screen.findByText('registration.accepted')).toBeTruthy();
    expect(
      screen
        .getByRole('tab', { name: 'tabs.login' })
        .getAttribute('aria-selected')
    ).toBe('true');
    expect(setSession).not.toHaveBeenCalled();
    expect(screen.queryByText('Profile')).toBeNull();
  });
});

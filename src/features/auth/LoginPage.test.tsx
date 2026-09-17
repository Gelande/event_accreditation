import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginPage } from './LoginPage';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements with accessible labels', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /star experience/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('keeps submit button disabled when fields are empty', () => {
    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    expect(submitBtn).toBeDisabled();
  });

  it('displays generic invalid-credentials error on authentication failure', async () => {
    const user = userEvent.setup();
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: { name: 'AuthApiError', message: 'Invalid login credentials', status: 400 } as unknown as import('@supabase/supabase-js').AuthError,
    });

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'wrongpassword');

    expect(submitBtn).toBeEnabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent(/invalid email or password/i);
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'wrong@example.com',
      password: 'wrongpassword',
    });
  });

  it('calls onSuccess callback on successful authentication', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: { id: 'u1', email: 'staff@starexperience.com' } as unknown as import('@supabase/supabase-js').User,
        session: {} as unknown as import('@supabase/supabase-js').Session,
      },
      error: null,
    });

    render(<LoginPage onSuccess={onSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), 'staff@starexperience.com');
    await user.type(screen.getByLabelText(/password/i), 'correctpassword');

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});

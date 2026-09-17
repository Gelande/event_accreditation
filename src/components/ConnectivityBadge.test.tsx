import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConnectivityBadge } from './ConnectivityBadge';

describe('ConnectivityBadge', () => {
  it('renders online status by default', () => {
    render(<ConnectivityBadge />);
    expect(screen.getByRole('status')).toHaveTextContent(/online/i);
  });

  it('renders offline status when isOnline is false', () => {
    render(<ConnectivityBadge isOnline={false} />);
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
  });
});

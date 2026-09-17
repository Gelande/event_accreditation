import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsBar } from './StatsBar';

describe('StatsBar', () => {
  it('renders total, checked in, and pending count numbers', () => {
    render(<StatsBar total={200} checkedIn={150} pending={50} />);

    expect(screen.getByTestId('count-total')).toHaveTextContent('200');
    expect(screen.getByTestId('count-checked-in')).toHaveTextContent('150');
    expect(screen.getByTestId('count-pending')).toHaveTextContent('50');
  });

  it('renders placeholder dashes when loading', () => {
    render(<StatsBar total={200} checkedIn={150} pending={50} isLoading={true} />);

    expect(screen.getByTestId('count-total')).toHaveTextContent('–');
    expect(screen.getByTestId('count-checked-in')).toHaveTextContent('–');
    expect(screen.getByTestId('count-pending')).toHaveTextContent('–');
  });
});

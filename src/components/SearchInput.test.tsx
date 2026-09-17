import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from './SearchInput';

describe('SearchInput', () => {
  it('renders input with placeholder and accessible label', () => {
    render(<SearchInput value="" onChange={vi.fn()} onClear={vi.fn()} />);

    expect(
      screen.getByRole('searchbox', { name: /search participants/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search name, email, or document/i),
    ).toBeInTheDocument();
  });

  it('triggers onChange when typing', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} onClear={vi.fn()} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'Maria');

    expect(onChange).toHaveBeenCalled();
  });

  it('shows clear button only when value is non-empty and triggers onClear', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { rerender } = render(
      <SearchInput value="" onChange={vi.fn()} onClear={onClear} />,
    );

    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument();

    rerender(<SearchInput value="test" onChange={vi.fn()} onClear={onClear} />);

    const clearButton = screen.getByRole('button', { name: /clear search/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);
    expect(onClear).toHaveBeenCalled();
  });
});

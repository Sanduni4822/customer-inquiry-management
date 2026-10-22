import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  it('renders "New" badge correctly', () => {
    render(<StatusBadge status="New" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('New');
    expect(badge).toHaveClass('bg-blue-50');
  });

  it('renders "In Progress" badge correctly', () => {
    render(<StatusBadge status="In Progress" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('In Progress');
    expect(badge).toHaveClass('bg-amber-50');
  });

  it('renders "Resolved" badge correctly', () => {
    render(<StatusBadge status="Resolved" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Resolved');
    expect(badge).toHaveClass('bg-emerald-50');
  });
});

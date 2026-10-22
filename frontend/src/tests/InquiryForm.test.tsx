import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InquiryForm } from '../components/inquiries/InquiryForm';
import * as client from '../api/client';

// Mock apiRequest
vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe('InquiryForm User Interaction & Validation', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (client.apiRequest as any).mockResolvedValue({ success: true, data: [] });
  });

  it('renders all required form inputs when open', async () => {
    render(
      <InquiryForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /record inquiry/i })).toBeInTheDocument();
    await waitFor(() => expect(client.apiRequest).toHaveBeenCalledWith('/auth/staff'));
  });

  it('displays inline validation errors when submitting with empty fields', async () => {
    render(
      <InquiryForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    const submitBtn = screen.getByRole('button', { name: /record inquiry/i });
    fireEvent.click(submitBtn);

    // Verify validation error messages are displayed to guide the user
    await waitFor(() => {
      expect(screen.getByText(/customer name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/customer contact info is required/i)).toBeInTheDocument();
      expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
      expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    });

    // Ensure API was never called with invalid data
    expect(client.apiRequest).not.toHaveBeenCalledWith(
      '/inquiries',
      expect.anything()
    );
  });

  it('validates contact format (rejecting invalid email/phone) and accepts valid contact', async () => {
    render(
      <InquiryForm isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />
    );

    fireEvent.change(screen.getByLabelText(/customer name/i), {
      target: { value: 'Alice Cooper' },
    });
    fireEvent.change(screen.getByLabelText(/contact/i), {
      target: { value: 'invalid-contact-format' },
    });
    fireEvent.change(screen.getByLabelText(/subject/i), {
      target: { value: 'Roast enquiry' },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Customer inquiring about single origin Ethiopian beans.' },
    });

    fireEvent.click(screen.getByRole('button', { name: /record inquiry/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/please enter a valid email address or phone number/i)
      ).toBeInTheDocument();
    });

    // Fix contact to valid email
    fireEvent.change(screen.getByLabelText(/contact/i), {
      target: { value: 'alice@rock.com' },
    });

    (client.apiRequest as any).mockResolvedValueOnce({
      success: true,
      data: { id: 'test-inquiry-123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /record inquiry/i }));

    await waitFor(() => {
      expect(client.apiRequest).toHaveBeenCalledWith('/inquiries', {
        method: 'POST',
        body: expect.stringContaining('"customer_name":"Alice Cooper"'),
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});

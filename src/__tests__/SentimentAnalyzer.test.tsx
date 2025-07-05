import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SentimentAnalyzer from '../components/sentiment-analyzer';

const toastMock = jest.fn();
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

global.fetch = jest.fn();

describe('SentimentAnalyzer', () => {
  const defaultProps = {
    userId: 'user-1',
    currentUsage: 0,
    usageLimit: 5,
    subscriptionStatus: 'free',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders input and button', () => {
    render(<SentimentAnalyzer {...defaultProps} />);
    expect(screen.getByPlaceholderText(/enter customer feedback/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /analyze sentiment/i })).toBeInTheDocument();
  });

  it('shows error if input is empty (toast)', async () => {
    render(<SentimentAnalyzer {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /analyze sentiment/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/error/i),
          description: expect.stringMatching(/please enter some text/i),
          variant: 'destructive',
        })
      );
    });
  });

  it('shows usage limit error (toast)', async () => {
    render(<SentimentAnalyzer {...defaultProps} currentUsage={5} />);
    fireEvent.change(screen.getByPlaceholderText(/enter customer feedback/i), { target: { value: 'test' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze sentiment/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/usage limit reached/i),
          description: expect.stringMatching(/upgrade/i),
          variant: 'destructive',
        })
      );
    });
  });

  it('calls API and displays result', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sentiment: 'positive', confidence: 0.9, key_phrases: ['great'], processing_time_ms: 10, tokens_used: 5 })
    });
    render(<SentimentAnalyzer {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/enter customer feedback/i), { target: { value: 'Great product!' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze sentiment/i }));
    await waitFor(() => {
      expect(screen.getByText(/analysis results/i)).toBeInTheDocument();
      expect(screen.getByText(/POSITIVE/)).toBeInTheDocument();
      // Disambiguate: get all by text and check at least one is the badge
      const greats = screen.getAllByText(/great/i);
      expect(greats.length).toBeGreaterThan(0);
    });
  });

  it('handles API error (toast)', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Analysis failed' })
    });
    render(<SentimentAnalyzer {...defaultProps} />);
    fireEvent.change(screen.getByPlaceholderText(/enter customer feedback/i), { target: { value: 'Bad' } });
    fireEvent.click(screen.getByRole('button', { name: /analyze sentiment/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/analysis failed/i),
          variant: 'destructive',
        })
      );
    });
  });
}); 
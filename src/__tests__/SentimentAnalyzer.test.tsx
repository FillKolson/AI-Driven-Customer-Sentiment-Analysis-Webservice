import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SentimentAnalyzer from '../components/sentiment-analyzer';
import { analyzeSentiment, SentimentResult } from "../lib/claudeApi";

const toastMock = jest.fn();
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

global.fetch = jest.fn();

jest.mock("@anthropic-ai/sdk", () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockImplementation(async ({ messages }) => {
          const text = messages[0].content;
          if (text.includes("error")) throw new Error("Claude API error");
          if (text.includes("positive")) {
            return {
              content: [{ type: "text", text: JSON.stringify({ sentiment: "positive", confidence: 0.95, key_phrases: ["great", "happy"] }) }],
              usage: { input_tokens: 42 },
            };
          }
          return {
            content: [{ type: "text", text: JSON.stringify({ sentiment: "neutral", confidence: 0.5, key_phrases: [] }) }],
            usage: { input_tokens: 10 },
          };
        }),
      },
    })),
  };
});

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

describe("Claude API Service", () => {
  const userId = "user-123";
  const text = "This is a positive review.";

  it("returns sentiment result for valid input", async () => {
    const result = await analyzeSentiment({ userId, text });
    expect(result.sentiment).toBe("positive");
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.key_phrases).toContain("great");
    expect(result.tokens_used).toBeGreaterThan(0);
  });

  it("caches results for repeated input", async () => {
    const first = await analyzeSentiment({ userId, text });
    const second = await analyzeSentiment({ userId, text });
    expect(second).toEqual(first);
  });

  it("enforces rate limiting", async () => {
    // Simulate hitting the rate limit
    for (let i = 0; i < 100; i++) {
      await analyzeSentiment({ userId: "user-rl", text: "neutral" });
    }
    await expect(analyzeSentiment({ userId: "user-rl", text: "neutral" })).rejects.toThrow("Rate limit exceeded");
  });

  it("handles Claude API errors", async () => {
    await expect(analyzeSentiment({ userId, text: "error" })).rejects.toThrow("Claude API error");
  });

  it("parses fallback sentiment if JSON is malformed", async () => {
    // Mock SDK to return malformed JSON
    const { default: Anthropic } = jest.requireMock("@anthropic-ai/sdk");
    Anthropic.mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text: "Definitely positive!" }],
          usage: { input_tokens: 5 },
        }),
      },
    }));
    const result = await analyzeSentiment({ userId, text: "Definitely positive!" });
    expect(result.sentiment).toBe("positive");
    expect(result.confidence).toBe(0.7);
  });
}); 
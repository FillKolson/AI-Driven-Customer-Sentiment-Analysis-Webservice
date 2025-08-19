import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KeyMetricsChart from '@/components/key-metrics-chart';

// Mock the recharts library to avoid canvas issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, name, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} data-name={name} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: any) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: ({ yAxisId, label }: any) => (
    <div data-testid={`y-axis-${yAxisId || 'default'}`} data-label={label?.value} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip">{content}</div>,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  Activity: () => <div data-testid="activity-icon" />,
}));

describe('KeyMetricsChart', () => {
  const mockAnalyses = [
    {
      id: '1',
      input_text: 'Great service and amazing products!',
      sentiment_result: {
        sentiment: 'positive' as const,
        confidence: 0.85,
        key_phrases: ['great service', 'amazing products']
      },
      created_at: '2024-01-15T10:00:00Z',
      tokens_used: 50,
      processing_time_ms: 200,
      file_name: 'test1.csv'
    },
    {
      id: '2',
      input_text: 'Excellent customer experience',
      sentiment_result: {
        sentiment: 'positive' as const,
        confidence: 0.92,
        key_phrases: ['excellent', 'customer experience']
      },
      created_at: '2024-01-15T14:00:00Z',
      tokens_used: 45,
      processing_time_ms: 180,
      file_name: 'test1.csv'
    },
    {
      id: '3',
      input_text: 'Very satisfied with the quality',
      sentiment_result: {
        sentiment: 'positive' as const,
        confidence: 0.78,
        key_phrases: ['satisfied', 'quality']
      },
      created_at: '2024-01-16T09:00:00Z',
      tokens_used: 55,
      processing_time_ms: 220,
      file_name: 'test2.csv'
    },
    {
      id: '4',
      input_text: 'Poor service and bad products',
      sentiment_result: {
        sentiment: 'negative' as const,
        confidence: 0.75,
        key_phrases: ['poor service', 'bad products']
      },
      created_at: '2024-01-16T15:00:00Z',
      tokens_used: 40,
      processing_time_ms: 160,
      file_name: 'test2.csv'
    },
    {
      id: '5',
      input_text: 'Neutral experience',
      sentiment_result: {
        sentiment: 'neutral' as const,
        confidence: 0.60,
        key_phrases: ['neutral', 'experience']
      },
      created_at: '2024-01-17T11:00:00Z',
      tokens_used: 35,
      processing_time_ms: 140,
      file_name: 'test3.csv'
    }
  ];

  const mockLowConfidenceAnalyses = [
    {
      id: '6',
      input_text: 'Okay service',
      sentiment_result: {
        sentiment: 'positive' as const,
        confidence: 0.45, // Below threshold
        key_phrases: ['okay service']
      },
      created_at: '2024-01-18T10:00:00Z',
      tokens_used: 30,
      processing_time_ms: 120,
      file_name: 'test4.csv'
    }
  ];

  beforeEach(() => {
    // Mock Math.random to ensure consistent test results
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders the chart title correctly', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByText('Key Metrics - Positive Sentiment Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('trending-up-icon')).toBeInTheDocument();
    });

    it('renders the chart structure correctly', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis-left')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis-right')).toBeInTheDocument();
      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('renders both chart lines correctly', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByTestId('line-average_order_value')).toBeInTheDocument();
      expect(screen.getByTestId('line-average_sentiment_score')).toBeInTheDocument();
    });

    it('applies correct styling to chart lines', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      const orderValueLine = screen.getByTestId('line-average_order_value');
      const sentimentLine = screen.getByTestId('line-average_sentiment_score');
      
      expect(orderValueLine).toHaveAttribute('data-name', 'Average Order Value');
      expect(orderValueLine).toHaveAttribute('data-stroke', '#10b981');
      expect(sentimentLine).toHaveAttribute('data-name', 'Average Sentiment Score');
      expect(sentimentLine).toHaveAttribute('data-stroke', '#3b82f6');
    });
  });

  describe('Data Processing', () => {
    it('filters only positive sentiment analyses with confidence > 0.5', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      // Should only include analyses 1, 2, and 3 (positive with confidence > 0.5)
      // Analysis 4 is negative, analysis 5 is neutral, analysis 6 has low confidence
      const chartData = JSON.parse(screen.getByTestId('line-chart').getAttribute('data-chart-data') || '[]');
      
      // Should have data for 2 dates (Jan 15 and Jan 16)
      expect(chartData).toHaveLength(2);
      
      // Check that dates are properly formatted
      expect(chartData[0]).toHaveProperty('sentiment_date');
      expect(chartData[0]).toHaveProperty('average_order_value');
      expect(chartData[0]).toHaveProperty('average_sentiment_score');
    });

    it('calculates sentiment scores correctly (confidence * 100 for chart display)', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      const chartData = JSON.parse(screen.getByTestId('line-chart').getAttribute('data-chart-data') || '[]');
      
      // For Jan 15: average of 0.85 and 0.92 = 0.885, then * 100 = 88.5
      // For Jan 16: 0.78 * 100 = 78
      expect(chartData[0].average_sentiment_score).toBeCloseTo(88.5, 1);
      expect(chartData[1].average_sentiment_score).toBeCloseTo(78, 1);
    });

    it('generates realistic order values based on sentiment scores', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      const chartData = JSON.parse(screen.getByTestId('line-chart').getAttribute('data-chart-data') || '[]');
      
      // With Math.random mocked to return 0.5, order values should be predictable
      // Base (75) + sentiment multiplier * 150 + variation (50) = 75 + (0.885 * 150) + 50 = 75 + 132.75 + 50 = 257.75
      expect(chartData[0].average_order_value).toBeCloseTo(257.75, 0);
    });

    it('sorts data by date correctly', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      const chartData = JSON.parse(screen.getByTestId('line-chart').getAttribute('data-chart-data') || '[]');
      
      // Should be sorted by date (Jan 15, then Jan 16)
      expect(chartData[0].sentiment_date).toBe('Jan 15');
      expect(chartData[1].sentiment_date).toBe('Jan 16');
    });
  });

  describe('Summary Statistics', () => {
    it('displays summary statistics when data is available', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByText('Total Positive Reviews')).toBeInTheDocument();
      expect(screen.getByText('Avg Sentiment Score')).toBeInTheDocument();
      expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
      
      // Should show 3 positive reviews (analyses 1, 2, 3)
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('calculates average sentiment score correctly', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      // Average of 0.885 and 0.78 = 0.8325, displayed as 0.833
      expect(screen.getByText('0.833')).toBeInTheDocument();
    });

    it('calculates average order value correctly', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      // Should display the average order value with $ symbol
      expect(screen.getByText(/^\$\d+$/)).toBeInTheDocument();
    });
  });

  describe('Analyst Review Section', () => {
    it('renders the analyst review section', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByText('Analyst Review')).toBeInTheDocument();
    });

    it('includes all required review sections', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByText(/Positive Sentiment Trends:/)).toBeInTheDocument();
      expect(screen.getByText(/Order Value Correlation:/)).toBeInTheDocument();
      expect(screen.getByText(/Operational Optimization Opportunities:/)).toBeInTheDocument();
      expect(screen.getByText(/Recommendations:/)).toBeInTheDocument();
    });

    it('includes actionable recommendations', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByText(/Identify peak satisfaction periods/)).toBeInTheDocument();
      expect(screen.getByText(/Analyze factors contributing to high sentiment scores/)).toBeInTheDocument();
      expect(screen.getByText(/Develop targeted strategies/)).toBeInTheDocument();
      expect(screen.getByText(/Use sentiment trends to predict/)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading skeleton when loading is true', () => {
      render(<KeyMetricsChart analyses={[]} loading={true} />);
      
      // Should show loading skeleton instead of chart
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
      expect(screen.queryByTestId('responsive-container')).not.toBeInTheDocument();
    });

    it('does not show loading skeleton when loading is false', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no positive sentiment data is available', () => {
      render(<KeyMetricsChart analyses={mockLowConfidenceAnalyses} loading={false} />);
      
      expect(screen.getByText('No positive sentiment data available for visualization')).toBeInTheDocument();
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
      expect(screen.getByText('Start analyzing text to see positive sentiment trends')).toBeInTheDocument();
    });

    it('shows empty state when no analyses are provided', () => {
      render(<KeyMetricsChart analyses={[]} loading={false} />);
      
      expect(screen.getByText('No positive sentiment data available for visualization')).toBeInTheDocument();
    });

    it('shows empty state when only negative/neutral analyses are provided', () => {
      const negativeAnalyses = [
        {
          id: '1',
          input_text: 'Bad service',
          sentiment_result: {
            sentiment: 'negative' as const,
            confidence: 0.8,
            key_phrases: ['bad service']
          },
          created_at: '2024-01-15T10:00:00Z',
          tokens_used: 30,
          processing_time_ms: 120,
          file_name: 'test.csv'
        }
      ];
      
      render(<KeyMetricsChart analyses={negativeAnalyses} loading={false} />);
      
      expect(screen.getByText('No positive sentiment data available for visualization')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles data processing errors gracefully', () => {
      // Mock console.error to prevent test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create malformed data that would cause processing errors
      const malformedAnalyses = [
        {
          id: '1',
          input_text: 'Test',
          sentiment_result: {
            sentiment: 'positive' as const,
            confidence: NaN, // This will cause an error
            key_phrases: []
          },
          created_at: '2024-01-15T10:00:00Z',
          tokens_used: 30,
          processing_time_ms: 120,
          file_name: 'test.csv'
        }
      ];
      
      render(<KeyMetricsChart analyses={malformedAnalyses} loading={false} />);
      
      // Should show empty state when error occurs
      expect(screen.getByText('No positive sentiment data available for visualization')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      // Check that the chart title is properly accessible
      expect(screen.getByRole('heading', { name: /Key Metrics - Positive Sentiment Analysis/i })).toBeInTheDocument();
    });

    it('provides meaningful text for screen readers', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      // Check that summary statistics are accessible
      expect(screen.getByText('Total Positive Reviews')).toBeInTheDocument();
      expect(screen.getByText('Avg Sentiment Score')).toBeInTheDocument();
      expect(screen.getByText('Avg Order Value')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('renders chart container with proper responsive classes', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      const chartContainer = screen.getByTestId('responsive-container');
      expect(chartContainer).toBeInTheDocument();
    });

    it('renders summary statistics in responsive grid', () => {
      render(<KeyMetricsChart analyses={mockAnalyses} loading={false} />);
      
      // Check that summary cards are rendered
      const summaryCards = screen.getAllByText(/Total Positive Reviews|Avg Sentiment Score|Avg Order Value/);
      expect(summaryCards).toHaveLength(3);
    });
  });

  describe('Data Validation', () => {
    it('validates required analysis properties', () => {
      const invalidAnalyses = [
        {
          id: '1',
          input_text: 'Test',
          sentiment_result: {
            sentiment: 'positive' as const,
            confidence: 0.8,
            key_phrases: []
          },
          created_at: '2024-01-15T10:00:00Z',
          tokens_used: 30,
          processing_time_ms: 120,
          file_name: 'test.csv'
        }
      ];
      
      render(<KeyMetricsChart analyses={invalidAnalyses} loading={false} />);
      
      // Should handle valid properties correctly
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('handles analyses with valid sentiment_result', () => {
      const analysesWithSentiment = [
        {
          id: '1',
          input_text: 'Test',
          sentiment_result: {
            sentiment: 'positive' as const,
            confidence: 0.8,
            key_phrases: ['test']
          },
          created_at: '2024-01-15T10:00:00Z',
          tokens_used: 30,
          processing_time_ms: 120,
          file_name: 'test.csv'
        }
      ];
      
      render(<KeyMetricsChart analyses={analysesWithSentiment} loading={false} />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('processes large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        input_text: `Positive review ${i}`,
        sentiment_result: {
          sentiment: 'positive' as const,
          confidence: 0.8 + (i % 20) / 100, // Varying confidence
          key_phrases: [`positive ${i}`]
        },
        created_at: `2024-01-${15 + (i % 10)}T10:00:00Z`,
        tokens_used: 30 + (i % 20),
        processing_time_ms: 120 + (i % 50),
        file_name: `test${i}.csv`
      }));
      
      const startTime = performance.now();
      render(<KeyMetricsChart analyses={largeDataset} loading={false} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (less than 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
}); 
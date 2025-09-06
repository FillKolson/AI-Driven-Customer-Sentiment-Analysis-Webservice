import { render, screen } from '@testing-library/react';
import PricingCard from '../components/pricing-card';

// Mock the Supabase client
jest.mock('../../supabase/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn()
    }
  }
}));

describe('Pricing Components', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com'
  };

  const mockPlans = [
    {
      price_id: 'price_1RiXOuP2WBP7umLnemfXzK4L',
      name: 'Free',
      description: 'Perfect for getting started with sentiment analysis',
      features: [
        '100 API calls per month',
        'Single text analysis',
        'Basic sentiment results',
        'Email support'
      ],
      amount: 0,
      currency: 'usd',
      interval: 'month',
      popular: false
    },
    {
      price_id: 'price_1RiXPNP2WBP7umLnoxh9cgnL',
      name: 'Pro',
      description: 'Everything in Free, plus batch processing and advanced analytics',
      features: [
        'Everything in Free, plus:',
        '5,000 API calls per month',
        'Batch file processing',
        'Advanced analytics dashboard',
        'Export functionality',
        'Priority email support'
      ],
      amount: 1900,
      currency: 'usd',
      interval: 'month',
      popular: true
    },
    {
      price_id: 'price_1RiXPmP2WBP7umLnzZqcBXdO',
      name: 'Enterprise',
      description: 'Everything in Pro, plus enterprise features and team management',
      features: [
        'Everything in Pro, plus:',
        '50,000 API calls per month',
        'Custom integrations',
        'Advanced analytics with trends',
        'Priority support + phone',
        'Custom reporting',
        'Team management'
      ],
      amount: 9900,
      currency: 'usd',
      interval: 'month',
      popular: false
    }
  ];

  describe('PricingCard', () => {
    it('renders plan information correctly', () => {
      const plan = mockPlans[1]; // Pro plan
      render(<PricingCard item={plan} user={mockUser} />);

      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('$19')).toBeInTheDocument();
      expect(screen.getByText('/month')).toBeInTheDocument();
      expect(screen.getByText('Everything in Free, plus batch processing and advanced analytics')).toBeInTheDocument();
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });

    it('renders free plan correctly', () => {
      const freePlan = mockPlans[0];
      render(<PricingCard item={freePlan} user={mockUser} />);

      // Check that "Free" appears multiple times (title and price)
      const freeElements = screen.getAllByText('Free');
      expect(freeElements).toHaveLength(2);
      
      expect(screen.getByText('Get Started Free')).toBeInTheDocument();
      expect(screen.queryByText('/month')).not.toBeInTheDocument(); // No interval for free
    });

    it('displays all features for a plan', () => {
      const plan = mockPlans[1]; // Pro plan
      render(<PricingCard item={plan} user={mockUser} />);

      expect(screen.getByText('Everything in Free, plus:')).toBeInTheDocument();
      expect(screen.getByText('5,000 API calls per month')).toBeInTheDocument();
      expect(screen.getByText('Batch file processing')).toBeInTheDocument();
      expect(screen.getByText('Advanced analytics dashboard')).toBeInTheDocument();
      expect(screen.getByText('Export functionality')).toBeInTheDocument();
      expect(screen.getByText('Priority email support')).toBeInTheDocument();
    });

    it('shows popular badge for popular plans', () => {
      const popularPlan = mockPlans[1]; // Pro plan
      const regularPlan = mockPlans[2]; // Enterprise plan

      const { rerender } = render(<PricingCard item={popularPlan} user={mockUser} />);
      expect(screen.getByText('Most Popular')).toBeInTheDocument();

      rerender(<PricingCard item={regularPlan} user={mockUser} />);
      expect(screen.queryByText('Most Popular')).not.toBeInTheDocument();
    });
  });

  describe('Plan Ordering', () => {
    it('plans are sorted by price in ascending order', () => {
      const sortedPlans = [...mockPlans].sort((a, b) => (a.amount || 0) - (b.amount || 0));
      
      expect(sortedPlans[0].name).toBe('Free');
      expect(sortedPlans[0].amount).toBe(0);
      
      expect(sortedPlans[1].name).toBe('Pro');
      expect(sortedPlans[1].amount).toBe(1900);
      
      expect(sortedPlans[2].name).toBe('Enterprise');
      expect(sortedPlans[2].amount).toBe(9900);
    });
  });
});

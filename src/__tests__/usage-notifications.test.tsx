import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsageDisplay from '../components/usage-display';
import UsageNotification from '../components/usage-notification';

// Mock the toast hook
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock the API call
global.fetch = jest.fn();

describe('Usage Notification System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UsageDisplay Component', () => {
    test('should display normal usage correctly', () => {
      render(<UsageDisplay currentUsage={50} usageLimit={100} />);
      
      expect(screen.getByText('Usage Percentage:')).toBeInTheDocument();
      expect(screen.getByText('Remaining Calls:')).toBeInTheDocument();
      expect(screen.getByText('50/100 calls')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    test('should show warning when usage is at 80%', () => {
      render(<UsageDisplay currentUsage={80} usageLimit={100} />);
      
      expect(screen.getByText('⚠️ You\'re approaching your usage limit. Consider upgrading your plan.')).toBeInTheDocument();
    });

    test('should show critical warning when usage is at 95%', () => {
      render(<UsageDisplay currentUsage={95} usageLimit={100} />);
      
      expect(screen.getByText('⚠️ Critical: You\'re very close to your usage limit. Upgrade soon!')).toBeInTheDocument();
    });

    test('should show exceeded warning when usage is at 100%', () => {
      render(<UsageDisplay currentUsage={100} usageLimit={100} />);
      
      expect(screen.getByText('❌ Usage limit exceeded. Please upgrade your plan to continue.')).toBeInTheDocument();
    });

    test('should not show warnings when showWarnings is false', () => {
      render(<UsageDisplay currentUsage={80} usageLimit={100} showWarnings={false} />);
      
      expect(screen.queryByText('⚠️ You\'re approaching your usage limit. Consider upgrading your plan.')).not.toBeInTheDocument();
    });

    test('should not show details when showDetails is false', () => {
      render(<UsageDisplay currentUsage={50} usageLimit={100} showDetails={false} />);
      
      expect(screen.queryByText('Usage Percentage:')).not.toBeInTheDocument();
      expect(screen.queryByText('Remaining Calls:')).not.toBeInTheDocument();
    });

    test('should render progress bar with correct styling', () => {
      const { container } = render(<UsageDisplay currentUsage={60} usageLimit={100} />);
      
      // Check that the progress bar container exists
      const progressContainer = container.querySelector('.relative');
      expect(progressContainer).toBeInTheDocument();
      
      // Check that it has the correct background color
      expect(progressContainer).toHaveClass('bg-gray-100');
    });
  });

  describe('UsageNotification Component', () => {
    test('should show notification when usage is high', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current_usage: 85,
          usage_limit: 100,
          usage_percentage: 85,
          notifications: {
            warning: true,
            critical: false,
            exceeded: false,
            shouldNotify: true,
            message: "You're approaching your monthly API usage limit. Consider upgrading your plan.",
            type: "warning"
          },
          preferences: {
            email_notifications: true,
            usage_notifications: true
          }
        })
      });

      render(<UsageNotification userId="test-user" currentUsage={85} usageLimit={100} subscriptionStatus="active" />);
      
      // Wait for the notification to appear
      await screen.findByText("You're approaching your monthly API usage limit. Consider upgrading your plan.");
    });

    test('should not show notification when usage notifications are disabled', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current_usage: 85,
          usage_limit: 100,
          usage_percentage: 85,
          notifications: {
            warning: true,
            critical: false,
            exceeded: false,
            shouldNotify: true,
            message: "You're approaching your monthly API usage limit. Consider upgrading your plan.",
            type: "warning"
          },
          preferences: {
            email_notifications: true,
            usage_notifications: false
          }
        })
      });

      render(<UsageNotification userId="test-user" currentUsage={85} usageLimit={100} subscriptionStatus="active" />);
      
      // Wait a bit and check that no notification appears
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.queryByText("You're approaching your monthly API usage limit. Consider upgrading your plan.")).not.toBeInTheDocument();
    });

    test('should not show notification when no alert is needed', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current_usage: 50,
          usage_limit: 100,
          usage_percentage: 50,
          notifications: {
            warning: false,
            critical: false,
            exceeded: false,
            shouldNotify: false,
            message: "",
            type: null
          },
          preferences: {
            email_notifications: true,
            usage_notifications: true
          }
        })
      });

      render(<UsageNotification userId="test-user" currentUsage={50} usageLimit={100} subscriptionStatus="active" />);
      
      // Wait a bit and check that no notification appears
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(screen.queryByText(/warning|critical|exceeded/i)).not.toBeInTheDocument();
    });
  });
}); 
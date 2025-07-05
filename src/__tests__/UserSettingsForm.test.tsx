import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserSettingsForm from '../components/user-settings-form';

const toastMock = jest.fn();
jest.mock('../components/ui/use-toast', () => ({
  useToast: () => ({ toast: toastMock })
}));

global.fetch = jest.fn();

describe('UserSettingsForm', () => {
  const user = {
    id: 'user-1',
    email: 'test@example.com',
    full_name: 'Test User',
    subscription_status: 'free',
    api_usage_current_month: 0,
    api_limit_per_month: 100,
    created_at: '2024-01-01',
    bio: 'Hello',
  };
  const subscription = {
    plan_name: 'pro',
    status: 'active',
    current_period_end: 9999999999,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockImplementation((url, opts) => {
      if (url === '/api/user/preferences' && (!opts || opts.method === 'GET')) {
        return Promise.resolve({ ok: true, json: async () => ({ preferences: { email_notifications: true, marketing_emails: false } }) });
      }
      if (url === '/api/user/profile' && opts && opts.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url === '/api/user/preferences' && opts && opts.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.resolve({ ok: false, json: async () => ({ error: 'Error' }) });
    });
  });

  it('renders profile fields', () => {
    render(<UserSettingsForm user={user} subscription={subscription} />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bio/i)).toBeInTheDocument();
  });

  it('updates profile successfully', async () => {
    render(<UserSettingsForm user={user} subscription={subscription} />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'New Name' } });
    const form = screen.getByLabelText(/full name/i).closest('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/profile', expect.objectContaining({ method: 'PUT' }));
    });
  });

  it('updates preferences successfully', async () => {
    render(<UserSettingsForm user={user} subscription={subscription} />);
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/user/preferences', expect.anything()));
    const prefForm = screen.getByText(/preferences/i).closest('form');
    if (prefForm) fireEvent.submit(prefForm);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/user/preferences', expect.objectContaining({ method: 'PUT' }));
    });
  });

  it('handles profile update error (toast)', async () => {
    (fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({ ok: false, json: async () => ({ error: 'Failed to update profile' }) }));
    render(<UserSettingsForm user={user} subscription={subscription} />);
    const form = screen.getByLabelText(/full name/i).closest('form');
    if (form) fireEvent.submit(form);
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/error/i),
          description: expect.stringMatching(/failed to update profile/i),
          variant: 'destructive',
        })
      );
    });
  });
}); 
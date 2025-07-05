import { encodedRedirect } from '../utils/utils';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('encodedRedirect', () => {
  it('calls redirect with correct params for error', () => {
    const { redirect } = require('next/navigation');
    encodedRedirect('error', '/login', 'Invalid credentials');
    expect(redirect).toHaveBeenCalledWith('/login?error=Invalid%20credentials');
  });

  it('calls redirect with correct params for success', () => {
    const { redirect } = require('next/navigation');
    encodedRedirect('success', '/dashboard', 'Welcome!');
    expect(redirect).toHaveBeenCalledWith('/dashboard?success=Welcome!');
  });
}); 
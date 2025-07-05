import * as route from '../app/api/user/preferences/route';
import { NextRequest } from 'next/server';

jest.mock('../../supabase/server', () => ({
  createClient: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabase: any = {
  auth: { getUser: jest.fn() },
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => ({ data: { email_notifications: true }, error: null })),
  update: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  delete: jest.fn(() => ({ error: null })),
};

beforeEach(() => {
  jest.clearAllMocks();
  require('../../supabase/server').createClient.mockResolvedValue(mockSupabase);
});

describe('user preferences API', () => {
  it('GET returns preferences for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    const req = { url: 'http://localhost/api/user/preferences' } as unknown as NextRequest;
    const res = await route.GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.preferences).toBeDefined();
  });

  it('GET returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'err' });
    const req = { url: 'http://localhost/api/user/preferences' } as unknown as NextRequest;
    const res = await route.GET(req);
    expect(res.status).toBe(401);
  });

  it('PUT updates preferences for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    mockSupabase.select.mockReturnValueOnce(mockSupabase);
    mockSupabase.single.mockReturnValueOnce({ data: { id: 1 }, error: null });
    mockSupabase.update.mockReturnValueOnce({ select: () => ({ single: () => ({ data: { id: 1 }, error: null }) }) });
    const req = { json: async () => ({ email_notifications: false }), url: 'http://localhost/api/user/preferences' } as unknown as NextRequest;
    const res = await route.PUT(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.preferences).toBeDefined();
  });

  it('PUT returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'err' });
    const req = { json: async () => ({}), url: 'http://localhost/api/user/preferences' } as unknown as NextRequest;
    const res = await route.PUT(req);
    expect(res.status).toBe(401);
  });

  it('DELETE resets preferences for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    mockSupabase.delete.mockReturnValueOnce({ error: null });
    const req = { url: 'http://localhost/api/user/preferences' } as unknown as NextRequest;
    const res = await route.DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toMatch(/reset/i);
  });

  it('DELETE returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'err' });
    const req = { url: 'http://localhost/api/user/preferences' } as unknown as NextRequest;
    const res = await route.DELETE(req);
    expect(res.status).toBe(401);
  });
}); 
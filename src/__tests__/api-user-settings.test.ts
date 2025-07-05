import * as route from '../app/api/user/settings/route';
import { NextRequest } from 'next/server';

jest.mock('../../supabase/server', () => ({
  createClient: jest.fn(),
}));
jest.mock('../../utils/userPreferences', () => ({
  getUserSettings: jest.fn(),
  upsertUserSettings: jest.fn(),
}));

const mockSupabase = {
  auth: { getUser: jest.fn() },
};
const { getUserSettings, upsertUserSettings } = require('../../utils/userPreferences');

beforeEach(() => {
  jest.clearAllMocks();
  require('../../supabase/server').createClient.mockResolvedValue(mockSupabase);
});

describe('user settings API', () => {
  it('GET returns settings for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    getUserSettings.mockResolvedValue({ theme: 'dark' });
    const req = {} as unknown as NextRequest;
    const res = await route.GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings).toBeDefined();
  });

  it('GET returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'err' });
    const req = {} as unknown as NextRequest;
    const res = await route.GET(req);
    expect(res.status).toBe(401);
  });

  it('POST updates settings for authenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    upsertUserSettings.mockResolvedValue({ theme: 'light' });
    const req = { json: async () => ({ settings: { theme: 'light' } }) } as unknown as NextRequest;
    const res = await route.POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.settings).toBeDefined();
  });

  it('POST returns 401 if not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: 'err' });
    const req = { json: async () => ({ settings: { theme: 'light' } }) } as unknown as NextRequest;
    const res = await route.POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 for invalid settings', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: '1' } }, error: null });
    const req = { json: async () => ({ settings: null }) } as unknown as NextRequest;
    const res = await route.POST(req);
    expect(res.status).toBe(400);
  });
}); 
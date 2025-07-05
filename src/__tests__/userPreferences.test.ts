import { getUserSettings, upsertUserSettings } from '../utils/userPreferences';
import { SupabaseClient } from '@supabase/supabase-js';
import { jest } from '@jest/globals';

describe('userPreferences utils', () => {
  let supabase: SupabaseClient;

  beforeEach(() => {
    supabase = {
      from: jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        upsert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
    } as unknown as SupabaseClient;
  });

  it('returns user settings on success', async () => {
    const mockData = { theme: 'dark' };
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: mockData, error: null })),
        })),
      })),
    });
    const result = await getUserSettings(supabase, 'user-1');
    expect(result).toEqual(mockData);
  });

  it('returns null on error', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: true })),
        })),
      })),
    });
    const result = await getUserSettings(supabase, 'user-1');
    expect(result).toBeNull();
  });

  it('upserts and returns user settings on success', async () => {
    const mockData = { theme: 'light' };
    (supabase.from as jest.Mock).mockReturnValueOnce({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: mockData, error: null })),
        })),
      })),
    });
    const result = await upsertUserSettings(supabase, 'user-1', { theme: 'light' });
    expect(result).toEqual(mockData);
  });

  it('returns null on upsert error', async () => {
    (supabase.from as jest.Mock).mockReturnValueOnce({
      upsert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: true })),
        })),
      })),
    });
    const result = await upsertUserSettings(supabase, 'user-1', { theme: 'light' });
    expect(result).toBeNull();
  });
});
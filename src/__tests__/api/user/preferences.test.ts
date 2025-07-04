/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "../../../app/api/user/preferences/route";
import { createClient } from "../../../../supabase/server";

// Mock Supabase client
jest.mock("../../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

(createClient as jest.Mock).mockResolvedValue(mockSupabase);

describe("/api/user/preferences", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return user preferences successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockPreferences = {
        id: "pref-123",
        user_id: "user-123",
        notifications_enabled: true,
        email_notifications: false,
        marketing_emails: true,
        theme: "dark",
        language: "en",
        timezone: "UTC",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockPreferences,
        error: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.notifications_enabled).toBe(true);
      expect(data.preferences.theme).toBe("dark");
    });

    it("should return default preferences when none exist", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116" }, // No rows found
        });

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.notifications_enabled).toBe(true);
      expect(data.preferences.email_notifications).toBe(true);
      expect(data.preferences.marketing_emails).toBe(false);
      expect(data.preferences.theme).toBe("light");
    });
  });

  describe("PUT", () => {
    it("should update existing preferences successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const updatedPreferences = {
        id: "pref-123",
        user_id: "user-123",
        notifications_enabled: false,
        email_notifications: true,
        marketing_emails: false,
        theme: "dark",
        updated_at: "2024-01-02T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock existing preferences check
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: { id: "pref-123" },
          error: null,
        });

      // Mock update operation
      mockSupabase.from().update().eq().select().single.mockResolvedValue({
        data: updatedPreferences,
        error: null,
      });

      const requestBody = {
        notifications_enabled: false,
        email_notifications: true,
        theme: "dark",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.notifications_enabled).toBe(false);
      expect(data.preferences.theme).toBe("dark");
      expect(data.message).toBe("Preferences updated successfully");
    });

    it("should create new preferences when none exist", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const newPreferences = {
        id: "pref-123",
        user_id: "user-123",
        notifications_enabled: true,
        email_notifications: false,
        marketing_emails: true,
        theme: "light",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock no existing preferences
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        });

      // Mock insert operation
      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newPreferences,
        error: null,
      });

      const requestBody = {
        notifications_enabled: true,
        email_notifications: false,
        marketing_emails: true,
      };

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.preferences.notifications_enabled).toBe(true);
      expect(data.preferences.email_notifications).toBe(false);
    });

    it("should validate theme values", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const requestBody = {
        theme: "invalid-theme",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
        {
          method: "PUT",
          body: JSON.stringify(requestBody),
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No valid preferences provided");
    });
  });

  describe("DELETE", () => {
    it("should reset preferences to defaults successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().delete().eq.mockResolvedValue({
        error: null,
      });

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
        {
          method: "DELETE",
        },
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Preferences reset to defaults successfully");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const request = new NextRequest(
        "http://localhost:3000/api/user/preferences",
        {
          method: "DELETE",
        },
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });
});

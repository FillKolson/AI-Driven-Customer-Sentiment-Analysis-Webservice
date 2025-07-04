/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET, PUT } from "../../../app/api/user/profile/route";
import { createClient } from "../../../../supabase/server";

// Mock Supabase client
jest.mock("../../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(),
      })),
    })),
    update: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

(createClient as jest.Mock).mockResolvedValue(mockSupabase);

describe("/api/user/profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET", () => {
    it("should return user profile successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const mockProfile = {
        id: "user-123",
        full_name: "Test User",
        email: "test@example.com",
        subscription_status: "free",
        api_usage_current_month: 5,
        api_limit_per_month: 100,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe("user-123");
      expect(data.user.full_name).toBe("Test User");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const request = new NextRequest("http://localhost:3000/api/user/profile");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("PUT", () => {
    it("should update user profile successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      const updatedProfile = {
        id: "user-123",
        full_name: "Updated Name",
        email: "test@example.com",
        bio: "Updated bio",
        subscription_status: "free",
        api_usage_current_month: 5,
        api_limit_per_month: 100,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.from().update().eq.mockResolvedValue({
        error: null,
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: updatedProfile,
        error: null,
      });

      const requestBody = {
        full_name: "Updated Name",
        bio: "Updated bio",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
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
      expect(data.user.full_name).toBe("Updated Name");
      expect(data.user.bio).toBe("Updated bio");
      expect(data.message).toBe("Profile updated successfully");
    });

    it("should validate email format", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const requestBody = {
        email: "invalid-email",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
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
      expect(data.error).toBe("Invalid email format");
    });

    it("should handle auth email update failure", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        error: { message: "Email already exists" },
      });

      const requestBody = {
        email: "existing@example.com",
      };

      const request = new NextRequest(
        "http://localhost:3000/api/user/profile",
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
      expect(data.error).toContain("Failed to update email");
    });
  });
});

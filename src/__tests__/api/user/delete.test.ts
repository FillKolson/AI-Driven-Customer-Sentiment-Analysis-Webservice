/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { DELETE } from "../../../app/api/user/delete/route";
import { createClient } from "../../../../supabase/server";

// Mock Supabase client
jest.mock("../../../../supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    admin: {
      deleteUser: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    delete: jest.fn(() => ({
      eq: jest.fn(),
    })),
  })),
};

(createClient as jest.Mock).mockResolvedValue(mockSupabase);

describe("/api/user/delete", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("DELETE", () => {
    it("should delete user account successfully", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock all delete operations to succeed
      mockSupabase.from().delete().eq.mockResolvedValue({ error: null });
      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null });

      const requestBody = {
        confirm_deletion: true,
      };

      const request = new NextRequest("http://localhost:3000/api/user/delete", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Account successfully deleted");

      // Verify all delete operations were called
      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.from).toHaveBeenCalledWith("sentiment_analyses");
      expect(mockSupabase.from).toHaveBeenCalledWith("usage_tracking");
      expect(mockSupabase.from).toHaveBeenCalledWith("batch_jobs");
      expect(mockSupabase.from).toHaveBeenCalledWith("subscriptions");
      expect(mockSupabase.from).toHaveBeenCalledWith("users");
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(
        "user-123",
      );
    });

    it("should require deletion confirmation", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const requestBody = {
        confirm_deletion: false,
      };

      const request = new NextRequest("http://localhost:3000/api/user/delete", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Account deletion must be confirmed");
    });

    it("should return 401 for unauthenticated user", async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      });

      const requestBody = {
        confirm_deletion: true,
      };

      const request = new NextRequest("http://localhost:3000/api/user/delete", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle partial deletion failures", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      // Mock some operations to fail
      let callCount = 0;
      mockSupabase
        .from()
        .delete()
        .eq.mockImplementation(() => {
          callCount++;
          if (callCount === 2) {
            // Second call (sentiment_analyses) fails
            return { error: { message: "Database error" } };
          }
          return { error: null };
        });

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null });

      const requestBody = {
        confirm_deletion: true,
      };

      const request = new NextRequest("http://localhost:3000/api/user/delete", {
        method: "DELETE",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(
        "Partial deletion completed. Some data may remain.",
      );
      expect(data.details).toContain("analyses: Database error");
    });
  });
});

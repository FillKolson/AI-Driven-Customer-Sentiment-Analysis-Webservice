/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UserSettingsForm from "../../components/user-settings-form";
import { useToast } from "../../components/ui/use-toast";

// Mock the toast hook
jest.mock("../../components/ui/use-toast", () => ({
  useToast: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockToast = jest.fn();
(useToast as jest.Mock).mockReturnValue({ toast: mockToast });

const mockUser = {
  id: "user-123",
  email: "kiril.shevv4enko@gmail.com",
  full_name: "Test User",
  subscription_status: "free",
  api_usage_current_month: 25,
  api_limit_per_month: 100,
  created_at: "2025-06-01T00:00:00Z",
};

const mockSubscription = {
  plan_name: "pro",
  status: "active",
  current_period_end: 1735689600, // 2025-01-01
};

describe("UserSettingsForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockClear();
  });

  it("should render user information correctly", () => {
    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("kiril.shevv4enko@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("PRO")).toBeInTheDocument();
    expect(screen.getByText("25 / 100")).toBeInTheDocument();
  });

  it("should render without subscription", () => {
    render(<UserSettingsForm user={mockUser} subscription={null} />);

    expect(screen.getByText("FREE")).toBeInTheDocument();
    expect(screen.queryByText("Next Billing Date")).not.toBeInTheDocument();
  });

  it("should update profile successfully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Failed to update profile. Please try again." }),
    });

    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    const nameInput = screen.getByDisplayValue("Test User");
    fireEvent.change(nameInput, { target: { value: "Updated Name" } });

    const updateButton = screen.getByRole("button", {
      name: /update profile/i,
    });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    });
  });

  it("handles profile update error (toast)", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Failed to update profile. Please try again." }),
    });

    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    const nameInput = screen.getByDisplayValue("Test User");
    fireEvent.change(nameInput, { target: { value: "New Name" } });

    const updateProfileButton = screen.getByRole("button", {
      name: /update profile/i,
    });
    fireEvent.click(updateProfileButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.stringMatching(/error/i),
          description: expect.stringMatching(/failed to update profile/i),
          variant: "destructive",
        })
      );
    });
  });

  it("should update preferences successfully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Preferences updated successfully" }),
    });

    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    // Find the checkbox and click it
    const emailNotificationsCheckbox = screen.getByLabelText(/email notifications/i);
    fireEvent.click(emailNotificationsCheckbox);

    // Find the button in the notification preferences form
    const updatePreferencesButton = screen.getByRole("button", { name: /update preferences/i });
    fireEvent.click(updatePreferencesButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/user/preferences",
        expect.anything()
      );
    });
  });

  it("should show loading state during update", async () => {
    (fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ ok: true, json: async () => ({}) }), 100);
        }),
    );

    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    const updateButton = screen.getByRole("button", {
      name: /update profile/i,
    });
    fireEvent.click(updateButton);

    expect(updateButton).toBeDisabled();
    expect(screen.getByText(/update profile/i)).toBeInTheDocument();
  });

  it("should display API usage progress correctly", () => {
    const userWithHighUsage = {
      ...mockUser,
      api_usage_current_month: 80,
      api_limit_per_month: 100,
    };

    render(
      <UserSettingsForm
        user={userWithHighUsage}
        subscription={mockSubscription}
      />,
    );

    expect(screen.getByText("80 / 100")).toBeInTheDocument();

    const progressBar = document.querySelector(".bg-blue-600");
    expect(progressBar).toHaveStyle("width: 80%");
  });

  it("should format dates correctly", () => {
    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    expect(screen.getByText("June 1, 2025")).toBeInTheDocument(); // Account created
    expect(screen.getByText("1/1/2025")).toBeInTheDocument(); // Next billing date
  });

  it("should handle checkbox interactions", async () => {
    render(
      <UserSettingsForm user={mockUser} subscription={mockSubscription} />,
    );

    const emailNotificationsCheckbox = screen.getByLabelText(/email notifications/i);
    fireEvent.click(emailNotificationsCheckbox);
    expect(emailNotificationsCheckbox).toHaveProperty("checked", true);
  });
});

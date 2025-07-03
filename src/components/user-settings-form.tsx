"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { useToast } from "./ui/use-toast";
import { Loader2, User, CreditCard, Settings, Bell } from "lucide-react";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  subscription_status: string;
  api_usage_current_month: number;
  api_limit_per_month: number;
  created_at: string;
  bio?: string;
}

interface SubscriptionData {
  plan_name: string;
  status: string;
  current_period_end: number;
}

interface UserSettingsFormProps {
  user: UserData;
  subscription: SubscriptionData | null;
}

export default function UserSettingsForm({
  user,
  subscription,
}: UserSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    bio: user.bio || "",
    notifications_enabled: true,
    email_notifications: true,
    marketing_emails: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/user/preferences");
        if (!response.ok) throw new Error("Failed to load preferences");
        const result = await response.json();
        if (result.preferences) {
          setFormData((prev) => ({
            ...prev,
            notifications_enabled: result.preferences.notifications_enabled ?? true,
            email_notifications: result.preferences.email_notifications ?? true,
            marketing_emails: result.preferences.marketing_emails ?? false,
          }));
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load preferences. Using defaults.",
          variant: "destructive",
        });
      } finally {
        setPreferencesLoading(false);
      }
    }
    fetchPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          bio: formData.bio,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile");
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notifications_enabled: formData.notifications_enabled,
          email_notifications: formData.email_notifications,
          marketing_emails: formData.marketing_emails,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      toast({
        title: "Preferences updated",
        description: "Your preferences have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information and profile details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter your email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Account Information</CardTitle>
          </div>
          <CardDescription>
            View your account details and subscription information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-500">
                Account Created
              </Label>
              <p className="text-sm">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">
                User ID
              </Label>
              <p className="text-sm font-mono">{user.id}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-500">
                Current Plan
              </Label>
              <Badge
                className={getPlanBadgeColor(subscription?.plan_name || "free")}
              >
                {subscription?.plan_name?.toUpperCase() || "FREE"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-500">
                API Usage This Month
              </Label>
              <span className="text-sm">
                {user.api_usage_current_month} / {user.api_limit_per_month}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((user.api_usage_current_month / user.api_limit_per_month) * 100, 100)}%`,
                }}
              />
            </div>

            {subscription && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-500">
                  Next Billing Date
                </Label>
                <span className="text-sm">
                  {new Date(
                    subscription.current_period_end * 1000,
                  ).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
          <CardDescription>
            Manage how you receive notifications and updates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preferencesLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-500">Loading preferences...</span>
            </div>
          ) : (
            <form onSubmit={handlePreferencesSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="notifications_enabled"
                      className="text-sm font-medium"
                    >
                      Push Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive notifications about your analyses
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="notifications_enabled"
                    checked={formData.notifications_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        notifications_enabled: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="email_notifications"
                      className="text-sm font-medium"
                    >
                      Email Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive email updates about your account
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="email_notifications"
                    checked={formData.email_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email_notifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="marketing_emails"
                      className="text-sm font-medium"
                    >
                      Marketing Emails
                    </Label>
                    <p className="text-xs text-gray-500">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="marketing_emails"
                    checked={formData.marketing_emails}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        marketing_emails: e.target.checked,
                      })
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Preferences
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

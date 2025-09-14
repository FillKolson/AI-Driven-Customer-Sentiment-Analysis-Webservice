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
import { useRouter } from 'next/navigation';

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

interface UserSettingsFormProps {
  user: UserData;
}

export default function UserSettingsForm({
  user,
}: UserSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [errors, setErrors] = useState<{full_name?: string}>({});
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    email: user.email,
    bio: user.bio || "",
    email_notifications: true,
    marketing_emails: false,
    usage_notifications: true,
  });
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchPreferences() {
      try {
        const response = await fetch("/api/user/preferences");
        if (!response.ok) throw new Error("Failed to load preferences");
        const result = await response.json();
        if (result.preferences) {
          setFormData((prev) => ({
            ...prev,
            email_notifications: result.preferences.email_notifications ?? true,
            marketing_emails: result.preferences.marketing_emails ?? false,
            usage_notifications: result.preferences.usage_notifications ?? true,
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

  const validateForm = () => {
    const newErrors: {full_name?: string} = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
          email_notifications: formData.email_notifications,
          marketing_emails: formData.marketing_emails,
          usage_notifications: formData.usage_notifications,
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

  const getPlanBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pro":
        return "bg-blue-100 text-blue-800";
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "free":
        return "bg-green-100 text-green-800";
      case "none":
        return "bg-gray-100 text-gray-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Compute usage percent and color class for the API usage bar
  const safeLimit = Number(user.api_limit_per_month) || 0;
  const used = Math.max(0, Number(user.api_usage_current_month) || 0);
  const rawPercent = safeLimit > 0 ? (used / safeLimit) * 100 : 0;
  const usagePercent = Math.min(Math.max(rawPercent, 0), 100);

  // Map thresholds to Tailwind classes
  // > 50% -> yellow, > 80% -> orange, > 95% -> red, = 100% -> red shaded with black
  let usageColorClass = "bg-blue-600";
  if (usagePercent >= 100) {
    usageColorClass = "bg-red-700"; // base for 100% case; stripes added via inline style
  } else if (usagePercent > 95) {
    usageColorClass = "bg-red-600";
  } else if (usagePercent > 80) {
    usageColorClass = "bg-orange-500";
  } else if (usagePercent > 50) {
    usageColorClass = "bg-yellow-500";
  }

  const usageStripeStyle = usagePercent === 100
    ? {
        backgroundImage:
          "repeating-linear-gradient(45deg, #b91c1c, #b91c1c 10px, #000000 10px, #000000 20px)",
      }
    : undefined;

  return (
    <div className="space-y-6">
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
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    // Clear error when user starts typing
                    if (errors.full_name) {
                      setErrors({...errors, full_name: undefined});
                    }
                  }}
                  disabled={isLoading}
                  className={errors.full_name ? 'border-red-500' : ''}
                />
                {errors.full_name && (
                  <p className="text-sm text-red-500 mt-1">{errors.full_name}</p>
                )}
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
              <div className="flex justify-between items-center">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <span className="text-xs text-gray-500">
                  {formData.bio.length}/100
                </span>
              </div>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value.slice(0, 100) })
                }
                placeholder="Tell us about yourself (max 100 characters)"
                rows={3}
                maxLength={100}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Profile
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <CardTitle>Subscription</CardTitle>
          </div>
          <CardDescription>
            Manage your subscription plan and billing.
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
              <div className="flex items-center gap-2">
                {user.subscription_status !== 'free' && (
                  !unsubscribed ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const res = await fetch('/api/user/unsubscribe', { method: 'POST' });
                          if (!res.ok) {
                            const err = await res.json().catch(() => ({}));
                            throw new Error(err.error || 'Failed to unsubscribe');
                          }
                          setUnsubscribed(true);
                          toast({ 
                            title: 'Unsubscribed', 
                            description: 'Auto-renewal turned off. You can use your plan until the period ends.'
                          });
                        } catch (error) {
                          let message = 'Failed to unsubscribe';
                          if (error instanceof Error) {
                            message = error.message;
                          }
                          toast({ 
                            title: 'Error', 
                            description: message, 
                            variant: 'destructive' 
                          });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                    >
                      Unsubscribe
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={async () => {
                        setIsLoading(true);
                        try {
                          const res = await fetch('/api/user/restore-subscription', { method: 'POST' });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            throw new Error(data.error || 'Failed to restore subscription');
                          }
                          setUnsubscribed(false);
                          toast({ title: 'Subscription restored', description: 'Auto-renewal turned back on.' });
                        } catch (error) {
                          let message = 'Failed to restore subscription';
                          if (error instanceof Error) message = error.message;
                          toast({ title: 'Error', description: message, variant: 'destructive' });
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="ml-2"
                    >
                      Restore subscription
                    </Button>
                  )
                )}
                <Button
                  size="sm"
                  onClick={() => router.push('/pricing')}
                  className="ml-2"
                >
                  {user.subscription_status === 'free' ? (
                    <span>Upgrade</span>
                  ) : (
                    <span>Manage</span>
                  )}
                </Button>
                <span 
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPlanBadgeColor(user.subscription_status || 'none')}`}
                >
                  {(user.subscription_status || 'NONE').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-500">
                API Usage This Month
              </Label>
              <span className="text-sm">
                {typeof user.api_usage_current_month === 'number' ? user.api_usage_current_month : 0} / {user.api_limit_per_month}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${usageColorClass} h-2 rounded-full transition-all duration-300`}
                style={{
                  width: `${usagePercent}%`,
                  ...(usageStripeStyle || {}),
                }}
                aria-label={`API usage ${Math.round(usagePercent)}%`}
                title={`API usage ${Math.round(usagePercent)}%`}
              />
            </div>

            {/* <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-500">
                Status
              </Label>
              <span className="text-sm capitalize">
                {user.subscription_status || 'Inactive'}
              </span>
            </div> */}
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label
                      htmlFor="usage_notifications"
                      className="text-sm font-medium"
                    >
                      Usage Notifications
                    </Label>
                    <p className="text-xs text-gray-500">
                      Get alerts when approaching your API usage limits
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="usage_notifications"
                    checked={formData.usage_notifications}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        usage_notifications: e.target.checked,
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

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's current usage and preferences
    const { data: userData } = await supabase
      .from("users")
      .select(
        "api_usage_current_month, api_limit_per_month, subscription_status",
      )
      .eq("id", user.id)
      .single();

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("email_notifications, usage_notifications")
      .eq("user_id", user.id)
      .single();

    if (!userData) {
      return NextResponse.json({ error: "User data not found" }, { status: 404 });
    }

    const currentUsage = userData.api_usage_current_month || 0;
    const usageLimit = userData.api_limit_per_month || 100;
    const usagePercentage = (currentUsage / usageLimit) * 100;

    // Define notification thresholds
    const thresholds = {
      warning: 80, // 80% of limit
      critical: 95, // 95% of limit
      exceeded: 100, // 100% of limit
    };

    // Check if user should be notified
    const notifications = {
      warning: usagePercentage >= thresholds.warning && usagePercentage < thresholds.critical,
      critical: usagePercentage >= thresholds.critical && usagePercentage < thresholds.exceeded,
      exceeded: usagePercentage >= thresholds.exceeded,
      shouldNotify: false,
      message: "",
      type: "" as "warning" | "critical" | "exceeded" | null,
    };

    if (notifications.exceeded) {
      notifications.shouldNotify = true;
      notifications.message = "You have exceeded your monthly API usage limit. Please upgrade your plan to continue.";
      notifications.type = "exceeded";
    } else if (notifications.critical) {
      notifications.shouldNotify = true;
      notifications.message = "You're very close to your monthly API usage limit. Consider upgrading your plan soon.";
      notifications.type = "critical";
    } else if (notifications.warning) {
      notifications.shouldNotify = true;
      notifications.message = "You're approaching your monthly API usage limit. Consider upgrading your plan.";
      notifications.type = "warning";
    }

    return NextResponse.json({
      current_usage: currentUsage,
      usage_limit: usageLimit,
      usage_percentage: usagePercentage,
      notifications,
      preferences: {
        email_notifications: preferences?.email_notifications ?? true,
        usage_notifications: preferences?.usage_notifications ?? true,
      },
    });
  } catch (error) {
    console.error("Usage notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { usage_notifications } = body;

    // Update user preferences
    const { data: existingPreferences } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let result;
    if (existingPreferences) {
      // Update existing preferences
      result = await supabase
        .from("user_preferences")
        .update({
          usage_notifications: typeof usage_notifications === "boolean" ? usage_notifications : true,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();
    } else {
      // Insert new preferences
      result = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          usage_notifications: typeof usage_notifications === "boolean" ? usage_notifications : true,
          email_notifications: true,
          marketing_emails: false,
          theme: "light",
          language: "en",
          timezone: "UTC",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error updating preferences:", result.error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Usage notification preferences updated successfully",
      preferences: result.data,
    });
  } catch (error) {
    console.error("Update usage notifications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 
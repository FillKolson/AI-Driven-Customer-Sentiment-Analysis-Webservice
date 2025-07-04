import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

export async function DELETE(request: NextRequest) {
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

    // Get confirmation from request body
    const { confirm_deletion } = await request.json();
    if (!confirm_deletion) {
      return NextResponse.json(
        { error: "Account deletion must be confirmed" },
        { status: 400 },
      );
    }

    // Start transaction-like cleanup
    const errors = [];

    // Delete user preferences
    const { error: preferencesError } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id);
    if (preferencesError)
      errors.push("preferences: " + preferencesError.message);

    // Delete sentiment analyses
    const { error: analysesError } = await supabase
      .from("sentiment_analyses")
      .delete()
      .eq("user_id", user.id);
    if (analysesError) errors.push("analyses: " + analysesError.message);

    // Delete usage tracking
    const { error: usageError } = await supabase
      .from("usage_tracking")
      .delete()
      .eq("user_id", user.id);
    if (usageError) errors.push("usage: " + usageError.message);

    // Delete batch jobs
    const { error: batchError } = await supabase
      .from("batch_jobs")
      .delete()
      .eq("user_id", user.id);
    if (batchError) errors.push("batch_jobs: " + batchError.message);

    // Delete subscriptions
    const { error: subscriptionsError } = await supabase
      .from("subscriptions")
      .delete()
      .eq("user_id", user.id);
    if (subscriptionsError)
      errors.push("subscriptions: " + subscriptionsError.message);

    // Delete user profile
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .eq("id", user.id);
    if (userError) errors.push("user: " + userError.message);

    // Delete auth user (this should be last)
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(
      user.id,
    );
    if (authDeleteError) errors.push("auth: " + authDeleteError.message);

    if (errors.length > 0) {
      console.error("Account deletion errors:", errors);
      return NextResponse.json(
        {
          error: "Partial deletion completed. Some data may remain.",
          details: errors,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Account successfully deleted",
    });
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

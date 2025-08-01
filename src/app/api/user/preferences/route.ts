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

    // Get user preferences
    const { data: preferences, error: preferencesError } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (preferencesError && preferencesError.code !== "PGRST116") {
      console.error("Error fetching preferences:", preferencesError);
      return NextResponse.json(
        { error: "Failed to fetch preferences" },
        { status: 500 },
      );
    }

    // Return default preferences if none exist
    const defaultPreferences = {
      email_notifications: true,
      marketing_emails: false,
      theme: "light",
      language: "en",
      timezone: "UTC",
    };

    return NextResponse.json({
      preferences: preferences || defaultPreferences,
    });
  } catch (error) {
    console.error("Preferences fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const {
      email_notifications,
      marketing_emails,
      usage_notifications,
      theme,
      language,
      timezone,
    } = body;

    // Use defaults for all fields
    const validatedData: any = {
      email_notifications: typeof email_notifications === "boolean" ? email_notifications : true,
      marketing_emails: typeof marketing_emails === "boolean" ? marketing_emails : false,
      usage_notifications: typeof usage_notifications === "boolean" ? usage_notifications : true,
      theme: typeof theme === "string" && ["light", "dark", "system"].includes(theme) ? theme : "light",
      language: typeof language === "string" ? language : "en",
      timezone: typeof timezone === "string" ? timezone : "UTC",
    };

    // Update or insert preferences
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
          ...validatedData,
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
          ...validatedData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error("Error updating preferences:", result.error);
      return NextResponse.json(
        { error: "Failed to update preferences: " + result.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      preferences: result.data,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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

    // Delete user preferences (reset to defaults)
    const { error: deleteError } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting preferences:", deleteError);
      return NextResponse.json(
        { error: "Failed to reset preferences" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Preferences reset to defaults successfully",
    });
  } catch (error) {
    console.error("Preferences delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

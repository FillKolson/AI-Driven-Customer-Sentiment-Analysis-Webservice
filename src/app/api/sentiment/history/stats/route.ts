import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";

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

    // Fetch user's subscription status
    const { data: userData } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", user.id)
      .single();

    if (userData && userData.subscription_status === 'none') {
      return NextResponse.json(
        { error: 'API access is unavailable without a subscription.' },
        { status: 403 },
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sentiment = searchParams.get("sentiment");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Build query for all analyses (no pagination)
    let query = supabase
      .from("sentiment_analyses")
      .select("*")
      .eq("user_id", user.id);

    // Apply sorting
    if (sortBy === "file_name") {
      query = query.order("file_name", { ascending: sortOrder === "asc" });
    } else if (sortBy === "sentiment") {
      query = query.order("sentiment_result->sentiment", { ascending: sortOrder === "asc" });
    } else {
      query = query.order("created_at", { ascending: sortOrder === "asc" });
    }

    // Apply filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", dateTo);
    }
    if (sentiment && ["positive", "negative", "neutral"].includes(sentiment)) {
      query = query.contains("sentiment_result", { sentiment });
    }

    const { data: analyses, error } = await query;

    if (error) {
      console.error("Error fetching analyses stats:", error);
      return NextResponse.json(
        { error: "Failed to fetch analyses statistics" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      analyses: analyses || [],
      total: analyses?.length || 0,
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 
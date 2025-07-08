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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const sentiment = searchParams.get("sentiment");

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("sentiment_analyses")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

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

    const { data: analyses, error, count } = await query;

    if (error) {
      console.error("Error fetching analyses:", error);
      return NextResponse.json(
        { error: "Failed to fetch analyses" },
        { status: 500 },
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      analyses: analyses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

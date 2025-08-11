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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const sentiment = searchParams.get("sentiment");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    // Build query to get all analyses (no pagination for CSV download)
    let query = supabase
      .from("sentiment_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

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
      console.error("Error fetching analyses for CSV:", error);
      return NextResponse.json(
        { error: "Failed to fetch analyses" },
        { status: 500 },
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      "ID",
      "Input Text",
      "File Name",
      "Sentiment",
      "Confidence (%)",
      "Key Phrases",
      "Analysis Type",
      "Tokens Used",
      "Processing Time (ms)",
      "Created At"
    ];

    const csvRows = analyses?.map((analysis) => [
      analysis.id,
      `"${analysis.input_text.replace(/"/g, '""')}"`, // Escape quotes in text
      analysis.file_name || "Single Analysis",
      analysis.sentiment_result.sentiment,
      Math.round(analysis.sentiment_result.confidence * 100),
      `"${analysis.sentiment_result.key_phrases.join(", ")}"`,
      analysis.analysis_type || "single_text",
      analysis.tokens_used || 0,
      analysis.processing_time_ms || 0,
      new Date(analysis.created_at).toISOString()
    ]) || [];

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `sentiment-analysis-history-${dateStr}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("CSV download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
} 
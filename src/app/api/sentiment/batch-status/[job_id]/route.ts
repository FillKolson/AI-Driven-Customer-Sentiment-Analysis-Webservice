import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../../supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { job_id: string } }
) {
  try {
    const supabase = await createClient();
    const { job_id } = params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("batch_jobs")
      .select("status, processed_entries, total_entries, results, summary, error_message")
      .eq("job_id", job_id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const progress = data.total_entries > 0 ? Math.round((data.processed_entries / data.total_entries) * 100) : 0;

    return NextResponse.json({
      status: data.status,
      progress,
      results: data.results,
      summary: data.summary,
      error: data.error_message
    });

  } catch (error) {
    console.error("Batch status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

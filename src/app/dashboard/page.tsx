import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import DashboardContent from "@/components/dashboard-content";
import { Toaster } from "@/components/ui/toaster";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent
        userId={user.id}
        currentUsage={profile?.api_usage_current_month || 0}
        usageLimit={profile?.api_limit_per_month || 100}
        subscriptionStatus={profile?.subscription_status || "free"}
      />
      <Toaster />
    </div>
  );
}

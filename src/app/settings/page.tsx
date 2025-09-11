import { createClient } from "../../../supabase/server";
import { redirect } from "next/navigation";
import UserSettingsForm from "@/components/user-settings-form";
import { Toaster } from "@/components/ui/toaster";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get user profile data with subscription info
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600">We couldn't find your profile information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your profile, preferences, and account settings
            </p>
          </header>

          <UserSettingsForm
            user={{
              id: user.id,
              email: user.email || "",
              full_name: profile.full_name || profile.name || "",
              bio: profile.bio || "",
              subscription_status: profile.subscription_status || "free",
              api_usage_current_month: profile.api_usage_current_month || 0,
              api_limit_per_month: profile.api_limit_per_month || 0,
              created_at: profile.created_at || new Date().toISOString(),
            }}
          />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

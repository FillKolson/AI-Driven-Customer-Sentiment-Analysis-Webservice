"use client";

import DashboardStats from "@/components/dashboard-stats";
import CsvDataUploader from "@/components/csv-data-uploader";

interface DashboardContentProps {
  userId: string;
  currentUsage: number;
  usageLimit: number;
  subscriptionStatus: string;
}

export default function DashboardContent({
  userId,
  currentUsage,
  usageLimit,
  subscriptionStatus,
}: DashboardContentProps) {
  return (
    <main className="w-full">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900">
            Sentiment Analysis Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your data and view analytics
          </p>
        </header>

        {/* Stats Overview */}
        <DashboardStats userId={userId} />

        {/* Main Content */}
        <div>
          {/* CSV Data Uploader */}
          <section className="mt-8">
            <CsvDataUploader userId={userId} />
          </section>
        </div>
      </div>
    </main>
  );
}
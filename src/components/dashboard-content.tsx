"use client";

import { useState } from "react";
import SentimentAnalyzer from "@/components/sentiment-analyzer";
import FileUpload from "@/components/file-upload";
import BatchAnalysisResults from "@/components/batch-analysis-results";
import DashboardStats from "@/components/dashboard-stats";
import RecentAnalyses from "@/components/recent-analyses";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Upload } from "lucide-react";

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
  const [batchResults, setBatchResults] = useState<any>(null);
  const [showBatchResults, setShowBatchResults] = useState(false);

  const handleBatchAnalysisComplete = (results: any) => {
    setBatchResults(results);
    setShowBatchResults(true);
  };

  const handleCloseBatchResults = () => {
    setShowBatchResults(false);
    setBatchResults(null);
  };

  return (
    <main className="w-full">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <header className="">
          <h1 className="text-3xl font-bold text-gray-900">
            Sentiment Analysis Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Analyze customer feedback and gain actionable insights
          </p>
        </header>

        {/* Stats Overview */}
        <DashboardStats userId={userId} />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Tools */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="batch" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="batch" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Batch Analysis
                </TabsTrigger>
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Single Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="mt-6">
                <SentimentAnalyzer
                  userId={userId}
                  currentUsage={currentUsage}
                  usageLimit={usageLimit}
                  subscriptionStatus={subscriptionStatus}
                />
              </TabsContent>

              <TabsContent value="batch" className="mt-6">
                <FileUpload
                  userId={userId}
                  currentUsage={currentUsage}
                  usageLimit={usageLimit}
                  subscriptionStatus={subscriptionStatus}
                  onAnalysisComplete={handleBatchAnalysisComplete}
                />
              </TabsContent>
            </Tabs>

            {/* Batch Analysis Results */}
            {showBatchResults && batchResults && (
              <BatchAnalysisResults
                results={batchResults}
                onClose={handleCloseBatchResults}
              />
            )}
          </div>

          {/* Recent Analyses */}
          <div className="space-y-6">
            <RecentAnalyses userId={userId} />
          </div>
        </div>
      </div>
    </main>
  );
} 
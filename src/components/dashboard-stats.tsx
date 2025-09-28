"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { TrendingUp, BarChart3, Clock } from "lucide-react";

interface DashboardStatsProps {
  userId: string;
}

interface AnalyticsData {
  total_analyses: number;
  sentiment_distribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  daily_usage: Array<{ date: string; count: number }>;
}

export default function DashboardStats({ userId }: DashboardStatsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics/dashboard?period=30d");
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-white">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalSentiments = analytics
    ? analytics.sentiment_distribution.positive +
      analytics.sentiment_distribution.negative +
      analytics.sentiment_distribution.neutral
    : 0;

  const positivePercentage =
    totalSentiments > 0
      ? Math.round(
          (analytics!.sentiment_distribution.positive / totalSentiments) * 100,
        )
      : 0;

  const recentActivity =
    analytics?.daily_usage.slice(-7).reduce((sum, day) => sum + day.count, 0) ||
    0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Analyses */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Analyses
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {analytics?.total_analyses || 0}
          </div>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </CardContent>
      </Card>

      {/* Positive Sentiment Rate */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Positive Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {positivePercentage}%
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {analytics?.sentiment_distribution.positive || 0} positive out of{" "}
            {totalSentiments}
          </p>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Recent Activity
          </CardTitle>
          <Clock className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {recentActivity}
          </div>
          <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
        </CardContent>
      </Card>
    </div>
  );
}

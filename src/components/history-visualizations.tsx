"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, TrendingUp, TrendingDown, Minus, BarChart3, PieChart as PieChartIcon, Activity } from "lucide-react";

interface Analysis {
  id: string;
  input_text: string;
  sentiment_result: {
    sentiment: "positive" | "negative" | "neutral";
    confidence: number;
    key_phrases: string[];
  };
  created_at: string;
  tokens_used: number;
  processing_time_ms: number;
}

interface VisualizationData {
  sentimentDistribution: Array<{ name: string; value: number; color: string }>;
  confidenceDistribution: Array<{ range: string; count: number }>;
  dailySentimentTrend: Array<{ date: string; positive: number; negative: number; neutral: number }>;
  keyPhrasesFrequency: Array<{ phrase: string; count: number }>;
  monthlyTrend: Array<{ month: string; total: number; positive: number; negative: number; neutral: number }>;
}

interface HistoryVisualizationsProps {
  analyses: Analysis[];
  loading: boolean;
}

const COLORS = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral: "#6b7280",
};

export default function HistoryVisualizations({ analyses, loading }: HistoryVisualizationsProps) {
  const [visualizationData, setVisualizationData] = useState<VisualizationData>({
    sentimentDistribution: [],
    confidenceDistribution: [],
    dailySentimentTrend: [],
    keyPhrasesFrequency: [],
    monthlyTrend: [],
  });

  useEffect(() => {
    if (analyses.length > 0) {
      processDataForVisualizations();
    }
  }, [analyses]);

  const processDataForVisualizations = () => {
    // Sentiment Distribution (Pie Chart)
    const sentimentCounts = analyses.reduce((acc, analysis) => {
      const sentiment = analysis.sentiment_result.sentiment;
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sentimentDistribution = Object.entries(sentimentCounts).map(([sentiment, count]) => ({
      name: sentiment.charAt(0).toUpperCase() + sentiment.slice(1),
      value: count,
      color: COLORS[sentiment as keyof typeof COLORS],
    }));

    // Confidence Distribution (Bar Chart)
    const confidenceRanges = [
      { min: 0, max: 0.2, label: "0-20%" },
      { min: 0.2, max: 0.4, label: "20-40%" },
      { min: 0.4, max: 0.6, label: "40-60%" },
      { min: 0.6, max: 0.8, label: "60-80%" },
      { min: 0.8, max: 1, label: "80-100%" },
    ];

    const confidenceDistribution = confidenceRanges.map(range => ({
      range: range.label,
      count: analyses.filter(analysis => 
        analysis.sentiment_result.confidence >= range.min && 
        analysis.sentiment_result.confidence < range.max
      ).length,
    }));

    // Daily Sentiment Trend (Line Chart)
    const dailyData = analyses.reduce((acc, analysis) => {
      const date = new Date(analysis.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { positive: 0, negative: 0, neutral: 0 };
      }
      acc[date][analysis.sentiment_result.sentiment]++;
      return acc;
    }, {} as Record<string, { positive: number; negative: number; neutral: number }>);

    const dailySentimentTrend = Object.entries(dailyData)
      .map(([date, counts]) => ({
        date,
        ...counts,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days

    // Key Phrases Frequency (Bar Chart)
    const phraseCounts = analyses.reduce((acc, analysis) => {
      analysis.sentiment_result.key_phrases.forEach(phrase => {
        acc[phrase] = (acc[phrase] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const keyPhrasesFrequency = Object.entries(phraseCounts)
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 phrases



    // Monthly Trend (Area Chart)
    const monthlyData = analyses.reduce((acc, analysis) => {
      const month = new Date(analysis.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      });
      if (!acc[month]) {
        acc[month] = { total: 0, positive: 0, negative: 0, neutral: 0 };
      }
      acc[month].total++;
      acc[month][analysis.sentiment_result.sentiment]++;
      return acc;
    }, {} as Record<string, { total: number; positive: number; negative: number; neutral: number }>);

    const monthlyTrend = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    setVisualizationData({
      sentimentDistribution,
      confidenceDistribution,
      dailySentimentTrend,
      keyPhrasesFrequency,
      monthlyTrend,
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="mb-8">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No data available for visualizations</p>
            <p className="text-sm mt-1">Start analyzing text to see charts and graphs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 mb-8">


      {/* Charts in Row Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={visualizationData.sentimentDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {visualizationData.sentimentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different chart types */}
        <Tabs defaultValue="trend" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="trend" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Daily Trend
            </TabsTrigger>
            <TabsTrigger value="confidence" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Confidence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sentiment Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visualizationData.dailySentimentTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="positive" 
                        stroke={COLORS.positive} 
                        strokeWidth={2}
                        name="Positive"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="negative" 
                        stroke={COLORS.negative} 
                        strokeWidth={2}
                        name="Negative"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="neutral" 
                        stroke={COLORS.neutral} 
                        strokeWidth={2}
                        name="Neutral"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="confidence" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Confidence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={visualizationData.confidenceDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Second Row - Monthly Trend and Key Phrases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend - Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Analysis Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={visualizationData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="positive" 
                    stackId="1" 
                    stroke={COLORS.positive} 
                    fill={COLORS.positive} 
                    fillOpacity={0.6}
                    name="Positive"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="negative" 
                    stackId="1" 
                    stroke={COLORS.negative} 
                    fill={COLORS.negative} 
                    fillOpacity={0.6}
                    name="Negative"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="neutral" 
                    stackId="1" 
                    stroke={COLORS.neutral} 
                    fill={COLORS.neutral} 
                    fillOpacity={0.6}
                    name="Neutral"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Most Common Key Phrases */}
        <Card>
          <CardHeader>
            <CardTitle>Most Common Key Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 overflow-y-auto">
              <ResponsiveContainer 
                width="100%" 
                height={Math.max(400, visualizationData.keyPhrasesFrequency.length * 35)}
                minHeight={400}
              >
                <BarChart 
                  data={visualizationData.keyPhrasesFrequency}
                  layout="horizontal"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="phrase" 
                    type="category" 
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Analyses</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Positive Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(
                    (analyses.filter(a => a.sentiment_result.sentiment === 'positive').length / analyses.length) * 100
                  )}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(
                    analyses.reduce((sum, a) => sum + a.sentiment_result.confidence, 0) / analyses.length * 100
                  )}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    analyses.reduce((sum, a) => sum + a.processing_time_ms, 0) / analyses.length
                  )}ms
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
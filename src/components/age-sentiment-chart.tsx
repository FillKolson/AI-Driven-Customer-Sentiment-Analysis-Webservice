'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from 'lucide-react';

interface AgeSentimentData {
  ageGroup: string;
  averageScore: number;
  count: number;
}

interface AgeSentimentResponse {
  chartData: AgeSentimentData[];
}

// Dynamic AI Review Component for Age Sentiment
const DynamicAgeSentimentReview = ({ data }: { data: AgeSentimentData[] }) => {
  const generateAgeInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalCustomers: 0,
        avgSentiment: 0,
        bestPerformingAge: { ageGroup: '', averageScore: 0, count: 0 },
        worstPerformingAge: { ageGroup: '', averageScore: 0, count: 0 },
        ageGroups: 0,
        sentimentRange: 0
      };
    }

    const totalCustomers = data.reduce((sum, item) => sum + item.count, 0);
    const weightedSentiment = data.reduce((sum, item) => sum + (item.averageScore * item.count), 0) / totalCustomers;
    
    const bestPerformingAge = data.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    
    const worstPerformingAge = data.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    const sentimentRange = bestPerformingAge.averageScore - worstPerformingAge.averageScore;

    return {
      totalCustomers,
      avgSentiment: weightedSentiment,
      bestPerformingAge,
      worstPerformingAge,
      ageGroups: data.length,
      sentimentRange
    };
  };

  const generateDynamicReview = () => {
    const insights = generateAgeInsights();
    
    // Performance classification
    let performanceLevel = "needs improvement";
    let performanceColor = "text-red-600";
    let performanceBg = "bg-red-50";
    let performanceBorder = "border-red-400";
    
    if (insights.avgSentiment >= 0.8) {
      performanceLevel = "excellent";
      performanceColor = "text-green-600";
      performanceBg = "bg-green-50";
      performanceBorder = "border-green-400";
    } else if (insights.avgSentiment >= 0.7) {
      performanceLevel = "good";
      performanceColor = "text-blue-600";
      performanceBg = "bg-blue-50";
      performanceBorder = "border-blue-400";
    } else if (insights.avgSentiment >= 0.6) {
      performanceLevel = "average";
      performanceColor = "text-yellow-600";
      performanceBg = "bg-yellow-50";
      performanceBorder = "border-yellow-400";
    }

    // Sentiment consistency analysis
    let consistencyLevel = "highly consistent";
    if (insights.sentimentRange > 0.3) consistencyLevel = "highly variable";
    else if (insights.sentimentRange > 0.2) consistencyLevel = "moderately variable";
    else if (insights.sentimentRange > 0.1) consistencyLevel = "slightly variable";

    return {
      performanceLevel,
      performanceColor,
      performanceBg,
      performanceBorder,
      consistencyLevel,
      insights
    };
  };

  const review = generateDynamicReview();
  const { insights } = review;

  return (
    <div className="mt-6 p-4 bg-white rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Age Demographics Review</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalCustomers} customers across {insights.ageGroups} age groups
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Age Sentiment Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your customer base shows an average sentiment score of {insights.avgSentiment.toFixed(3)} across all age groups. 
            The {insights.bestPerformingAge.ageGroup} age group leads with {insights.bestPerformingAge.averageScore.toFixed(3)} sentiment score 
            ({insights.bestPerformingAge.count} customers), while {insights.worstPerformingAge.ageGroup} shows the lowest at {insights.worstPerformingAge.averageScore.toFixed(3)} 
            ({insights.worstPerformingAge.count} customers).
          </p>
        </div>

        {/* Consistency Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📊 Age Group Consistency: {review.consistencyLevel.toUpperCase()}</p>
          <p>
            The sentiment range of {insights.sentimentRange.toFixed(3)} across age groups indicates {review.consistencyLevel} performance. 
            {insights.sentimentRange < 0.1 
              ? "This excellent consistency suggests your service appeals equally well to all age demographics."
              : insights.sentimentRange < 0.2 
              ? "This moderate variation indicates room for age-specific service improvements."
              : "This significant variation suggests implementing targeted strategies for different age groups."
            }
          </p>
        </div>

        {/* Best Performing Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Top Performing Age Group</p>
          <p>
            The {insights.bestPerformingAge.ageGroup} age group ({insights.bestPerformingAge.count} customers) achieves the highest satisfaction 
            with a {insights.bestPerformingAge.averageScore.toFixed(3)} sentiment score. This represents 
            {((insights.bestPerformingAge.count / insights.totalCustomers) * 100).toFixed(1)}% of your customer base and serves as a 
            benchmark for service excellence across other age demographics.
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Age-Targeted Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.sentimentRange > 0.2 && (
              <li><strong>Address Age Disparities:</strong> Investigate why {insights.worstPerformingAge.ageGroup} shows lower satisfaction and implement targeted improvements</li>
            )}
            {insights.bestPerformingAge.averageScore > 0.8 && (
              <li><strong>Replicate Success:</strong> Study what makes {insights.bestPerformingAge.ageGroup} highly satisfied and apply these practices to other age groups</li>
            )}
            {insights.avgSentiment < 0.7 && (
              <li><strong>Age-Inclusive Strategy:</strong> Develop age-specific service approaches to improve overall demographic satisfaction</li>
            )}
            <li><strong>Demographic Insights:</strong> Leverage the {insights.bestPerformingAge.ageGroup} success model to enhance experience for all {insights.ageGroups} age segments</li>
            {insights.worstPerformingAge.averageScore < 0.6 && (
              <li><strong>Priority Focus:</strong> Immediate attention needed for {insights.worstPerformingAge.ageGroup} demographic to prevent customer churn</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function AgeSentimentChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<AgeSentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/age-sentiment');
        
        if (!response.ok) {
          throw new Error('Failed to fetch age sentiment data');
        }
        
        const result: AgeSentimentResponse = await response.json();
        setData(result.chartData);
      } catch (err) {
        console.error('Error fetching age sentiment data:', err);
        setError('Failed to load age sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as AgeSentimentData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">Age: {data.ageGroup}</p>
          <p>Avg. Sentiment: {data.averageScore.toFixed(2)}</p>
          <p>Customers: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  if (externalLoading || loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Age Group Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="sr-only">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Age Group Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Age Group Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No age group sentiment data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average sentiment across all age groups
  const averageSentiment = 
    data.reduce((sum, item) => sum + item.averageScore, 0) / data.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Age Group Sentiment Analysis
          </CardTitle>
          <div className="text-sm text-gray-600">
            Avg: <span className="font-medium">{averageSentiment.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="horizontal"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="ageGroup" 
                type="category" 
                tick={{ fontSize: 14 }}
              />
              <YAxis 
                type="number" 
                domain={[0, 1]} 
                tickCount={6}
                tickFormatter={(value) => value.toFixed(1)}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="averageScore" 
                name="Average Sentiment"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          Hover over bars to see customer count
        </div>
        
        {/* AI Review Component */}
        <DynamicAgeSentimentReview data={data} />
      </CardContent>
    </Card>
  );
}

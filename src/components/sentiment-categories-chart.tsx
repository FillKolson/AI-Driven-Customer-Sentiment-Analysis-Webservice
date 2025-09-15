"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon, AlertTriangle, BarChart3 } from "lucide-react";

interface SentimentCategoryDataPoint {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface SentimentCategoriesData {
  chartData: SentimentCategoryDataPoint[];
  summary: {
    totalAnalyses: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    dominantSentiment: string;
    sentimentBalance: number;
  };
}

interface SentimentCategoriesChartProps {
  loading?: boolean;
}

export default function SentimentCategoriesChart({ loading = false }: SentimentCategoriesChartProps) {
  const [data, setData] = useState<SentimentCategoriesData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentimentCategoriesData();
  }, []);

  const fetchSentimentCategoriesData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/sentiment-categories');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view sentiment categories analytics');
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching sentiment categories data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sentiment categories data');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-blue-600">
            <span className="font-medium">Count:</span> {data.value}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Percentage:</span> {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Dynamic AI Review Component
  const DynamicAnalystReview = ({ data }: { data: SentimentCategoriesData }) => {
    const generateInsights = () => {
      const { chartData, summary } = data;
      
      if (!chartData || chartData.length === 0) {
        return "No sentiment categories data available for analysis. Please ensure you have sentiment analyses in your database.";
      }

      const { totalAnalyses, positiveCount, negativeCount, neutralCount, dominantSentiment, sentimentBalance } = summary;
      
      // Calculate percentages
      const positivePercentage = (positiveCount / totalAnalyses) * 100;
      const negativePercentage = (negativeCount / totalAnalyses) * 100;
      const neutralPercentage = (neutralCount / totalAnalyses) * 100;

      // Sentiment health assessment
      let healthStatus = "balanced";
      let healthColor = "text-blue-800";
      let healthBg = "bg-blue-50 border-blue-400";
      
      if (positivePercentage > 60) {
        healthStatus = "excellent";
        healthColor = "text-green-800";
        healthBg = "bg-green-50 border-green-400";
      } else if (positivePercentage > 40) {
        healthStatus = "good";
        healthColor = "text-blue-800";
        healthBg = "bg-blue-50 border-blue-400";
      } else if (negativePercentage > 40) {
        healthStatus = "concerning";
        healthColor = "text-red-800";
        healthBg = "bg-red-50 border-red-400";
      } else if (neutralPercentage > 50) {
        healthStatus = "neutral-heavy";
        healthColor = "text-yellow-800";
        healthBg = "bg-yellow-50 border-yellow-400";
      }

      // Trend analysis
      const positiveNegativeRatio = positiveCount / Math.max(negativeCount, 1);
      const engagementLevel = ((positiveCount + negativeCount) / totalAnalyses) * 100;

      return {
        totalAnalyses,
        positivePercentage,
        negativePercentage,
        neutralPercentage,
        dominantSentiment,
        healthStatus,
        healthColor,
        healthBg,
        positiveNegativeRatio,
        engagementLevel,
        sentimentBalance
      };
    };

    const insights = generateInsights();
    
    if (typeof insights === 'string') {
      return (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">🤖 AI Analysis</h4>
          <p className="text-sm text-gray-700">{insights}</p>
        </div>
      );
    }

    return (
      <div className="mt-6 p-4 bg-white rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Sentiment Distribution Analysis</h4>
        <p className="text-sm text-gray-600 mb-3">
          Analysis of {insights.totalAnalyses} sentiment analyses across all customer interactions
        </p>
        
        <div className="space-y-3 text-sm text-gray-700">
          {/* Overall Health Assessment */}
          <div className={`p-3 rounded-lg border-l-4 ${insights.healthBg}`}>
            <p className={`font-medium ${insights.healthColor}`}>
              📊 Sentiment Health: {insights.healthStatus.toUpperCase().replace('-', ' ')}
            </p>
            <p>
              Your customer sentiment distribution shows {insights.positivePercentage.toFixed(1)}% positive, {insights.negativePercentage.toFixed(1)}% negative, 
              and {insights.neutralPercentage.toFixed(1)}% neutral responses. The dominant sentiment is <strong>{insights.dominantSentiment}</strong>, 
              indicating {insights.healthStatus === 'excellent' ? 'outstanding customer satisfaction' :
                        insights.healthStatus === 'good' ? 'solid customer satisfaction with room for improvement' :
                        insights.healthStatus === 'concerning' ? 'significant customer satisfaction challenges requiring immediate attention' :
                        'mixed customer reactions with opportunities for engagement improvement'}.
            </p>
          </div>

          {/* Detailed Breakdown */}
          <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <p className="font-medium text-purple-800">📈 Sentiment Breakdown Analysis</p>
            <div className="mt-2 space-y-1">
              <p><strong>Positive Sentiment:</strong> {insights.positivePercentage.toFixed(1)}% ({data.summary.positiveCount} responses) - 
                {insights.positivePercentage > 50 ? ' Strong customer satisfaction foundation' : ' Opportunity to increase customer delight'}</p>
              <p><strong>Negative Sentiment:</strong> {insights.negativePercentage.toFixed(1)}% ({data.summary.negativeCount} responses) - 
                {insights.negativePercentage > 30 ? ' High priority for improvement initiatives' : 
                 insights.negativePercentage > 15 ? ' Moderate concern requiring attention' : ' Well-managed negative feedback'}</p>
              <p><strong>Neutral Sentiment:</strong> {insights.neutralPercentage.toFixed(1)}% ({data.summary.neutralCount} responses) - 
                {insights.neutralPercentage > 40 ? ' High potential for conversion to positive sentiment' : ' Balanced neutral responses'}</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
            <p className="font-medium text-indigo-800">🎯 Performance Metrics</p>
            <div className="mt-2 space-y-1">
              <p><strong>Positive-to-Negative Ratio:</strong> {insights.positiveNegativeRatio.toFixed(2)}:1 - 
                {insights.positiveNegativeRatio > 3 ? ' Excellent sentiment balance' :
                 insights.positiveNegativeRatio > 2 ? ' Good sentiment balance' :
                 insights.positiveNegativeRatio > 1 ? ' Acceptable but improvable' : ' Needs immediate attention'}</p>
              <p><strong>Customer Engagement Level:</strong> {insights.engagementLevel.toFixed(1)}% - 
                {insights.engagementLevel > 70 ? ' High customer engagement' :
                 insights.engagementLevel > 50 ? ' Moderate engagement with growth potential' : ' Low engagement requiring activation strategies'}</p>
            </div>
          </div>

          {/* Strategic Recommendations */}
          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
            <p className="font-medium text-amber-800">🚀 Strategic Recommendations</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {insights.healthStatus === 'excellent' && (
                <>
                  <li><strong>Maintain Excellence:</strong> Continue current strategies that drive high positive sentiment</li>
                  <li><strong>Best Practice Documentation:</strong> Document successful approaches for replication across all touchpoints</li>
                  <li><strong>Loyalty Enhancement:</strong> Leverage high satisfaction to build stronger customer loyalty programs</li>
                </>
              )}
              {insights.healthStatus === 'good' && (
                <>
                  <li><strong>Positive Amplification:</strong> Focus on converting neutral customers to positive through targeted engagement</li>
                  <li><strong>Experience Optimization:</strong> Identify and eliminate friction points causing negative sentiment</li>
                  <li><strong>Feedback Loop:</strong> Implement systematic feedback collection to maintain positive trajectory</li>
                </>
              )}
              {insights.healthStatus === 'concerning' && (
                <>
                  <li><strong>Immediate Action Required:</strong> Address root causes of negative sentiment through comprehensive service review</li>
                  <li><strong>Customer Recovery:</strong> Implement proactive customer recovery programs for dissatisfied customers</li>
                  <li><strong>Staff Training:</strong> Enhance customer service training to improve interaction quality</li>
                </>
              )}
              {insights.healthStatus === 'neutral-heavy' && (
                <>
                  <li><strong>Engagement Strategy:</strong> Develop initiatives to convert neutral customers into advocates</li>
                  <li><strong>Experience Enhancement:</strong> Add memorable positive touchpoints to shift neutral perceptions</li>
                  <li><strong>Personalization:</strong> Implement personalized experiences to create emotional connections</li>
                </>
              )}
              {insights.negativePercentage > 20 && (
                <li><strong>Negative Sentiment Reduction:</strong> Priority focus on addressing the {insights.negativePercentage.toFixed(1)}% negative sentiment through targeted improvements</li>
              )}
              {insights.neutralPercentage > 35 && (
                <li><strong>Neutral Conversion:</strong> Significant opportunity to convert {insights.neutralPercentage.toFixed(1)}% neutral sentiment into positive through enhanced customer experience</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  if (loading || isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Sentiment Categories Distribution - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={fetchSentimentCategoriesData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.chartData || data.chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Sentiment Categories Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No sentiment categories data available</p>
            <p className="text-sm text-gray-400 mt-1">
              Ensure you have sentiment analyses in your database
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5" />
          Sentiment Categories Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Pie Chart */}
        <div className="h-96 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color, fontWeight: 'bold' }}>
                    {value}: {entry.payload.value} ({entry.payload.percentage.toFixed(1)}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Dynamic AI Review */}
        <DynamicAnalystReview data={data} />
      </CardContent>
    </Card>
  );
}

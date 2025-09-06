"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Activity, AlertTriangle } from "lucide-react";

interface ChartDataPoint {
  date: string;
  averageOrderValue: number;
  averageSentimentScore: number;
}

interface KeyMetricsData {
  chartData: ChartDataPoint[];
  summary: {
    totalDataPoints: number;
    dateRange: {
      start: string;
      end: string;
    } | null;
    overallAverageSentimentScore: number;
    overallAverageOrderValue: number;
  };
}

interface KeyMetricsChartProps {
  loading?: boolean;
}

// Dynamic AI Review Component
const DynamicAnalystReview = ({ data }: { data: KeyMetricsData }) => {
  const generateDataInsights = () => {
    const { chartData, summary } = data;
    
    if (!chartData || chartData.length === 0) {
      return {
        sentimentTrend: 0,
        orderValueTrend: 0,
        maxSentimentDay: { date: '', averageSentimentScore: 0 },
        maxOrderValueDay: { date: '', averageOrderValue: 0 },
        correlation: 0,
        avgSentiment: 0,
        avgOrderValue: 0,
        dataPoints: 0,
        dateRange: null
      };
    }

    // Calculate trends
    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));
    
    const firstHalfAvgSentiment = firstHalf.reduce((sum, d) => sum + d.averageSentimentScore, 0) / firstHalf.length;
    const secondHalfAvgSentiment = secondHalf.reduce((sum, d) => sum + d.averageSentimentScore, 0) / secondHalf.length;
    const sentimentTrend = secondHalfAvgSentiment - firstHalfAvgSentiment;
    
    const firstHalfAvgOrderValue = firstHalf.reduce((sum, d) => sum + d.averageOrderValue, 0) / firstHalf.length;
    const secondHalfAvgOrderValue = secondHalf.reduce((sum, d) => sum + d.averageOrderValue, 0) / secondHalf.length;
    const orderValueTrend = secondHalfAvgOrderValue - firstHalfAvgOrderValue;

    // Find peak performance days
    const maxSentimentDay = chartData.reduce((max, current) => 
      current.averageSentimentScore > max.averageSentimentScore ? current : max
    );
    
    const maxOrderValueDay = chartData.reduce((max, current) => 
      current.averageOrderValue > max.averageOrderValue ? current : max
    );

    // Calculate correlation
    const correlation = calculateCorrelation(
      chartData.map(d => d.averageSentimentScore),
      chartData.map(d => d.averageOrderValue)
    );

    return {
      sentimentTrend,
      orderValueTrend,
      maxSentimentDay,
      maxOrderValueDay,
      correlation,
      avgSentiment: summary.overallAverageSentimentScore,
      avgOrderValue: summary.overallAverageOrderValue,
      dataPoints: summary.totalDataPoints,
      dateRange: summary.dateRange
    };
  };

  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = x.length;
    if (n === 0) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const generateDynamicReview = () => {
    const insights = generateDataInsights();
    
    // Performance classification
    let performanceLevel = "needs improvement";
    let performanceColor = "text-red-600";
    let performanceBg = "bg-red-50";
    let performanceBorder = "border-red-400";
    
    if (insights.avgSentiment >= 80) {
      performanceLevel = "excellent";
      performanceColor = "text-green-600";
      performanceBg = "bg-green-50";
      performanceBorder = "border-green-400";
    } else if (insights.avgSentiment >= 70) {
      performanceLevel = "good";
      performanceColor = "text-blue-600";
      performanceBg = "bg-blue-50";
      performanceBorder = "border-blue-400";
    } else if (insights.avgSentiment >= 60) {
      performanceLevel = "average";
      performanceColor = "text-yellow-600";
      performanceBg = "bg-yellow-50";
      performanceBorder = "border-yellow-400";
    }

    // Correlation strength
    const correlationAbs = Math.abs(insights.correlation);
    let correlationStrength = "negligible";
    if (correlationAbs > 0.7) correlationStrength = "strong";
    else if (correlationAbs > 0.4) correlationStrength = "moderate";
    else if (correlationAbs > 0.2) correlationStrength = "weak";

    // Trend descriptions
    const sentimentDirection = insights.sentimentTrend > 0 ? "improved" : insights.sentimentTrend < 0 ? "declined" : "remained stable";
    const orderValueDirection = insights.orderValueTrend > 0 ? "increased" : insights.orderValueTrend < 0 ? "decreased" : "remained stable";

    return {
      performanceLevel,
      performanceColor,
      performanceBg,
      performanceBorder,
      correlationStrength,
      sentimentDirection,
      orderValueDirection,
      insights
    };
  };

  const review = generateDynamicReview();
  const { insights } = review;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Analyst Review</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.dataPoints} data points from {insights.dateRange?.start || 'N/A'} to {insights.dateRange?.end || 'N/A'}
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your supermarket achieved an average sentiment score of {insights.avgSentiment.toFixed(1)} 
            with an average order value of ${insights.avgOrderValue.toFixed(0)}. Sentiment has {review.sentimentDirection} 
            by {Math.abs(insights.sentimentTrend).toFixed(1)} points while order values have {review.orderValueDirection} 
            by ${Math.abs(insights.orderValueTrend).toFixed(0)} over the analyzed period.
          </p>
        </div>

        {/* Correlation Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📈 Sentiment-Revenue Correlation: {review.correlationStrength.toUpperCase()}</p>
          <p>
            The correlation coefficient of {insights.correlation.toFixed(3)} indicates a {review.correlationStrength} relationship 
            between customer sentiment and order values. 
            {insights.correlation > 0.4 
              ? "This strong positive correlation suggests that improving customer satisfaction directly drives revenue growth."
              : insights.correlation > 0.2 
              ? "This moderate correlation indicates potential for improving the sentiment-revenue relationship."
              : "The weak correlation suggests investigating other factors affecting customer spending behavior."
            }
          </p>
        </div>

        {/* Peak Performance Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Peak Performance Analysis</p>
          <p>
            Your highest sentiment score of {insights.maxSentimentDay.averageSentimentScore.toFixed(1)} occurred on {insights.maxSentimentDay.date}, 
            while your highest average order value of ${insights.maxOrderValueDay.averageOrderValue.toFixed(0)} was recorded on {insights.maxOrderValueDay.date}.
            {insights.maxSentimentDay.date === insights.maxOrderValueDay.date 
              ? " Both peaks occurred on the same day, indicating excellent operational alignment."
              : " Analyzing factors from these separate peak days can provide valuable optimization insights."
            }
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Data-Driven Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.correlation > 0.4 && (
              <li><strong>Leverage Strong Correlation:</strong> Implement customer satisfaction initiatives during high-traffic periods to maximize revenue impact</li>
            )}
            {insights.sentimentTrend > 0 && (
              <li><strong>Maintain Positive Momentum:</strong> Your improving sentiment trend indicates effective strategies - continue current customer experience initiatives</li>
            )}
            {insights.sentimentTrend < -2 && (
              <li><strong>Address Declining Sentiment:</strong> Investigate factors causing the {Math.abs(insights.sentimentTrend).toFixed(1)}-point sentiment decline</li>
            )}
            {insights.orderValueTrend > 5 && (
              <li><strong>Build on Revenue Growth:</strong> Capitalize on the ${insights.orderValueTrend.toFixed(0)} average order value increase</li>
            )}
            <li><strong>Best Practice Analysis:</strong> Study operations from {insights.maxSentimentDay.date} to replicate high-performance conditions</li>
            {insights.avgSentiment < 70 && (
              <li><strong>Customer Experience Priority:</strong> Focus on improving satisfaction scores above 70 for optimal performance</li>
            )}
            {review.correlationStrength === 'weak' && (
              <li><strong>Correlation Enhancement:</strong> Investigate non-sentiment factors affecting order values (promotions, product mix, seasonality)</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function KeyMetricsChart({ loading = false }: KeyMetricsChartProps) {
  const [data, setData] = useState<KeyMetricsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchKeyMetricsData();
  }, []);

  const fetchKeyMetricsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/analytics/key-metrics');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch key metrics data');
      }
      
      setData(result.data);
    } catch (err) {
      console.error('Error fetching key metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toFixed(2)}
              {entry.name === 'Average Order Value' ? ' USD' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
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
            Key Metrics - Data Error
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center text-red-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p className="font-medium">{error}</p>
            <p className="text-sm mt-2 text-gray-600">
              Please ensure you have sentiment analyses with associated customer data in your database.
            </p>
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
            <TrendingUp className="w-5 h-5" />
            Key Metrics - Positive Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <div className="text-center text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No positive sentiment data available for visualization</p>
            <p className="text-sm mt-1">Start analyzing text to see positive sentiment trends</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Key Metrics - Positive Sentiment vs Order Value Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600">Total Data Points</p>
            <p className="text-2xl font-bold text-green-600">
              {data.summary.totalDataPoints}
            </p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-600">Avg Sentiment Score</p>
            <p className="text-2xl font-bold text-blue-600">
              {data.summary.overallAverageSentimentScore.toFixed(2)}
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600">Avg Order Value</p>
            <p className="text-2xl font-bold text-purple-600">
              ${data.summary.overallAverageOrderValue.toFixed(0)}
            </p>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                angle={-45}
                textAnchor="end"
                height={80}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
              />
              <YAxis 
                yAxisId="left" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
                label={{ value: 'Order Value ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#10b981', fontSize: 12 } }}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={{ stroke: '#d1d5db' }}
                tickLine={{ stroke: '#d1d5db' }}
                label={{ value: 'Sentiment Score', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#3b82f6', fontSize: 12 } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="averageOrderValue" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Average Order Value"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="averageSentimentScore" 
                stroke="#3b82f6" 
                strokeWidth={3}
                name="Average Sentiment Score"
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Dynamic AI Review */}
        <DynamicAnalystReview data={data} />
      </CardContent>
    </Card>
  );
}

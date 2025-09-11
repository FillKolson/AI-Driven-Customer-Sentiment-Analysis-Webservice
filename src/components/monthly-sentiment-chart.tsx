'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Loader2 } from 'lucide-react';

interface MonthlySentimentData {
  month: string;
  averageScore: number;
  count: number;
}

interface MonthlySentimentResponse {
  chartData: MonthlySentimentData[];
}

// Color scale for the bars (blue gradient)
const COLORS = [
  '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', 
  '#42A5F5', '#2196F3', '#1E88E5', '#1976D2',
  '#1565C0', '#0D47A1'
];

// Dynamic AI Review Component for Monthly Sentiment
const DynamicMonthlySentimentReview = ({ data }: { data: MonthlySentimentData[] }) => {
  const generateMonthlyInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalMonths: 0,
        totalCustomers: 0,
        avgSentiment: 0,
        bestMonth: { month: '', averageScore: 0, count: 0 },
        worstMonth: { month: '', averageScore: 0, count: 0 },
        sentimentTrend: 0,
        sentimentRange: 0,
        consistencyScore: 0
      };
    }

    const totalCustomers = data.reduce((sum, item) => sum + item.count, 0);
    const weightedSentiment = data.reduce((sum, item) => sum + (item.averageScore * item.count), 0) / totalCustomers;
    
    const bestMonth = data.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    
    const worstMonth = data.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    const sentimentRange = bestMonth.averageScore - worstMonth.averageScore;
    
    // Calculate trend (comparing first half vs second half)
    const midPoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midPoint);
    const secondHalf = data.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.averageScore, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.averageScore, 0) / secondHalf.length;
    const sentimentTrend = secondHalfAvg - firstHalfAvg;

    // Calculate consistency (inverse of standard deviation)
    const mean = data.reduce((sum, item) => sum + item.averageScore, 0) / data.length;
    const variance = data.reduce((sum, item) => sum + Math.pow(item.averageScore - mean, 2), 0) / data.length;
    const standardDeviation = Math.sqrt(variance);
    const consistencyScore = Math.max(0, 1 - standardDeviation); // Higher score = more consistent

    return {
      totalMonths: data.length,
      totalCustomers,
      avgSentiment: weightedSentiment,
      bestMonth,
      worstMonth,
      sentimentTrend,
      sentimentRange,
      consistencyScore
    };
  };

  const generateDynamicReview = () => {
    const insights = generateMonthlyInsights();
    
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

    // Trend analysis
    let trendDirection = "stable";
    if (insights.sentimentTrend > 0.05) trendDirection = "improving";
    else if (insights.sentimentTrend < -0.05) trendDirection = "declining";

    // Consistency analysis
    let consistencyLevel = "highly consistent";
    if (insights.consistencyScore < 0.7) consistencyLevel = "highly variable";
    else if (insights.consistencyScore < 0.8) consistencyLevel = "moderately variable";
    else if (insights.consistencyScore < 0.9) consistencyLevel = "slightly variable";

    return {
      performanceLevel,
      performanceColor,
      performanceBg,
      performanceBorder,
      trendDirection,
      consistencyLevel,
      insights
    };
  };

  const review = generateDynamicReview();
  const { insights } = review;

  return (
    <div className="mt-6 p-4 bg-white rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Monthly Sentiment Trends Analysis</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalCustomers} customers across {insights.totalMonths} months
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Monthly Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your monthly sentiment shows an average score of {insights.avgSentiment.toFixed(3)} with {review.trendDirection} trends. 
            {insights.bestMonth.month} achieved the highest satisfaction at {insights.bestMonth.averageScore.toFixed(3)} 
            ({insights.bestMonth.count} customers), while {insights.worstMonth.month} recorded the lowest at {insights.worstMonth.averageScore.toFixed(3)} 
            ({insights.worstMonth.count} customers).
          </p>
        </div>

        {/* Trend Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📈 Sentiment Trend Analysis: {review.trendDirection.toUpperCase()}</p>
          <p>
            The sentiment trend shows a {Math.abs(insights.sentimentTrend).toFixed(3)} point {insights.sentimentTrend > 0 ? 'improvement' : insights.sentimentTrend < 0 ? 'decline' : 'stability'} 
            comparing recent months to earlier periods. 
            {insights.sentimentTrend > 0.05 
              ? "This positive trend indicates successful customer experience initiatives and growing satisfaction."
              : insights.sentimentTrend < -0.05 
              ? "This declining trend requires immediate attention to identify and address satisfaction issues."
              : "This stable trend suggests consistent service quality - focus on breakthrough improvements."
            }
          </p>
        </div>

        {/* Consistency Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">📊 Monthly Consistency: {review.consistencyLevel.toUpperCase()}</p>
          <p>
            The sentiment range of {insights.sentimentRange.toFixed(3)} across months indicates {review.consistencyLevel} performance 
            (consistency score: {insights.consistencyScore.toFixed(3)}). 
            {insights.consistencyScore > 0.9 
              ? "Excellent consistency demonstrates reliable service quality across all months."
              : insights.consistencyScore > 0.8 
              ? "Good consistency with minor seasonal variations - monitor for improvement opportunities."
              : "Significant monthly variations suggest need for standardized service protocols and seasonal planning."
            }
          </p>
        </div>

        {/* Peak Performance Analysis */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🏆 Peak Performance Insights</p>
          <p>
            {insights.bestMonth.month} represents your peak performance month with {insights.bestMonth.averageScore.toFixed(3)} sentiment score 
            and {insights.bestMonth.count} customer interactions. This month achieved 
            {((insights.bestMonth.averageScore - insights.avgSentiment) / insights.avgSentiment * 100).toFixed(1)}% above average performance, 
            providing a blueprint for replicating success across other months.
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
          <p className="font-medium text-orange-800">🚀 Monthly Optimization Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.sentimentTrend > 0.05 && (
              <li><strong>Maintain Positive Momentum:</strong> Your improving trend indicates effective strategies - continue and amplify current customer experience initiatives</li>
            )}
            {insights.sentimentTrend < -0.05 && (
              <li><strong>Address Declining Trend:</strong> Immediate investigation needed for the {Math.abs(insights.sentimentTrend).toFixed(3)}-point decline in customer satisfaction</li>
            )}
            {insights.consistencyScore < 0.8 && (
              <li><strong>Improve Monthly Consistency:</strong> Significant variations suggest implementing standardized service protocols and seasonal preparation strategies</li>
            )}
            <li><strong>Replicate Peak Success:</strong> Study {insights.bestMonth.month}'s operations and customer touchpoints to replicate across underperforming months</li>
            {insights.worstMonth.averageScore < 0.6 && (
              <li><strong>Focus on {insights.worstMonth.month}:</strong> This month requires targeted improvement strategies to prevent recurring low satisfaction</li>
            )}
            {insights.sentimentRange > 0.2 && (
              <li><strong>Seasonal Strategy Development:</strong> Large monthly variations indicate need for month-specific customer experience strategies</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function MonthlySentimentChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<MonthlySentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/monthly-sentiment');
        
        if (!response.ok) {
          throw new Error('Failed to fetch monthly sentiment data');
        }
        
        const result: MonthlySentimentResponse = await response.json();
        setData(result.chartData || []);
      } catch (err) {
        console.error('Error fetching monthly sentiment data:', err);
        setError('Failed to load monthly sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as MonthlySentimentData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{formatMonthYear(label)}</p>
          <p>Avg. Score: {data.averageScore.toFixed(3)}</p>
          <p>Analyses: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  // Format month from YYYY-MM to Month YYYY (e.g., "2023-12" to "Dec 2023")
  const formatMonthYear = (monthStr: string) => {
    try {
      const [year, month] = monthStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (error) {
      return monthStr; // Return original string if parsing fails
    }
  };

  // Format Y-axis labels to show sentiment scores with 1 decimal place
  const formatYAxis = (value: number) => {
    return value.toFixed(1);
  };

  if (externalLoading || loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Monthly Sentiment Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
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
            Monthly Sentiment Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
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
            Monthly Sentiment Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-gray-500">No sentiment data available by month</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall average sentiment score
  const overallAverage = data.length > 0 
    ? (data.reduce((sum, item) => sum + item.averageScore, 0) / data.length).toFixed(2)
    : 0;

  // Calculate trend (increasing or decreasing)
  const getTrend = () => {
    if (data.length < 2) return 'stable';
    const first = data[0].averageScore;
    const last = data[data.length - 1].averageScore;
    return last > first ? 'improving' : last < first ? 'declining' : 'stable';
  };

  const trend = getTrend();
  const trendText = trend === 'improving' ? 'improving' : trend === 'declining' ? 'declining' : 'stable';
  const trendColor = trend === 'improving' ? 'text-green-600' : trend === 'declining' ? 'text-red-600' : 'text-gray-600';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Monthly Sentiment Trend
          </CardTitle>
          <div className="text-sm text-gray-600">
            Avg: <span className="font-medium">{overallAverage}</span> • 
            Trend: <span className={`font-medium ${trendColor}`}>{trendText}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, bottom: 20, left: 40 }}
              barCategoryGap="10%"
              onMouseEnter={() => {
                // We'll rely on the Bar's onMouseEnter to set the active index
              }}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatMonthYear}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                axisLine={false}
                label={{ value: 'Month', position: 'insideBottom', offset: -15 }}
              />
              <YAxis 
                domain={[0, 1]} 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
                width={30}
                label={{
                  value: 'Sentiment score',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -25,
                  style: {
                    textAnchor: 'middle'
                  }
                }}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar 
                dataKey="averageScore" 
                name="Average Sentiment Score"
                radius={[4, 4, 0, 0]}
                barSize={40}
                onMouseEnter={(_, index) => setActiveIndex(index)}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={activeIndex === index ? COLORS[Math.min(index + 3, COLORS.length - 1)] : COLORS[index % COLORS.length]}
                    style={{
                      transition: 'fill 0.2s ease',
                      opacity: activeIndex === null || activeIndex === index ? 1 : 0.7,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>        
        {/* AI Review Component */}
        <DynamicMonthlySentimentReview data={data} />
      </CardContent>
    </Card>
  );
}

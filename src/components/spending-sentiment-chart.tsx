'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2 } from 'lucide-react';

interface SpendingSentimentData {
  spendingGroup: string;
  averageScore: number;
  count: number;
}

interface SpendingSentimentResponse {
  chartData: SpendingSentimentData[];
}

// Dynamic AI Review Component for Spending Sentiment
const DynamicSpendingSentimentReview = ({ data }: { data: SpendingSentimentData[] }) => {
  const generateSpendingInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalCustomers: 0,
        avgSentiment: 0,
        bestSpendingGroup: { spendingGroup: '', averageScore: 0, count: 0 },
        worstSpendingGroup: { spendingGroup: '', averageScore: 0, count: 0 },
        spendingGroups: 0,
        sentimentRange: 0,
        spendingSentimentCorrelation: 0
      };
    }

    const totalCustomers = data.reduce((sum, item) => sum + item.count, 0);
    const weightedSentiment = data.reduce((sum, item) => sum + (item.averageScore * item.count), 0) / totalCustomers;
    
    const bestSpendingGroup = data.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    
    const worstSpendingGroup = data.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    const sentimentRange = bestSpendingGroup.averageScore - worstSpendingGroup.averageScore;

    // Calculate correlation between spending score (as number) and sentiment
    const spendingValues = data.map(item => parseFloat(item.spendingGroup) || 0);
    const sentimentValues = data.map(item => item.averageScore);
    const correlation = calculateCorrelation(spendingValues, sentimentValues);

    return {
      totalCustomers,
      avgSentiment: weightedSentiment,
      bestSpendingGroup,
      worstSpendingGroup,
      spendingGroups: data.length,
      sentimentRange,
      spendingSentimentCorrelation: correlation
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
    const insights = generateSpendingInsights();
    
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

    // Correlation analysis
    const correlationAbs = Math.abs(insights.spendingSentimentCorrelation);
    let correlationStrength = "negligible";
    if (correlationAbs > 0.7) correlationStrength = "strong";
    else if (correlationAbs > 0.4) correlationStrength = "moderate";
    else if (correlationAbs > 0.2) correlationStrength = "weak";

    return {
      performanceLevel,
      performanceColor,
      performanceBg,
      performanceBorder,
      correlationStrength,
      insights
    };
  };

  const review = generateDynamicReview();
  const { insights } = review;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Spending Behavior Review</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalCustomers} customers across {insights.spendingGroups} spending score groups
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Spending Sentiment Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your customer base shows an average sentiment score of {insights.avgSentiment.toFixed(3)} across all spending groups. 
            Spending group {insights.bestSpendingGroup.spendingGroup} leads with {insights.bestSpendingGroup.averageScore.toFixed(3)} sentiment score 
            ({insights.bestSpendingGroup.count} customers), while group {insights.worstSpendingGroup.spendingGroup} shows the lowest at {insights.worstSpendingGroup.averageScore.toFixed(3)} 
            ({insights.worstSpendingGroup.count} customers).
          </p>
        </div>

        {/* Correlation Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📈 Spending-Sentiment Correlation: {review.correlationStrength.toUpperCase()}</p>
          <p>
            The correlation coefficient of {insights.spendingSentimentCorrelation.toFixed(3)} indicates a {review.correlationStrength} relationship 
            between spending behavior and customer satisfaction. 
            {insights.spendingSentimentCorrelation > 0.4 
              ? "This strong positive correlation suggests that higher spenders tend to be more satisfied customers."
              : insights.spendingSentimentCorrelation < -0.4 
              ? "This negative correlation indicates that higher spenders may be less satisfied - investigate premium service quality."
              : "The weak correlation suggests spending patterns don't strongly predict satisfaction levels."
            }
          </p>
        </div>

        {/* Best Performing Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Top Performing Spending Group</p>
          <p>
            Spending group {insights.bestSpendingGroup.spendingGroup} ({insights.bestSpendingGroup.count} customers) achieves the highest satisfaction 
            with a {insights.bestSpendingGroup.averageScore.toFixed(3)} sentiment score. This represents 
            {((insights.bestSpendingGroup.count / insights.totalCustomers) * 100).toFixed(1)}% of your customer base and demonstrates 
            optimal value perception in this spending segment.
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Spending-Based Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.spendingSentimentCorrelation > 0.4 && (
              <li><strong>Leverage Spending Loyalty:</strong> Higher spenders are more satisfied - implement VIP programs to retain these valuable customers</li>
            )}
            {insights.spendingSentimentCorrelation < -0.2 && (
              <li><strong>Address High-Spender Concerns:</strong> Investigate why higher spending groups show lower satisfaction levels</li>
            )}
            {insights.sentimentRange > 0.2 && (
              <li><strong>Segment-Specific Strategy:</strong> Develop targeted approaches for different spending groups to reduce satisfaction gaps</li>
            )}
            <li><strong>Value Optimization:</strong> Study group {insights.bestSpendingGroup.spendingGroup} success factors to improve other spending segments</li>
            {insights.worstSpendingGroup.averageScore < 0.6 && (
              <li><strong>Priority Intervention:</strong> Immediate focus needed on spending group {insights.worstSpendingGroup.spendingGroup} to prevent churn</li>
            )}
            {review.correlationStrength === 'negligible' && (
              <li><strong>Investigate Non-Spending Factors:</strong> Since spending doesn't predict satisfaction, focus on service quality and experience factors</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function SpendingSentimentChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<SpendingSentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/spending-sentiment');
        
        if (!response.ok) {
          throw new Error('Failed to fetch spending sentiment data');
        }
        
        const result: SpendingSentimentResponse = await response.json();
        setData(result.chartData);
      } catch (err) {
        console.error('Error fetching spending sentiment data:', err);
        setError('Failed to load spending sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as SpendingSentimentData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">Spending Score: {data.spendingGroup}</p>
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
            <CreditCard className="h-5 w-5 text-blue-600" />
            Spending Score Sentiment Analysis
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
            <CreditCard className="h-5 w-5 text-blue-600" />
            Spending Score Sentiment Analysis
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
            <CreditCard className="h-5 w-5 text-blue-600" />
            Spending Score Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No spending score sentiment data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average sentiment across all spending groups
  const averageSentiment = 
    data.reduce((sum, item) => sum + item.averageScore, 0) / Math.max(1, data.length);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Spending Score Sentiment Analysis
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
                dataKey="spendingGroup" 
                type="category" 
                tick={{ fontSize: 14 }}
                label={{ value: 'Spending Score', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number" 
                domain={[0, 1]} 
                tickCount={6}
                tickFormatter={(value) => value.toFixed(1)}
                width={60}
                label={{ value: 'Avg. Sentiment', angle: -90, position: 'insideLeft' }}
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
        <DynamicSpendingSentimentReview data={data} />
      </CardContent>
    </Card>
  );
}

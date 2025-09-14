'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Loader2 } from 'lucide-react';

interface IncomeSentimentData {
  incomeGroup: string; // This will be the exact income value as string
  averageScore: number;
  count: number;
}

interface IncomeSentimentResponse {
  chartData: IncomeSentimentData[];
}

// Dynamic AI Review Component for Income Sentiment
const DynamicIncomeSentimentReview = ({ data }: { data: IncomeSentimentData[] }) => {
  const generateIncomeInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalCustomers: 0,
        avgSentiment: 0,
        bestIncomeGroup: { incomeGroup: '', averageScore: 0, count: 0 },
        worstIncomeGroup: { incomeGroup: '', averageScore: 0, count: 0 },
        incomeGroups: 0,
        sentimentRange: 0,
        incomeSentimentCorrelation: 0
      };
    }

    const totalCustomers = data.reduce((sum, item) => sum + item.count, 0);
    const weightedSentiment = data.reduce((sum, item) => sum + (item.averageScore * item.count), 0) / totalCustomers;
    
    const bestIncomeGroup = data.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    
    const worstIncomeGroup = data.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    const sentimentRange = bestIncomeGroup.averageScore - worstIncomeGroup.averageScore;

    // Calculate correlation between income (as number) and sentiment
    const incomeValues = data.map(item => parseFloat(item.incomeGroup.replace(/[^0-9.]/g, '')) || 0);
    const sentimentValues = data.map(item => item.averageScore);
    const correlation = calculateCorrelation(incomeValues, sentimentValues);

    return {
      totalCustomers,
      avgSentiment: weightedSentiment,
      bestIncomeGroup,
      worstIncomeGroup,
      incomeGroups: data.length,
      sentimentRange,
      incomeSentimentCorrelation: correlation
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
    const insights = generateIncomeInsights();
    
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
    const correlationAbs = Math.abs(insights.incomeSentimentCorrelation);
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
    <div className="mt-6 p-4 bg-white rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Income Demographics Review</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalCustomers} customers across {insights.incomeGroups} income groups
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Overall Income Sentiment Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your customer base shows an average sentiment score of {insights.avgSentiment.toFixed(3)} across all income groups. 
            The {insights.bestIncomeGroup.incomeGroup} income group leads with {insights.bestIncomeGroup.averageScore.toFixed(3)} sentiment score 
            ({insights.bestIncomeGroup.count} customers), while {insights.worstIncomeGroup.incomeGroup} shows the lowest at {insights.worstIncomeGroup.averageScore.toFixed(3)} 
            ({insights.worstIncomeGroup.count} customers).
          </p>
        </div>

        {/* Correlation Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📈 Income-Sentiment Correlation: {review.correlationStrength.toUpperCase()}</p>
          <p>
            The correlation coefficient of {insights.incomeSentimentCorrelation.toFixed(3)} indicates a {review.correlationStrength} relationship 
            between income level and customer satisfaction. 
            {insights.incomeSentimentCorrelation > 0.4 
              ? "This strong positive correlation suggests that higher-income customers tend to be more satisfied with your services."
              : insights.incomeSentimentCorrelation < -0.4 
              ? "This negative correlation indicates that higher-income customers may have higher expectations - focus on premium service quality."
              : "The weak correlation suggests income doesn't strongly predict satisfaction - your service appeals across income levels."
            }
          </p>
        </div>

        {/* Best Performing Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Top Performing Income Group</p>
          <p>
            The {insights.bestIncomeGroup.incomeGroup} income group ({insights.bestIncomeGroup.count} customers) achieves the highest satisfaction 
            with a {insights.bestIncomeGroup.averageScore.toFixed(3)} sentiment score. This represents 
            {((insights.bestIncomeGroup.count / insights.totalCustomers) * 100).toFixed(1)}% of your customer base and demonstrates 
            excellent value perception in this income segment.
          </p>
        </div>

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Income-Based Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {insights.incomeSentimentCorrelation > 0.4 && (
              <li><strong>Premium Service Strategy:</strong> Higher-income customers are more satisfied - develop premium offerings to capture this segment</li>
            )}
            {insights.incomeSentimentCorrelation < -0.2 && (
              <li><strong>Address Premium Expectations:</strong> Higher-income customers show lower satisfaction - enhance service quality for this segment</li>
            )}
            {insights.sentimentRange > 0.2 && (
              <li><strong>Income-Tailored Approach:</strong> Significant satisfaction gaps exist - develop income-specific service strategies</li>
            )}
            <li><strong>Success Replication:</strong> Study {insights.bestIncomeGroup.incomeGroup} satisfaction drivers to improve other income segments</li>
            {insights.worstIncomeGroup.averageScore < 0.6 && (
              <li><strong>Priority Focus:</strong> Immediate attention needed for {insights.worstIncomeGroup.incomeGroup} group to prevent churn</li>
            )}
            {review.correlationStrength === 'negligible' && (
              <li><strong>Universal Appeal:</strong> Your service works well across income levels - maintain this inclusive approach while optimizing quality</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function IncomeSentimentChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<IncomeSentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/income-sentiment');
        
        if (!response.ok) {
          throw new Error('Failed to fetch income sentiment data');
        }
        
        const result: IncomeSentimentResponse = await response.json();
        setData(result.chartData);
      } catch (err) {
        console.error('Error fetching income sentiment data:', err);
        setError('Failed to load income sentiment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as IncomeSentimentData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">Income: ${parseInt(data.incomeGroup).toLocaleString()}</p>
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
            <DollarSign className="h-5 w-5 text-blue-600" />
            Income Sentiment Analysis
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
            <DollarSign className="h-5 w-5 text-blue-600" />
            Income Sentiment Analysis
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
            <DollarSign className="h-5 w-5 text-blue-600" />
            Income Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No income sentiment data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate average sentiment across all income groups
  const averageSentiment = 
    data.reduce((sum, item) => sum + item.averageScore, 0) / Math.max(1, data.length);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Income Sentiment Analysis
          </CardTitle>
          <div className="text-sm text-gray-600">
            Avg: <span className="font-medium">{averageSentiment.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 15, bottom: 15 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="incomeGroup" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  const num = parseInt(value);
                  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
                  if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
                  //XD
                  return `$${num}`;
                }}
                label={{ value: 'Annual Income', position: 'insideBottom', offset: -15 }}
              />
              <YAxis 
                type="number" 
                domain={[0, 1]} 
                tickCount={6}
                tickFormatter={(value) => value.toFixed(1)}
                width={60}
                label={{
                  value: 'Avg. Sentiment',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  style: {
                    textAnchor: 'middle'
                  }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                name="Average Sentiment"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>     
        {/* AI Review Component */}
        <DynamicIncomeSentimentReview data={data} />
      </CardContent>
    </Card>
  );
}

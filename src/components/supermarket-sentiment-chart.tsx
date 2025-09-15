"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Store } from "lucide-react";

interface SupermarketSentimentDataPoint {
  supermarketId: string;
  averageScore: number;
}

interface SupermarketSentimentData {
  chartData: SupermarketSentimentDataPoint[];
}

interface SupermarketSentimentChartProps {
  loading?: boolean;
}

const DynamicAnalystReview = ({ data }: { data: SupermarketSentimentData }) => {
  const generateInsights = () => {
    if (!data?.chartData || data.chartData.length === 0) {
      return "No supermarket sentiment data available for analysis. Please ensure you have supermarket performance data and customer sentiment analyses in your database.";
    }

    const { chartData } = data;
    
    // Calculate statistics
    const totalSupermarkets = chartData.length;
    const averageSentiment = chartData.reduce((sum, item) => sum + item.averageScore, 0) / totalSupermarkets;
    
    // Find best and worst performing supermarkets
    const bestPerformer = chartData.reduce((best, current) => 
      current.averageScore > best.averageScore ? current : best
    );
    const worstPerformer = chartData.reduce((worst, current) => 
      current.averageScore < worst.averageScore ? current : worst
    );

    // Performance categorization
    const excellentPerformers = chartData.filter(item => item.averageScore > 0.75);
    const goodPerformers = chartData.filter(item => item.averageScore > 0.6 && item.averageScore <= 0.75);
    const averagePerformers = chartData.filter(item => item.averageScore > 0.4 && item.averageScore <= 0.6);
    const poorPerformers = chartData.filter(item => item.averageScore <= 0.4);

    // Calculate performance distribution
    const performanceDistribution = {
      excellent: (excellentPerformers.length / totalSupermarkets * 100),
      good: (goodPerformers.length / totalSupermarkets * 100),
      average: (averagePerformers.length / totalSupermarkets * 100),
      poor: (poorPerformers.length / totalSupermarkets * 100)
    };

    // Calculate sentiment variance and standard deviation
    const sentimentVariance = chartData.reduce((sum, item) => 
      sum + Math.pow(item.averageScore - averageSentiment, 2), 0) / totalSupermarkets;
    const sentimentStdDev = Math.sqrt(sentimentVariance);
    const sentimentRange = bestPerformer.averageScore - worstPerformer.averageScore;

    // Identify outliers (more than 1 standard deviation from mean)
    const outliers = chartData.filter(item => 
      Math.abs(item.averageScore - averageSentiment) > sentimentStdDev
    );

    return {
      totalSupermarkets,
      averageSentiment,
      bestPerformer,
      worstPerformer,
      excellentPerformers,
      goodPerformers,
      averagePerformers,
      poorPerformers,
      performanceDistribution,
      sentimentStdDev,
      sentimentRange,
      outliers
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
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Supermarket Performance Analysis</h4>
      <p className="text-sm text-gray-600 mb-3">
        Comprehensive analysis of {insights.totalSupermarkets} supermarket locations
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Overall Performance */}
        <div className={`p-3 rounded-lg border-l-4 ${
          insights.averageSentiment > 0.7 ? 'bg-green-50 border-green-400' :
          insights.averageSentiment > 0.5 ? 'bg-blue-50 border-blue-400' :
          insights.averageSentiment > 0.3 ? 'bg-yellow-50 border-yellow-400' :
          'bg-red-50 border-red-400'
        }`}>
          <p className={`font-medium ${
            insights.averageSentiment > 0.7 ? 'text-green-800' :
            insights.averageSentiment > 0.5 ? 'text-blue-800' :
            insights.averageSentiment > 0.3 ? 'text-yellow-800' :
            'text-red-800'
          }`}>
            🏪 Network Performance: {
              insights.averageSentiment > 0.7 ? 'EXCELLENT' :
              insights.averageSentiment > 0.5 ? 'GOOD' :
              insights.averageSentiment > 0.3 ? 'NEEDS IMPROVEMENT' :
              'CRITICAL'
            }
          </p>
          <p>
            Average sentiment across all {insights.totalSupermarkets} locations is {insights.averageSentiment.toFixed(3)}. 
            Performance variance is {insights.sentimentStdDev.toFixed(3)} with a range of {insights.sentimentRange.toFixed(3)}, 
            indicating {insights.sentimentRange > 0.3 ? 'high' : insights.sentimentRange > 0.15 ? 'moderate' : 'low'} 
            inconsistency between locations.
          </p>
        </div>

        {/* Performance Distribution */}
        <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
          <p className="font-medium text-indigo-800">📈 Performance Distribution</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span>🌟 Excellent (&gt;0.75):</span>
              <span className="font-medium">{insights.performanceDistribution.excellent.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>✅ Good (0.6-0.75):</span>
              <span className="font-medium">{insights.performanceDistribution.good.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>⚡ Average (0.4-0.6):</span>
              <span className="font-medium">{insights.performanceDistribution.average.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>⚠️ Poor (≤0.4):</span>
              <span className="font-medium">{insights.performanceDistribution.poor.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Top and Bottom Performers */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🏆 Performance Leaders</p>
          <p>
            <strong>Supermarket {insights.bestPerformer.supermarketId}</strong> leads with {insights.bestPerformer.averageScore.toFixed(3)} sentiment score, 
            while <strong>Supermarket {insights.worstPerformer.supermarketId}</strong> needs attention with {insights.worstPerformer.averageScore.toFixed(3)} score. 
            This {((insights.bestPerformer.averageScore - insights.worstPerformer.averageScore) * 100).toFixed(1)}% gap 
            represents significant improvement opportunity.
          </p>
        </div>

        {/* Outlier Analysis */}
        {insights.outliers.length > 0 && (
          <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
            <p className="font-medium text-orange-800">🎯 Performance Outliers</p>
            <p>
              {insights.outliers.length} location(s) show exceptional performance variation: 
              {insights.outliers.map(store => `Supermarket ${store.supermarketId} (${store.averageScore.toFixed(2)})`).join(', ')}. 
              These locations warrant detailed investigation for best practices or improvement needs.
            </p>
          </div>
        )}

        {/* Strategic Recommendations */}
        <div className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
          <p className="font-medium text-yellow-800">💡 Strategic Recommendations</p>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            {insights.poorPerformers.length > 0 && (
              <li>Immediate intervention needed for {insights.poorPerformers.length} underperforming location(s)</li>
            )}
            {insights.excellentPerformers.length > 0 && (
              <li>Replicate successful practices from top {insights.excellentPerformers.length} performer(s) across network</li>
            )}
            {insights.sentimentRange > 0.2 && (
              <li>Standardize operations to reduce performance inconsistency between locations</li>
            )}
            {insights.performanceDistribution.excellent < 25 && (
              <li>Develop improvement programs to increase percentage of excellent-performing locations</li>
            )}
            <li>Implement location-specific customer experience enhancement strategies</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default function SupermarketSentimentChart({ loading = false }: SupermarketSentimentChartProps) {
  const [data, setData] = useState<SupermarketSentimentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSupermarketSentimentData();
  }, []);

  const fetchSupermarketSentimentData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/supermarket-sentiment');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view supermarket sentiment analytics');
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching supermarket sentiment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load supermarket sentiment data');
    } finally {
      setIsLoading(false);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
          <p className="font-medium">Supermarket {payload[0].payload.supermarketId}</p>
          <p className="text-sm">
            Average Score: <span className="font-medium">{payload[0].value.toFixed(2)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  // Generate color based on sentiment score
  const getBarColor = (score: number) => {
    if (score >= 0.66) return '#10b981'; // green for positive
    if (score <= 0.33) return '#ef4444'; // red for negative
    return '#6b7280'; // gray for neutral
  };

  if (loading || isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            Supermarket Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">Loading supermarket sentiment data...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            Supermarket Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <button 
              onClick={fetchSupermarketSentimentData}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.chartData?.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            Supermarket Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">No supermarket sentiment data available</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average sentiment across all supermarkets
  const averageSentiment = 
    data.chartData.reduce((sum, item) => sum + item.averageScore, 0) / data.chartData.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-600" />
            Supermarket Sentiment Analysis
          </CardTitle>
          <div className="text-sm text-gray-600">
            Avg: <span className="font-medium">{averageSentiment.toFixed(2)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[600px] w-full overflow-hidden">
          <div className="h-full w-full overflow-y-auto pr-4">
            <div style={{ height: `${Math.max(400, data.chartData.length * 15)}px`, minHeight: '100%', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.chartData}
                  layout="vertical"
                  margin={{
                    top: 20,
                    right: 30,
                    left: 40,
                    bottom: 20,
                  }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis 
                    type="number" 
                    domain={[0, 1]} 
                    tickCount={5}
                    tickFormatter={(value) => value.toFixed(1)}
                    label={{ value: 'Sentiment Score', position: 'insideBottom', offset: -15 }}
                  />
                  <YAxis 
                    dataKey="supermarketId" 
                    type="category" 
                    width={30}
                    tick={{ fontSize: 12 }}
                    tickMargin={5}
                    interval={0}
                    label={{
                      value: 'Supermarket Branch',
                      angle: -90,
                      position: 'insideLeft',
                      offset: -15,
                      style: {
                        textAnchor: 'middle'
                      }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine x={0.5} stroke="#8884d8" strokeDasharray="3 3" />
                  <Bar 
                    dataKey="averageScore" 
                    name="Sentiment Score"
                    radius={[0, 4, 4, 0]}
                  >
                    {data.chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getBarColor(entry.averageScore)} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Showing average sentiment scores across {data.chartData.length} supermarkets.</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>Positive (&gt; 0.66)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
              <span>Neutral (0.33 to 0.66)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>Negative (&lt; 0.33)</span>
            </div>
          </div>
        </div>
        
        {/* Dynamic AI Review */}
        <DynamicAnalystReview data={data} />
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

interface SentimentProfitDataPoint {
  profit: number;
  averageSentimentScore: number;
  supermarketId: string;
  dataPointCount: number;
}

interface SentimentProfitData {
  chartData: SentimentProfitDataPoint[];
  summary: {
    totalDataPoints: number;
    totalBranches: number;
    averageSentimentScore: number;
    averageProfit: number;
    correlationCoefficient: number;
    sentimentRange: { min: number; max: number };
    profitRange: { min: number; max: number };
  };
}

interface SentimentProfitChartProps {
  loading?: boolean;
}

export default function SentimentProfitChart({ loading = false }: SentimentProfitChartProps) {
  const [data, setData] = useState<SentimentProfitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentimentProfitData();
  }, []);

  const fetchSentimentProfitData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/sentiment-profit-detailed');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view sentiment-profit analytics');
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching sentiment-profit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sentiment-profit data');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Store: {data.supermarketId}</p>
          <p className="text-blue-600">
            <span className="font-medium">Profit:</span> ${data.profit.toFixed(0)}
          </p>
          <p className="text-green-600">
            <span className="font-medium">Avg Sentiment:</span> {data.averageSentimentScore.toFixed(3)}
          </p>
          <p className="text-gray-600 text-sm">
            Based on {data.dataPointCount} sentiment analyses
          </p>
        </div>
      );
    }
    return null;
  };

  // Dynamic AI Review Component
  const DynamicAnalystReview = ({ data }: { data: SentimentProfitData }) => {
    const generateInsights = () => {
      const { chartData, summary } = data;
      
      if (!chartData || chartData.length === 0) {
        return "No sentiment-profit data available for analysis. Please ensure you have both sentiment analyses and supermarket branch data in your database.";
      }

      const { correlationCoefficient, averageSentimentScore, averageProfit } = summary;
      
      // Correlation strength classification
      let correlationStrength = "negligible";
      let correlationDescription = "shows no meaningful relationship";
      
      if (Math.abs(correlationCoefficient) > 0.7) {
        correlationStrength = "strong";
        correlationDescription = correlationCoefficient > 0 ? 
          "demonstrates a strong positive correlation" : 
          "shows a strong negative correlation";
      } else if (Math.abs(correlationCoefficient) > 0.4) {
        correlationStrength = "moderate";
        correlationDescription = correlationCoefficient > 0 ? 
          "demonstrates a moderate positive correlation" : 
          "shows a moderate negative correlation";
      } else if (Math.abs(correlationCoefficient) > 0.2) {
        correlationStrength = "weak";
        correlationDescription = correlationCoefficient > 0 ? 
          "shows a weak positive correlation" : 
          "shows a weak negative correlation";
      }

      // Performance analysis
      const highProfitStores = chartData.filter(d => d.profit > averageProfit);
      const lowProfitStores = chartData.filter(d => d.profit <= averageProfit);
      
      const highProfitAvgSentiment = highProfitStores.length > 0 ? 
        highProfitStores.reduce((sum, d) => sum + d.averageSentimentScore, 0) / highProfitStores.length : 0;
      const lowProfitAvgSentiment = lowProfitStores.length > 0 ? 
        lowProfitStores.reduce((sum, d) => sum + d.averageSentimentScore, 0) / lowProfitStores.length : 0;

      // Best and worst performers
      const bestPerformer = chartData.reduce((best, current) => 
        current.averageSentimentScore > best.averageSentimentScore ? current : best
      );
      const worstPerformer = chartData.reduce((worst, current) => 
        current.averageSentimentScore < worst.averageSentimentScore ? current : worst
      );

      return {
        correlationStrength,
        correlationDescription,
        correlationCoefficient,
        highProfitAvgSentiment,
        lowProfitAvgSentiment,
        bestPerformer,
        worstPerformer,
        totalBranches: summary.totalBranches,
        averageSentimentScore,
        averageProfit
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
        <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Sentiment-Profit Analysis</h4>
        <p className="text-sm text-gray-600 mb-3">
          Analysis of {insights.totalBranches} supermarket branches with {data.summary.totalDataPoints} total sentiment data points
        </p>
        
        <div className="space-y-3 text-sm text-gray-700">
          {/* Correlation Analysis */}
          <div className={`p-3 rounded-lg border-l-4 ${
            insights.correlationStrength === 'strong' ? 'bg-green-50 border-green-400' :
            insights.correlationStrength === 'moderate' ? 'bg-blue-50 border-blue-400' :
            insights.correlationStrength === 'weak' ? 'bg-yellow-50 border-yellow-400' :
            'bg-gray-50 border-gray-400'
          }`}>
            <p className={`font-medium ${
              insights.correlationStrength === 'strong' ? 'text-green-800' :
              insights.correlationStrength === 'moderate' ? 'text-blue-800' :
              insights.correlationStrength === 'weak' ? 'text-yellow-800' :
              'text-gray-800'
            }`}>
              📈 Correlation Analysis: {insights.correlationStrength.toUpperCase()}
            </p>
            <p>
              The analysis {insights.correlationDescription} between supermarket profit and customer sentiment 
              (correlation: {insights.correlationCoefficient.toFixed(3)}). Average sentiment across all branches 
              is {insights.averageSentimentScore.toFixed(3)} with average profit of ${insights.averageProfit.toFixed(0)}.
            </p>
          </div>

          {/* Performance Comparison */}
          <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <p className="font-medium text-purple-800">🏪 Performance Comparison</p>
            <p>
              Higher-profit stores (&gt;${insights.averageProfit.toFixed(0)}) achieve {insights.highProfitAvgSentiment.toFixed(3)} 
              average sentiment compared to {insights.lowProfitAvgSentiment.toFixed(3)} for lower-profit stores. 
              This represents a {((insights.highProfitAvgSentiment - insights.lowProfitAvgSentiment) * 100).toFixed(1)}% 
              sentiment difference between profit tiers.
            </p>
          </div>

          {/* Best/Worst Performers */}
          <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
            <p className="font-medium text-indigo-800">🏆 Performance Leaders</p>
            <p>
              <strong>Top Performer:</strong> Store {insights.bestPerformer.supermarketId} 
              (Sentiment: {insights.bestPerformer.averageSentimentScore.toFixed(3)}, 
              Profit: ${insights.bestPerformer.profit.toFixed(0)})
              <br />
              <strong>Needs Improvement:</strong> Store {insights.worstPerformer.supermarketId} 
              (Sentiment: {insights.worstPerformer.averageSentimentScore.toFixed(3)}, 
              Profit: ${insights.worstPerformer.profit.toFixed(0)})
            </p>
          </div>

          {/* Strategic Recommendations */}
          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
            <p className="font-medium text-amber-800">🚀 Strategic Recommendations</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {insights.correlationStrength === 'strong' && (
                <li><strong>Leverage Strong Correlation:</strong> Profit directly impacts sentiment - focus investment on high-performing profitable strategies</li>
              )}
              {insights.correlationStrength === 'moderate' && (
                <li><strong>Optimize Profit-Sentiment Balance:</strong> Moderate correlation suggests room for improvement - analyze top performers' strategies</li>
              )}
              {insights.correlationStrength === 'weak' || insights.correlationStrength === 'negligible' ? (
                <li><strong>Investigate Non-Profit Factors:</strong> Weak correlation indicates service quality, product selection, or operational efficiency drive sentiment more than profit</li>
              ) : null}
              <li><strong>Best Practice Analysis:</strong> Study Store {insights.bestPerformer.supermarketId}'s operations to replicate success across underperforming locations</li>
              <li><strong>Targeted Improvement:</strong> Focus resources on Store {insights.worstPerformer.supermarketId} and similar low-sentiment locations</li>
              {insights.highProfitAvgSentiment > insights.lowProfitAvgSentiment + 0.1 && (
                <li><strong>Profit-Driven Strategy:</strong> Higher profits correlate with better sentiment - consider strategic investments in profitable operations</li>
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
            Sentiment vs Profit Analysis - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={fetchSentimentProfitData}
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
            Average Sentiment Score vs Profit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No sentiment-profit data available</p>
            <p className="text-sm text-gray-400 mt-1">
              Ensure you have both sentiment analyses and supermarket branch data
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
          <TrendingUp className="w-5 h-5" />
          Average Sentiment Score vs Profit Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Scatter Plot Chart */}
        <div className="h-96 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={data.chartData}
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="profit" 
                type="number"
                name="Profit ($)"
                domain={['dataMin - 50', 'dataMax + 50']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                label={{ value: 'Profit ($)', position: 'insideBottom', offset: -15 }}
              />
              <YAxis 
                dataKey="averageSentimentScore"
                type="number"
                name="Avg Sentiment Score"
                domain={[0, 1]}
                tickFormatter={(value) => value.toFixed(2)}
                label={{
                  value: 'Sentiment score',
                  angle: -90,
                  position: 'insideLeft',
                  offset: -5,
                  style: {
                    textAnchor: 'middle'
                  }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                dataKey="averageSentimentScore" 
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth={1}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Dynamic AI Review */}
        <DynamicAnalystReview data={data} />
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, AlertTriangle, BarChart3 } from "lucide-react";

interface SentimentPromotionDataPoint {
  promotionSpend: number;
  averageSentimentScore: number;
  supermarketId: string;
  dataPointCount: number;
}

interface SentimentPromotionData {
  chartData: SentimentPromotionDataPoint[];
  summary: {
    totalDataPoints: number;
    totalBranches: number;
    averageSentimentScore: number;
    averagePromotionSpend: number;
    correlationCoefficient: number;
    sentimentRange: { min: number; max: number };
    promotionSpendRange: { min: number; max: number };
  };
}

interface SentimentPromotionChartProps {
  loading?: boolean;
}

export default function SentimentPromotionChart({ loading = false }: SentimentPromotionChartProps) {
  const [data, setData] = useState<SentimentPromotionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentimentPromotionData();
  }, []);

  const fetchSentimentPromotionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/sentiment-promotion');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view sentiment-promotion analytics');
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching sentiment-promotion data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sentiment-promotion data');
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
          <p className="text-purple-600">
            <span className="font-medium">Promotion Spend:</span> ${data.promotionSpend.toFixed(0)}
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
  const DynamicAnalystReview = ({ data }: { data: SentimentPromotionData }) => {
    const generateInsights = () => {
      const { chartData, summary } = data;
      
      if (!chartData || chartData.length === 0) {
        return "No sentiment-promotion data available for analysis. Please ensure you have both sentiment analyses and supermarket branch promotion spend data in your database.";
      }

      const { correlationCoefficient, averageSentimentScore, averagePromotionSpend } = summary;
      
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
      const highSpendStores = chartData.filter(d => d.promotionSpend > averagePromotionSpend);
      const lowSpendStores = chartData.filter(d => d.promotionSpend <= averagePromotionSpend);
      
      const highSpendAvgSentiment = highSpendStores.length > 0 ? 
        highSpendStores.reduce((sum, d) => sum + d.averageSentimentScore, 0) / highSpendStores.length : 0;
      const lowSpendAvgSentiment = lowSpendStores.length > 0 ? 
        lowSpendStores.reduce((sum, d) => sum + d.averageSentimentScore, 0) / lowSpendStores.length : 0;

      // Best and worst performers
      const bestPerformer = chartData.reduce((best, current) => 
        current.averageSentimentScore > best.averageSentimentScore ? current : best
      );
      const worstPerformer = chartData.reduce((worst, current) => 
        current.averageSentimentScore < worst.averageSentimentScore ? current : worst
      );

      // ROI analysis
      const roiDifference = highSpendAvgSentiment - lowSpendAvgSentiment;
      const spendDifference = averagePromotionSpend;

      return {
        correlationStrength,
        correlationDescription,
        correlationCoefficient,
        highSpendAvgSentiment,
        lowSpendAvgSentiment,
        bestPerformer,
        worstPerformer,
        totalBranches: summary.totalBranches,
        averageSentimentScore,
        averagePromotionSpend,
        roiDifference,
        spendDifference
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
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Sentiment-Promotion Analysis</h4>
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
              💰 Promotion ROI Analysis: {insights.correlationStrength.toUpperCase()}
            </p>
            <p>
              The analysis {insights.correlationDescription} between promotion spend and customer sentiment 
              (correlation: {insights.correlationCoefficient.toFixed(3)}). Average sentiment across all branches 
              is {insights.averageSentimentScore.toFixed(3)} with average promotion spend of ${insights.averagePromotionSpend.toFixed(0)}.
            </p>
          </div>

          {/* Spend Effectiveness */}
          <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <p className="font-medium text-purple-800">📊 Promotion Spend Effectiveness</p>
            <p>
              Higher-spending stores (&gt;${insights.averagePromotionSpend.toFixed(0)}) achieve {insights.highSpendAvgSentiment.toFixed(3)} 
              average sentiment compared to {insights.lowSpendAvgSentiment.toFixed(3)} for lower-spending stores. 
              This represents a {((insights.highSpendAvgSentiment - insights.lowSpendAvgSentiment) * 100).toFixed(1)}% 
              sentiment improvement from increased promotion investment.
            </p>
          </div>

          {/* Best/Worst Performers */}
          <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
            <p className="font-medium text-indigo-800">🏆 Promotion Performance Leaders</p>
            <p>
              <strong>Top Performer:</strong> Store {insights.bestPerformer.supermarketId} 
              (Sentiment: {insights.bestPerformer.averageSentimentScore.toFixed(3)}, 
              Promotion Spend: ${insights.bestPerformer.promotionSpend.toFixed(0)})
              <br />
              <strong>Needs Improvement:</strong> Store {insights.worstPerformer.supermarketId} 
              (Sentiment: {insights.worstPerformer.averageSentimentScore.toFixed(3)}, 
              Promotion Spend: ${insights.worstPerformer.promotionSpend.toFixed(0)})
            </p>
          </div>

          {/* Strategic Recommendations */}
          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
            <p className="font-medium text-amber-800">🚀 Promotion Strategy Recommendations</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {insights.correlationStrength === 'strong' && insights.correlationCoefficient > 0 && (
                <li><strong>Scale Successful Promotions:</strong> Strong positive correlation indicates promotion spend directly improves sentiment - increase budget for high-performing campaigns</li>
              )}
              {insights.correlationStrength === 'strong' && insights.correlationCoefficient < 0 && (
                <li><strong>Reassess Promotion Strategy:</strong> Strong negative correlation suggests current promotions may be counterproductive - review promotion types and targeting</li>
              )}
              {insights.correlationStrength === 'moderate' && (
                <li><strong>Optimize Promotion Mix:</strong> Moderate correlation suggests room for improvement - analyze which promotion types yield best sentiment returns</li>
              )}
              {insights.correlationStrength === 'weak' || insights.correlationStrength === 'negligible' ? (
                <li><strong>Diversify Customer Experience Focus:</strong> Weak correlation indicates factors beyond promotions drive sentiment - consider service quality, product selection, and store experience</li>
              ) : null}
              <li><strong>Best Practice Replication:</strong> Study Store {insights.bestPerformer.supermarketId}'s promotion strategy to replicate success across underperforming locations</li>
              <li><strong>Targeted Investment:</strong> Focus promotion budget optimization on Store {insights.worstPerformer.supermarketId} and similar low-sentiment locations</li>
              {insights.roiDifference > 0.05 && (
                <li><strong>ROI-Driven Budgeting:</strong> Higher promotion spend correlates with better sentiment - consider strategic budget reallocation to high-impact stores</li>
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
            Sentiment vs Promotion Spend Analysis - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={fetchSentimentPromotionData}
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
            Average Sentiment Score vs Promotion Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No sentiment-promotion data available</p>
            <p className="text-sm text-gray-400 mt-1">
              Ensure you have both sentiment analyses and supermarket branch promotion data
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
          <DollarSign className="w-5 h-5" />
          Average Sentiment Score vs Promotion Spend Analysis
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
                dataKey="promotionSpend" 
                type="number"
                name="Promotion Spend ($)"
                domain={['dataMin - 50', 'dataMax + 50']}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <YAxis 
                dataKey="averageSentimentScore"
                type="number"
                name="Avg Sentiment Score"
                domain={[0, 1]}
                tickFormatter={(value) => value.toFixed(2)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Scatter 
                dataKey="averageSentimentScore" 
                fill="#8b5cf6"
                stroke="#7c3aed"
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

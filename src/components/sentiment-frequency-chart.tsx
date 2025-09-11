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
import { ShoppingCart, AlertTriangle, BarChart3 } from "lucide-react";

interface SentimentFrequencyDataPoint {
  purchaseFrequency: number;
  averageSentimentScore: number;
  customerId: string;
  dataPointCount: number;
}

interface SentimentFrequencyData {
  chartData: SentimentFrequencyDataPoint[];
  summary: {
    totalDataPoints: number;
    totalCustomers: number;
    averageSentimentScore: number;
    averagePurchaseFrequency: number;
    correlationCoefficient: number;
    sentimentRange: { min: number; max: number };
    frequencyRange: { min: number; max: number };
  };
}

interface SentimentFrequencyChartProps {
  loading?: boolean;
}

export default function SentimentFrequencyChart({ loading = false }: SentimentFrequencyChartProps) {
  const [data, setData] = useState<SentimentFrequencyData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSentimentFrequencyData();
  }, []);

  const fetchSentimentFrequencyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/sentiment-frequency');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view sentiment-frequency analytics');
        }
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching sentiment-frequency data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sentiment-frequency data');
    } finally {
      setIsLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">Customer: {data.customerId}</p>
          <p className="text-pink-600">
            <span className="font-medium">Purchase Frequency:</span> {data.purchaseFrequency}
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
  const DynamicAnalystReview = ({ data }: { data: SentimentFrequencyData }) => {
    const generateInsights = () => {
      const { chartData, summary } = data;
      
      if (!chartData || chartData.length === 0) {
        return "No sentiment-frequency data available for analysis. Please ensure you have both sentiment analyses and customer purchase frequency data in your database.";
      }

      const { correlationCoefficient, averageSentimentScore, averagePurchaseFrequency } = summary;
      
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
      const highFrequencyCustomers = chartData.filter(d => d.purchaseFrequency > averagePurchaseFrequency);
      const lowFrequencyCustomers = chartData.filter(d => d.purchaseFrequency <= averagePurchaseFrequency);
      
      const highFrequencyAvgSentiment = highFrequencyCustomers.length > 0 ? 
        highFrequencyCustomers.reduce((sum, d) => sum + d.averageSentimentScore, 0) / highFrequencyCustomers.length : 0;
      const lowFrequencyAvgSentiment = lowFrequencyCustomers.length > 0 ? 
        lowFrequencyCustomers.reduce((sum, d) => sum + d.averageSentimentScore, 0) / lowFrequencyCustomers.length : 0;

      // Best and worst performers
      const bestPerformer = chartData.reduce((best, current) => 
        current.averageSentimentScore > best.averageSentimentScore ? current : best
      );
      const worstPerformer = chartData.reduce((worst, current) => 
        current.averageSentimentScore < worst.averageSentimentScore ? current : worst
      );

      // Customer loyalty insights
      const loyaltyDifference = highFrequencyAvgSentiment - lowFrequencyAvgSentiment;
      const frequencySegments = {
        low: chartData.filter(d => d.purchaseFrequency <= averagePurchaseFrequency * 0.5).length,
        medium: chartData.filter(d => d.purchaseFrequency > averagePurchaseFrequency * 0.5 && d.purchaseFrequency <= averagePurchaseFrequency * 1.5).length,
        high: chartData.filter(d => d.purchaseFrequency > averagePurchaseFrequency * 1.5).length
      };

      return {
        correlationStrength,
        correlationDescription,
        correlationCoefficient,
        highFrequencyAvgSentiment,
        lowFrequencyAvgSentiment,
        bestPerformer,
        worstPerformer,
        totalCustomers: summary.totalCustomers,
        averageSentimentScore,
        averagePurchaseFrequency,
        loyaltyDifference,
        frequencySegments
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
        <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Sentiment-Frequency Analysis</h4>
        <p className="text-sm text-gray-600 mb-3">
          Analysis of {insights.totalCustomers} customers with {data.summary.totalDataPoints} total sentiment data points
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
              🛒 Customer Loyalty Analysis: {insights.correlationStrength.toUpperCase()}
            </p>
            <p>
              The analysis {insights.correlationDescription} between purchase frequency and customer sentiment 
              (correlation: {insights.correlationCoefficient.toFixed(3)}). Average sentiment across all customers 
              is {insights.averageSentimentScore.toFixed(3)} with average purchase frequency of {insights.averagePurchaseFrequency.toFixed(1)}.
            </p>
          </div>

          {/* Customer Loyalty Insights */}
          <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
            <p className="font-medium text-purple-800">👥 Customer Loyalty Insights</p>
            <p>
              High-frequency customers (&gt;{insights.averagePurchaseFrequency.toFixed(1)} purchases) achieve {insights.highFrequencyAvgSentiment.toFixed(3)} 
              average sentiment compared to {insights.lowFrequencyAvgSentiment.toFixed(3)} for low-frequency customers. 
              This represents a {((insights.highFrequencyAvgSentiment - insights.lowFrequencyAvgSentiment) * 100).toFixed(1)}% 
              sentiment advantage for frequent shoppers.
            </p>
          </div>

          {/* Customer Segmentation */}
          <div className="p-3 bg-cyan-50 rounded-lg border-l-4 border-cyan-400">
            <p className="font-medium text-cyan-800">📊 Customer Segmentation</p>
            <p>
              Customer base breakdown: {insights.frequencySegments.low} low-frequency, {insights.frequencySegments.medium} medium-frequency, 
              and {insights.frequencySegments.high} high-frequency customers. This distribution indicates 
              {insights.frequencySegments.high > insights.frequencySegments.low ? ' strong customer loyalty with many repeat buyers' : 
               insights.frequencySegments.low > insights.frequencySegments.high ? ' opportunity to improve customer retention' : 
               ' balanced customer engagement across frequency segments'}.
            </p>
          </div>

          {/* Best/Worst Performers */}
          <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
            <p className="font-medium text-indigo-800">🏆 Customer Experience Leaders</p>
            <p>
              <strong>Most Satisfied Customer:</strong> {insights.bestPerformer.customerId} 
              (Sentiment: {insights.bestPerformer.averageSentimentScore.toFixed(3)}, 
              Purchase Frequency: {insights.bestPerformer.purchaseFrequency})
              <br />
              <strong>Needs Attention:</strong> {insights.worstPerformer.customerId} 
              (Sentiment: {insights.worstPerformer.averageSentimentScore.toFixed(3)}, 
              Purchase Frequency: {insights.worstPerformer.purchaseFrequency})
            </p>
          </div>

          {/* Strategic Recommendations */}
          <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-400">
            <p className="font-medium text-amber-800">🚀 Customer Retention Strategy</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {insights.correlationStrength === 'strong' && insights.correlationCoefficient > 0 && (
                <li><strong>Loyalty Program Enhancement:</strong> Strong positive correlation indicates frequent customers are happier - expand loyalty rewards and personalized experiences</li>
              )}
              {insights.correlationStrength === 'strong' && insights.correlationCoefficient < 0 && (
                <li><strong>Customer Experience Review:</strong> Strong negative correlation suggests frequent customers become dissatisfied - investigate service quality and product consistency</li>
              )}
              {insights.correlationStrength === 'moderate' && (
                <li><strong>Targeted Engagement:</strong> Moderate correlation suggests opportunity to improve customer experience for frequent shoppers through personalized service</li>
              )}
              {insights.correlationStrength === 'weak' || insights.correlationStrength === 'negligible' ? (
                <li><strong>Holistic Experience Focus:</strong> Weak correlation indicates factors beyond frequency drive satisfaction - focus on product quality, service, and store experience</li>
              ) : null}
              <li><strong>Best Practice Analysis:</strong> Study customer {insights.bestPerformer.customerId}'s experience to understand satisfaction drivers</li>
              <li><strong>Retention Focus:</strong> Prioritize improving experience for customer {insights.worstPerformer.customerId} and similar low-sentiment customers</li>
              {insights.loyaltyDifference > 0.05 && (
                <li><strong>Frequency-Based Rewards:</strong> Higher purchase frequency correlates with better sentiment - implement tiered loyalty programs</li>
              )}
              {insights.frequencySegments.low > insights.frequencySegments.high && (
                <li><strong>Retention Campaign:</strong> High number of low-frequency customers indicates need for targeted retention and engagement initiatives</li>
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
            Sentiment vs Purchase Frequency Analysis - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-2">{error}</p>
            <button 
              onClick={fetchSentimentFrequencyData}
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
            Average Sentiment Score vs Purchase Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No sentiment-frequency data available</p>
            <p className="text-sm text-gray-400 mt-1">
              Ensure you have both sentiment analyses and customer purchase frequency data
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
          <ShoppingCart className="w-5 h-5" />
          Average Sentiment Score vs Purchase Frequency Analysis
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
                dataKey="purchaseFrequency" 
                type="number"
                name="Purchase Frequency"
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(value) => value.toString()}
                label={{ value: 'Purchase Frequency', position: 'insideBottom', offset: -15 }}
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
                fill="#ec4899"
                stroke="#db2777"
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

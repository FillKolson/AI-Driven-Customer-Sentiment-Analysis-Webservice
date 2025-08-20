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
  Cell
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
        <div className="h-96 w-full">
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
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis 
                type="number" 
                domain={[0, 1]} 
                tickCount={5}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <YAxis 
                dataKey="supermarketId" 
                type="category" 
                width={40}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="averageScore" 
                name="Average Sentiment Score"
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
        <div className="mt-4 text-sm text-gray-600">
          <p>Showing average sentiment scores across {data.chartData.length} supermarkets.</p>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
              <span>Positive (&gt; 0.66)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-500 rounded-sm"></div>
              <span>Neutral (-0.33 to 0.66)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
              <span>Negative (&lt; -0.33)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

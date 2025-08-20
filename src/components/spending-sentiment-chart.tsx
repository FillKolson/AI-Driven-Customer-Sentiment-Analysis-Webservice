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
      </CardContent>
    </Card>
  );
}

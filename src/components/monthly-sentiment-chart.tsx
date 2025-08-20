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
          <p>Avg. Score: {data.averageScore.toFixed(2)}</p>
          <p>Analyses: {data.count}</p>
        </div>
      );
    }
    return null;
  };

  // Format month from YYYY-MM to Month YYYY (e.g., "2023-01" to "Jan 2023")
  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
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
              />
              <YAxis 
                domain={[0, 1]} 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Legend />
              <Bar 
                dataKey="averageScore" 
                name="Average Sentiment Score"
                radius={[4, 4, 0, 0]}
                barSize={30}
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
        <div className="mt-2 text-sm text-gray-500 text-center">
          Hover over bars to see details. Scores range from 0 (very negative) to 5 (very positive).
        </div>
      </CardContent>
    </Card>
  );
}

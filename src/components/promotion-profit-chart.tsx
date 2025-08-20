'use client';

import { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Loader2 } from 'lucide-react';

interface BranchData {
  branch_id: string;
  branch_name: string;
  promotion_spend: number;
  profit: number;
}

interface PromotionProfitResponse {
  chartData: BranchData[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function PromotionProfitChart({ loading: externalLoading }: { loading?: boolean }) {
  const [data, setData] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/promotion-profit');
        
        if (!response.ok) {
          throw new Error('Failed to fetch promotion profit data');
        }
        
        const result: PromotionProfitResponse = await response.json();
        setData(result.chartData || []);
      } catch (err) {
        console.error('Error fetching promotion profit data:', err);
        setError('Failed to load promotion profit data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as BranchData;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{data.branch_name}</p>
          <p>Promotion Spend: ${data.promotion_spend?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p>Profit: ${data.profit?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          {data.profit && data.promotion_spend && (
            <p>ROI: {((data.profit / data.promotion_spend) * 100).toFixed(1)}%</p>
          )}
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
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
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex items-center justify-center">
          <p className="text-gray-500">No promotion profit data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate correlation coefficient for the trend line
  const calculateCorrelation = () => {
    const n = data.length;
    if (n === 0) return 0;

    const x = data.map(d => d.promotion_spend);
    const y = data.map(d => d.profit);
    
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    
    let numerator = 0;
    let xDenominator = 0;
    let yDenominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      xDenominator += xDiff * xDiff;
      yDenominator += yDiff * yDiff;
    }
    
    return numerator / Math.sqrt(xDenominator * yDenominator);
  };

  const correlation = calculateCorrelation();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Promotion Spend vs. Profit
          </CardTitle>
          <div className="text-sm text-gray-600">
            Correlation: <span className={`font-medium ${correlation > 0 ? 'text-green-600' : correlation < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {correlation.toFixed(2)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="promotion_spend" 
                name="Promotion Spend"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Promotion Spend ($)', position: 'insideBottom', offset: -5 }}
                domain={['auto', 'auto']}
              />
              <YAxis 
                type="number" 
                dataKey="profit" 
                name="Profit"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                label={{ value: 'Profit ($)', angle: -90, position: 'insideLeft' }}
                domain={['auto', 'auto']}
              />
              <ZAxis type="number" range={[100, 500]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter name="Branches" data={data}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-sm text-gray-500 text-center">
          Each point represents a supermarket branch. Hover for details.
        </div>
      </CardContent>
    </Card>
  );
}

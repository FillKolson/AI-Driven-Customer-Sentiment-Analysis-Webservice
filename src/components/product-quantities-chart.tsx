'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

interface ProductQuantity {
  product_name: string;
  quantity: number;
}

interface ProductQuantitiesResponse {
  products: ProductQuantity[];
}

const COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#6366F1', // indigo-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F43F5E', // rose-500
  '#0EA5E9', // sky-500
  '#A855F7', // purple-500
  '#22C55E', // green-500
  '#F59E0B'  // amber-500 (repeats if needed)
];

const getGradientColor = (baseColor: string) => {
  return `url(#gradient-${baseColor.replace('#', '')})`;
};

export default function ProductQuantitiesChart() {
  const [data, setData] = useState<ProductQuantity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/analytics/product-quantities');
        
        if (!response.ok) {
          throw new Error('Failed to fetch product quantities');
        }
        
        const result: ProductQuantitiesResponse = await response.json();
        setData(result.products);
      } catch (err) {
        console.error('Error fetching product quantities:', err);
        setError('Failed to load product quantities');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p>Quantity: {data.quantity}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="w-full h-[500px] p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Product Quantities
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Top products by quantity purchased
          </p>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="sr-only">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full h-[500px] p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Product Quantities
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Top products by quantity purchased
          </p>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full h-[500px] p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Product Quantities
            </CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Top products by quantity purchased
          </p>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] flex items-center justify-center">
          <p className="text-gray-500">No product data available</p>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = data.map(item => ({
    name: item.product_name,
    quantity: item.quantity
  }));

  return (
    <Card className="w-full h-[500px] p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Product Quantities
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Top products by quantity purchased
        </p>
      </CardHeader>
      <CardContent className="h-[calc(100%-80px)]">
        <style jsx>{`
          .bar-chart .recharts-bar-rectangle:hover {
            filter: brightness(1.1);
            transition: all 0.2s ease-in-out;
          }
          .bar-chart .recharts-cartesian-grid line {
            stroke: rgba(0, 0, 0, 0.05);
          }
          .dark .bar-chart .recharts-cartesian-grid line {
            stroke: rgba(255, 255, 255, 0.05);
          }
        `}</style>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            barSize={24}
            barGap={4}
            barCategoryGap={8}
            className="bar-chart"
          >
            <defs>
              {COLORS.map((color) => (
                <linearGradient key={color} id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.4} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" />
            <YAxis 
              dataKey="name" 
              type="category" 
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey="quantity" 
              name="Quantity"
            >
              {chartData.map((entry, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getGradientColor(color)}
                    stroke={color}
                    strokeWidth={1}
                    style={{
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.05))'
                    }}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

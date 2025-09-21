'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { ShoppingCart, BarChart3 } from 'lucide-react';
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
      <Card className="w-full h-[500px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Product Quantities
          </CardTitle>
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
      <Card className="w-full h-[500px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Product Quantities
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)] flex items-center justify-center">
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="w-full h-[500px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Product Quantities
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-80px)]">
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No product data available</p>
            <p className="text-sm text-gray-400 mt-1">
              Ensure product quantities are present in your dataset
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for the chart
  const chartData = data.map(item => ({
    name: item.product_name,
    quantity: item.quantity
  }));

  // Calculate total height needed based on number of products
  const barHeight = 16; // Fixed height for each bar
  const barGap = 4; // Gap between bars
  const padding = 100; // Top and bottom padding
  const totalHeight = Math.max(
    chartData.length * (barHeight + barGap) + padding,
    400 // Minimum height
  );

  return (
    <div className="w-full">
      <Card className="w-full h-[600px] bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            Product Quantities
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 flex flex-col">
          <div className="overflow-y-auto flex-1">
            <div style={{ height: `${totalHeight}px`, minHeight: '100%', position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 25
                  }}
                  barSize={barHeight}
                  barGap={barGap}
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
                <XAxis type="number"
                label={{ value: 'Quantity', position: 'insideBottom', offset: -15 }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickMargin={5}
                  interval={0}
                  tickFormatter={(value) => {
                    const maxLength = 30;
                    return value.length > maxLength 
                      ? `${value.substring(0, maxLength)}...` 
                      : value;
                  }}
                  label={{
                    value: 'Product Name',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -10,
                    style: {
                      textAnchor: 'middle'
                    }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="quantity" name="Quantity">
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
            </div>
          </div>
        </CardContent>
      </Card>
      
      <DynamicProductQuantitiesReview data={data} />
    </div>
  );
}

// Dynamic AI Review Component for Product Quantities
const DynamicProductQuantitiesReview = ({ data }: { data: ProductQuantity[] }) => {
  const generateDataInsights = () => {
    if (!data || data.length === 0) {
      return {
        totalProducts: 0,
        totalQuantity: 0,
        averageQuantity: 0,
        topProduct: null,
        lowProduct: null,
        quantityRange: 0,
        distribution: { high: 0, medium: 0, low: 0 }
      };
    }

    const totalQuantity = data.reduce((sum, product) => sum + product.quantity, 0);
    const averageQuantity = totalQuantity / data.length;
    const topProduct = data.reduce((max, current) => current.quantity > max.quantity ? current : max);
    const lowProduct = data.reduce((min, current) => current.quantity < min.quantity ? current : min);
    const quantityRange = topProduct.quantity - lowProduct.quantity;

    // Categorize products by quantity levels
    const distribution = data.reduce((acc, product) => {
      if (product.quantity >= averageQuantity * 1.5) acc.high++;
      else if (product.quantity >= averageQuantity * 0.5) acc.medium++;
      else acc.low++;
      return acc;
    }, { high: 0, medium: 0, low: 0 });

    return {
      totalProducts: data.length,
      totalQuantity,
      averageQuantity,
      topProduct,
      lowProduct,
      quantityRange,
      distribution
    };
  };

  const generateDynamicReview = () => {
    const insights = generateDataInsights();
    
    // Performance classification based on product diversity and quantity distribution
    let performanceLevel = "needs improvement";
    let performanceColor = "text-red-600";
    let performanceBg = "bg-red-50";
    let performanceBorder = "border-red-400";
    
    const diversityScore = (insights.distribution.high + insights.distribution.medium + insights.distribution.low) / 3;
    const balanceScore = Math.min(insights.distribution.high, insights.distribution.medium, insights.distribution.low) / Math.max(insights.distribution.high, insights.distribution.medium, insights.distribution.low);
    
    if (diversityScore >= 3 && balanceScore >= 0.5) {
      performanceLevel = "excellent";
      performanceColor = "text-green-600";
      performanceBg = "bg-green-50";
      performanceBorder = "border-green-400";
    } else if (diversityScore >= 2 && balanceScore >= 0.3) {
      performanceLevel = "good";
      performanceColor = "text-blue-600";
      performanceBg = "bg-blue-50";
      performanceBorder = "border-blue-400";
    } else if (diversityScore >= 1.5) {
      performanceLevel = "average";
      performanceColor = "text-yellow-600";
      performanceBg = "bg-yellow-50";
      performanceBorder = "border-yellow-400";
    }

    // Distribution analysis
    const dominantCategory = insights.distribution.high > insights.distribution.medium && insights.distribution.high > insights.distribution.low ? 'high-volume' :
                           insights.distribution.medium > insights.distribution.low ? 'medium-volume' : 'low-volume';

    return {
      performanceLevel,
      performanceColor,
      performanceBg,
      performanceBorder,
      dominantCategory,
      insights
    };
  };

  const review = generateDynamicReview();
  const { insights } = review;

  if (!insights.topProduct) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-white rounded-lg">
      <h4 className="font-semibold text-gray-900 mb-2">🤖 AI-Generated Product Analysis</h4>
      <p className="text-sm text-gray-600 mb-3">
        Analysis based on {insights.totalProducts} products with {insights.totalQuantity.toLocaleString()} total units sold
      </p>
      
      <div className="space-y-3 text-sm text-gray-700">
        {/* Performance Overview */}
        <div className={`p-3 ${review.performanceBg} rounded-lg border-l-4 ${review.performanceBorder}`}>
          <p className={`font-medium ${review.performanceColor}`}>🎯 Product Portfolio Performance: {review.performanceLevel.toUpperCase()}</p>
          <p>
            Your product portfolio shows {insights.totalProducts} active products with an average of {insights.averageQuantity.toFixed(0)} units per product. 
            The quantity range spans {insights.quantityRange.toLocaleString()} units from your lowest to highest performing product, 
            indicating {insights.quantityRange > insights.averageQuantity * 2 ? 'significant' : 'moderate'} performance variation across your inventory.
          </p>
        </div>

        {/* Top Performer Analysis */}
        <div className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
          <p className="font-medium text-green-800">🏆 Best Performing Product</p>
          <p>
            <strong>{insights.topProduct.product_name}</strong> leads your portfolio with {insights.topProduct.quantity.toLocaleString()} units sold, 
            representing {((insights.topProduct.quantity / insights.totalQuantity) * 100).toFixed(1)}% of total volume. 
            This product performs {(insights.topProduct.quantity / insights.averageQuantity).toFixed(1)}x above the portfolio average, 
            making it a key revenue driver that deserves continued focus and potential expansion.
          </p>
        </div>

        {/* Distribution Analysis */}
        <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <p className="font-medium text-blue-800">📊 Portfolio Distribution Analysis</p>
          <p>
            Your product mix consists of {insights.distribution.high} high-volume products (above {(insights.averageQuantity * 1.5).toFixed(0)} units), 
            {insights.distribution.medium} medium-volume products ({(insights.averageQuantity * 0.5).toFixed(0)}-{(insights.averageQuantity * 1.5).toFixed(0)} units), 
            and {insights.distribution.low} low-volume products (below {(insights.averageQuantity * 0.5).toFixed(0)} units). 
            This distribution is {review.dominantCategory === 'high-volume' ? 'top-heavy' : review.dominantCategory === 'medium-volume' ? 'well-balanced' : 'long-tail'} 
            with most products in the {review.dominantCategory} category.
          </p>
        </div>

        {/* Underperformer Analysis */}
        {insights.lowProduct && insights.lowProduct.quantity < insights.averageQuantity * 0.3 && (
          <div className="p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
            <p className="font-medium text-orange-800">⚠️ Underperforming Product Alert</p>
            <p>
              <strong>{insights.lowProduct.product_name}</strong> shows concerning performance with only {insights.lowProduct.quantity.toLocaleString()} units sold, 
              which is {((1 - insights.lowProduct.quantity / insights.averageQuantity) * 100).toFixed(0)}% below the portfolio average. 
              This product may require immediate attention through promotional activities, repositioning, or consideration for discontinuation.
            </p>
          </div>
        )}

        {/* Strategic Recommendations */}
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
          <p className="font-medium text-purple-800">🚀 Data-Driven Recommendations</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Leverage Top Performer:</strong> Expand inventory and marketing focus on {insights.topProduct.product_name} to maximize its proven success</li>
            {insights.distribution.high >= 3 && (
              <li><strong>Diversify High Performers:</strong> With {insights.distribution.high} strong products, consider cross-promotion strategies to boost overall portfolio</li>
            )}
            {insights.distribution.low > insights.totalProducts * 0.4 && (
              <li><strong>Address Long Tail:</strong> {insights.distribution.low} low-volume products may benefit from bundling, promotion, or strategic discontinuation</li>
            )}
            {insights.quantityRange > insights.averageQuantity * 3 && (
              <li><strong>Balance Portfolio:</strong> Large performance gaps suggest opportunities to elevate mid-tier products through targeted marketing</li>
            )}
            <li><strong>Inventory Optimization:</strong> Focus procurement and shelf space on products performing above {insights.averageQuantity.toFixed(0)} units average</li>
            {review.dominantCategory === 'low-volume' && (
              <li><strong>Portfolio Restructuring:</strong> Consider consolidating or replacing underperforming products to improve overall efficiency</li>
            )}
            <li><strong>Performance Monitoring:</strong> Track quantity trends monthly to identify emerging winners and declining products early</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

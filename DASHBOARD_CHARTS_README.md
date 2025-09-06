# Dashboard Charts Implementation

This document describes the comprehensive dashboard implementation with 15 sequential charts for the sentiment analysis history page.

## Overview

The dashboard displays comprehensive analytics and visualizations based on sentiment analysis data, customer information, and supermarket metrics. The implementation includes error handling for cases where insufficient data is available to build graphs.

## Charts Overview

### 1. Key Metrics Chart
- **Type**: Line chart with dual Y-axes
- **X-axis**: Sentiment date
- **Y-axes**: Average Order Value ($) and Sentiment Score
- **Summary Metrics**: Average Sentiment Score, Average Total Purchases, Average Order Value
- **Review**: Analysis of correlation between sentiment and order value

### 2. Sentiment Score vs Profit
- **Type**: Line chart
- **X-axis**: Profit
- **Y-axis**: Average sentiment score
- **Review**: Analysis of sentiment trends in relation to profit levels

### 3. Sentiment Score vs Promotion Spend
- **Type**: Line chart
- **X-axis**: Promotion Spend
- **Y-axis**: Average sentiment score
- **Review**: Analysis of sentiment correlation with promotion spending

### 4. Sentiment Score vs Purchase Frequency
- **Type**: Line chart
- **X-axis**: Purchase Frequency
- **Y-axis**: Average sentiment score
- **Review**: Analysis of sentiment patterns across purchase frequency

### 5. Sentiment Categories Distribution
- **Type**: Pie chart
- **Data**: Percentage distribution of positive, negative, and neutral sentiments
- **Review**: Analysis of overall sentiment distribution

### 6. Supermarket Sentiment Ranking
- **Type**: Horizontal bar chart
- **X-axis**: Average Sentiment Score
- **Y-axis**: Supermarket ID
- **Review**: Top and bottom performing supermarkets analysis

### 7. Gender-based Sentiment Analysis
- **Type**: Pie chart
- **Data**: Average sentiment scores by gender with count
- **Review**: Gender-based sentiment comparison

### 8. Spending Score vs Sentiment
- **Type**: Vertical bar chart
- **X-axis**: Spending Score (1-100)
- **Y-axis**: Average sentiment score
- **Review**: Analysis of sentiment correlation with spending behavior

### 9. Annual Income vs Sentiment
- **Type**: Line chart
- **X-axis**: Annual Income
- **Y-axis**: Average sentiment score
- **Review**: Income-based sentiment analysis

### 10. Age vs Sentiment
- **Type**: Vertical bar chart
- **X-axis**: Age
- **Y-axis**: Average sentiment score
- **Review**: Age-based sentiment patterns

### 11. Promotion Spend vs Profit
- **Type**: Scatter plot
- **X-axis**: Promotion Spend
- **Y-axis**: Profit
- **Review**: Correlation analysis between promotion spending and profit

### 12. Administration Spend vs Profit
- **Type**: Scatter plot
- **X-axis**: Administration Spend
- **Y-axis**: Profit
- **Review**: Analysis of administrative spending impact on profit

### 13. Advertisement Spend vs Profit
- **Type**: Line chart
- **X-axis**: Advertisement Spend
- **Y-axis**: Profit
- **Review**: Advertising effectiveness analysis

### 14. Monthly Sentiment Analysis
- **Type**: Horizontal bar chart
- **X-axis**: Average sentiment score
- **Y-axis**: Month (June/July)
- **Review**: Monthly sentiment comparison

### 15. Product Purchase Count
- **Type**: Horizontal bar chart
- **X-axis**: Purchase count
- **Y-axis**: Product name
- **Review**: Product popularity analysis

## Technical Implementation

### Files Modified/Created

1. **`src/components/history-visualizations.tsx`**
   - Complete rewrite with 15 comprehensive charts
   - Error handling for insufficient data
   - Responsive design with proper loading states
   - Mock data generation for demonstration

2. **`src/app/api/analytics/dashboard/route.ts`**
   - New API endpoint for fetching comprehensive analytics data
   - Joins sentiment analyses with customer and supermarket data
   - Proper error handling and data processing

3. **`src/app/dashboard/history/page.tsx`**
   - Updated to use new analytics endpoint
   - Simplified data fetching logic

4. **`scripts/populate-sample-data.js`**
   - Script to populate database with sample data for testing
   - Creates realistic test data across all required tables

### Database Schema Requirements

The implementation requires the following database tables with proper relationships:

- `sentiment_analyses` - Main sentiment analysis data
- `supermarket_customer_members` - Customer demographic and purchase data
- `supermarket_branches` - Supermarket financial and operational data
- `products` - Product information

### Key Features

1. **Error Handling**: Displays appropriate error messages when insufficient data is available
2. **Loading States**: Smooth loading animations while data is being fetched
3. **Responsive Design**: Charts adapt to different screen sizes
4. **Interactive Tooltips**: Detailed information on hover
5. **Comprehensive Reviews**: Each chart includes detailed analysis text
6. **Mock Data**: Fallback to realistic mock data for demonstration

## Setup Instructions

### 1. Database Setup

Ensure your database has the required tables and relationships as defined in the migration files.

### 2. Environment Variables

Make sure you have the following environment variables set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Populate Sample Data

Run the sample data population script:
```bash
node scripts/populate-sample-data.js
```

**Note**: Update the `testUserId` in the script with a real user ID from your system.

### 4. Start the Application

```bash
npm run dev
```

Navigate to `/dashboard/history` to view the comprehensive dashboard.

## Data Sources

The charts use data from multiple sources:

1. **Sentiment Analysis Data**: From the `sentiment_analyses` table
2. **Customer Data**: From the `supermarket_customer_members` table
3. **Supermarket Data**: From the `supermarket_branches` table
4. **Product Data**: From the `products` table

## Error Handling

The implementation includes comprehensive error handling:

- **No Data Available**: Shows appropriate message with call-to-action
- **Loading States**: Displays skeleton loaders while fetching data
- **API Errors**: Graceful error messages for failed requests
- **Insufficient Data**: Fallback to mock data with appropriate warnings

## Customization

### Adding New Charts

To add new charts:

1. Add the chart data processing logic in `processDataForCharts()`
2. Add the chart component in the JSX
3. Include appropriate error handling and loading states
4. Add chart review text

### Modifying Chart Types

The implementation uses Recharts library. You can easily modify chart types by changing the chart components:

- `LineChart` for line charts
- `BarChart` for bar charts
- `PieChart` for pie charts
- `ScatterChart` for scatter plots
- `AreaChart` for area charts

### Styling

Charts use Tailwind CSS for styling. Colors are defined in the `COLORS` object and can be customized as needed.

## Performance Considerations

1. **Data Pagination**: Large datasets are paginated to prevent performance issues
2. **Lazy Loading**: Charts are loaded only when needed
3. **Caching**: API responses are cached where appropriate
4. **Optimized Queries**: Database queries are optimized with proper joins and indexes

## Future Enhancements

Potential improvements for the dashboard:

1. **Real-time Updates**: WebSocket integration for live data updates
2. **Export Functionality**: PDF/Excel export of charts and data
3. **Advanced Filtering**: Date range, category, and custom filters
4. **Drill-down Capabilities**: Click to explore detailed data
5. **Custom Dashboards**: User-configurable chart layouts
6. **Predictive Analytics**: Trend forecasting and anomaly detection

## Troubleshooting

### Common Issues

1. **Charts Not Loading**: Check API endpoint and database connectivity
2. **Empty Charts**: Ensure sample data is populated
3. **Authentication Errors**: Verify user authentication and permissions
4. **Performance Issues**: Check database indexes and query optimization

### Debug Mode

Enable debug logging by setting:
```env
NEXT_PUBLIC_DEBUG=true
```

This will provide detailed console logs for troubleshooting.

## Support

For issues or questions regarding the dashboard implementation:

1. Check the console for error messages
2. Verify database schema and relationships
3. Ensure all environment variables are set correctly
4. Review the API endpoint responses

The implementation is designed to be robust and user-friendly, providing comprehensive analytics while handling edge cases gracefully. 
# Key Metrics Chart - Positive Sentiment Analysis

## Overview

The Key Metrics Chart is a new visualization component added to the dashboard/history page that focuses exclusively on positive customer sentiment data. This chart provides valuable insights for supermarket chains by correlating customer satisfaction with purchasing behavior.

## Features

### Chart Specifications
- **X-axis**: Sentiment date (from `public.sentiment_analyses` table)
- **Y-axis (Left)**: Average order value (calculated from `average_order_value` column in `public.supermarket_customer_members` table)
- **Y-axis (Right)**: Average sentiment score (calculated from `sentiment_score` column in `public.sentiment_analyses` table, multiplied by 100 for visualization only)

### Data Filtering
- Only displays positive sentiment analyses with confidence > 0.5
- Groups data by date for trend analysis
- Calculates daily averages for both metrics

### Visual Elements
- **Dual Y-axes**: Separate scales for order value ($) and sentiment score
- **Line Chart**: Two lines showing correlation between metrics
- **Interactive Tooltips**: Detailed information on hover
- **Summary Statistics**: Key metrics displayed above the chart
- **Analyst Review**: Professional insights and recommendations

## Component Structure

### File Location
```
src/components/key-metrics-chart.tsx
```

### Integration
The chart is integrated into the history page at:
```
src/app/dashboard/history/page.tsx
```

### Props Interface
```typescript
interface KeyMetricsChartProps {
  analyses: Analysis[];
  loading: boolean;
}
```

## Data Processing

### Sentiment Score Calculation
```typescript
// Raw sentiment score (0-1 range)
const sentimentScore = analysis.sentiment_result.confidence;

// For chart visualization only (multiply by 100)
const chartSentimentScore = sentimentScore * 100;
```

### Order Value Generation
```typescript
// In real implementation, this would come from supermarket_customer_members table
// For now, creating realistic mock data that correlates with sentiment
const baseOrderValue = 75;
const sentimentMultiplier = sentimentScore; // sentimentScore is already 0-1
const orderValueVariation = Math.random() * 100;
const mockOrderValue = Math.round(baseOrderValue + (sentimentMultiplier * 150) + orderValueVariation);
```

## Analyst Review Content

The chart includes a comprehensive analyst review that provides:

1. **Positive Sentiment Trends**: Analysis of customer satisfaction patterns
2. **Order Value Correlation**: Insights into spending behavior
3. **Operational Optimization Opportunities**: 
   - Peak satisfaction period identification
   - Staffing and inventory optimization
   - Targeted strategy development
   - Promotional activity optimization
4. **Recommendations**: Actionable insights for business improvement

## Usage

### For Supermarket Chains
1. Navigate to Dashboard → History
2. View the "Key Metrics - Positive Sentiment Analysis" chart
3. Analyze the correlation between sentiment scores and order values
4. Review the analyst insights for actionable recommendations

### For Data Analysts
1. Monitor positive sentiment trends over time
2. Identify periods of high customer satisfaction
3. Correlate satisfaction with purchasing behavior
4. Use insights for strategic planning

## Technical Implementation

### Dependencies
- React 18+
- Recharts library
- Tailwind CSS
- Lucide React icons

### Styling
- Responsive design
- Professional color scheme (green for order value, blue for sentiment)
- Clean, modern UI with proper spacing and typography

### Performance
- Efficient data processing with useMemo optimization
- Responsive chart rendering
- Loading states and error handling

## Future Enhancements

### Potential Improvements
1. **Real Data Integration**: Connect to actual supermarket customer database
2. **Advanced Filtering**: Date range, store location, product category filters
3. **Export Functionality**: PDF/PNG chart export
4. **Real-time Updates**: Live data streaming
5. **Comparative Analysis**: Multiple store/location comparison

### Database Schema Requirements
To implement with real data, the following tables would be needed:

```sql
-- Sentiment analyses table (existing)
CREATE TABLE public.sentiment_analyses (
  id UUID PRIMARY KEY,
  sentiment_date DATE,
  sentiment_score DECIMAL(3,2),
  -- ... other fields
);

-- Supermarket customer members table (to be created)
CREATE TABLE public.supermarket_customer_members (
  id UUID PRIMARY KEY,
  customer_id UUID,
  average_order_value DECIMAL(10,2),
  sentiment_date DATE,
  -- ... other customer metrics
);
```

## Support

For questions or issues related to the Key Metrics Chart:
1. Check the component documentation
2. Verify data format and structure
3. Ensure proper authentication and permissions
4. Review console logs for any errors

## Contributing

When contributing to this feature:
1. Follow the existing code style and patterns
2. Add proper TypeScript types
3. Include comprehensive error handling
4. Test with various data scenarios
5. Update documentation as needed 
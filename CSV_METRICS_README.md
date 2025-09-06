# CSV Metrics Support for Sentiment Analysis

This document describes the enhanced CSV import functionality that supports additional metric data fields for comprehensive sentiment analysis.

## Overview

The system now supports importing CSV files with additional metadata fields beyond just the text content. This allows for more detailed analysis and better data organization.

## Supported Metric Fields

The following metric fields are automatically detected and stored:

| Field | Description | Example Values |
|-------|-------------|----------------|
| `review_id` | Unique identifier for the review | REV001, REV002 |
| `customer_id` | Unique identifier for the customer | CUST001, CUST002 |
| `product_id` | Unique identifier for the product | PROD001, PROD002 |
| `review_date` | Date when the review was written | 2024-01-15, 2024/01/15 |
| `gender` | Customer gender information | Male, Female, Other |
| `age` | Customer age (numeric) | 28, 35, 42 |
| `country` | Customer country | United States, Canada, Germany |
| `language` | Language of the review | English, German, French |
| `category_of_product` | Product category | Electronics, Clothing, Home & Garden |
| `input_text` | **Required** - The review text to analyze | "I love this product!" |

## CSV Format Requirements

### Required Fields
- **At least one column must contain the text to analyze**
- The system automatically detects text columns using common header names

### Header Detection
The system automatically maps columns based on header names. It recognizes various formats:

- `review_id`, `reviewid`, `reviewid`
- `customer_id`, `customerid`, `userid`, `user_id`
- `product_id`, `productid`, `itemid`, `item_id`
- `review_date`, `reviewdate`, `date`, `createddate`
- `gender`, `sex`
- `age`, `customerage`, `customer_age`
- `country`, `nation`, `location`
- `language`, `lang`, `reviewlanguage`
- `category_of_product`, `category`, `productcategory`, `type`
- `input_text`, `text`, `review`, `comment`, `feedback`, `description`, `content`

### Column Order Flexibility
**The system automatically adapts to different column orders.** You can arrange your columns in any sequence - the system will detect and map them correctly based on header names.

## Example CSV Files

### Basic Format (Text Only)
```csv
input_text
"I love this product!"
"This is terrible quality."
"Good value for money."
```

### Full Metrics Format
```csv
review_id,customer_id,product_id,review_date,gender,age,country,language,category_of_product,input_text
REV001,CUST001,PROD001,2024-01-15,Male,28,United States,English,Electronics,"I love this product!"
REV002,CUST002,PROD001,2024-01-16,Female,35,Canada,English,Electronics,"This is terrible quality."
```

### Mixed Column Order (Automatically Detected)
```csv
input_text,age,gender,country,review_id
"I love this product!",28,Male,United States,REV001
"This is terrible quality.",35,Female,Canada,REV002
```

## Features

### Automatic Column Detection
- **Smart Header Recognition**: Automatically identifies columns regardless of order
- **Flexible Naming**: Supports various header naming conventions
- **Fallback Handling**: If text column isn't found, assumes last column contains text

### Data Validation
- **Structure Validation**: Checks CSV format and required fields
- **Data Type Validation**: Validates age as numeric, dates as valid dates
- **Warning System**: Provides warnings for potential issues

### Enhanced Storage
- **Metric Persistence**: All metric data is stored in the database
- **Query Support**: Enables filtering and analysis by metrics
- **Performance Indexes**: Database indexes for efficient metric-based queries

## Usage

### 1. Prepare Your CSV File
- Include headers for each column
- Ensure at least one column contains the text to analyze
- Add any additional metric columns as needed

### 2. Upload and Process
- Upload your CSV file through the batch analysis interface
- The system automatically detects and maps columns
- Review the detected column mapping
- Process your analysis

### 3. View Results
- All metric data is preserved in the analysis results
- Results can be filtered and analyzed by metrics
- Data is stored for future reference and analysis

## Database Schema

The `sentiment_analyses` table now includes these additional fields:

```sql
ALTER TABLE public.sentiment_analyses 
ADD COLUMN review_id TEXT,
ADD COLUMN customer_id TEXT,
ADD COLUMN product_id TEXT,
ADD COLUMN review_date DATE,
ADD COLUMN gender TEXT,
ADD COLUMN age INTEGER,
ADD COLUMN country TEXT,
ADD COLUMN language TEXT,
ADD COLUMN category_of_product TEXT;
```

## Best Practices

### CSV Preparation
1. **Use Clear Headers**: Use descriptive, consistent header names
2. **Data Consistency**: Ensure consistent data formats (e.g., date format)
3. **Text Quality**: Ensure text columns contain meaningful content
4. **File Size**: Keep files under 5MB and 100 rows for optimal performance

### Column Naming
- Use underscores or camelCase for multi-word headers
- Be consistent with naming conventions
- Avoid special characters in headers

### Data Quality
- Validate dates are in YYYY-MM-DD format
- Ensure ages are reasonable numeric values
- Use consistent country and language names

## Error Handling

The system provides clear error messages for:
- **Missing Text Column**: When no text column can be identified
- **Invalid Data**: When data doesn't match expected formats
- **File Size Limits**: When files exceed size or row limits
- **Format Issues**: When CSV structure is invalid

## Support

For issues or questions about CSV import functionality:
1. Check the validation messages in the upload interface
2. Review the column mapping display
3. Ensure your CSV follows the format requirements
4. Check that headers are properly formatted

## Migration Notes

If you have existing CSV files:
- They will continue to work as before
- The system automatically detects text-only formats
- No changes are required to existing workflows
- New metric fields are optional and backward-compatible 
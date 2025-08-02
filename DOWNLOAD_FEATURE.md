# CSV Download Feature for Sentiment Analysis History

## Overview

This feature allows users to download their sentiment analysis history as a CSV file from the Analyze History page (`/dashboard/history`).

## Features

### 1. Download Button
- Located in the top-right corner of the history page
- Downloads all sentiment analyses or filtered results
- Shows loading state during download
- Provides success/error feedback via toast notifications

### 2. Filtering Support
- **Sentiment Filter**: Download only positive, negative, or neutral analyses
- **Date Range Filter**: Download analyses within a specific date range
- **Combined Filters**: Apply both sentiment and date filters simultaneously

### 3. Smart Filename Generation
The downloaded file is automatically named with:
- Current date: `sentiment-analysis-history-YYYY-MM-DD.csv`
- Sentiment filter: `sentiment-analysis-history-YYYY-MM-DD-positive.csv`
- Date filter: `sentiment-analysis-history-YYYY-MM-DD-filtered.csv`
- Combined filters: `sentiment-analysis-history-YYYY-MM-DD-positive-filtered.csv`

## API Endpoint

### GET `/api/sentiment/history/download`

**Query Parameters:**
- `sentiment` (optional): Filter by sentiment ("positive", "negative", "neutral")
- `date_from` (optional): Start date (YYYY-MM-DD format)
- `date_to` (optional): End date (YYYY-MM-DD format)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="sentiment-analysis-history-YYYY-MM-DD.csv"`

**CSV Columns:**
1. ID - Unique analysis identifier
2. Input Text - The analyzed text (quoted to handle commas)
3. Sentiment - positive/negative/neutral
4. Confidence (%) - Confidence score as percentage
5. Key Phrases - Comma-separated list of key phrases
6. Analysis Type - single_text/batch_file/batch_analysis
7. Tokens Used - Number of tokens consumed
8. Processing Time (ms) - Processing time in milliseconds
9. Created At - ISO timestamp

## Usage

### Basic Download
1. Navigate to `/dashboard/history`
2. Click the "Download CSV" button
3. File will be downloaded automatically

### Filtered Download
1. Use the sentiment filter dropdown to select specific sentiments
2. Click "Date Filter" to show date range inputs
3. Set from/to dates as needed
4. Click "Download CSV" to get filtered results

### Example CSV Output
```csv
ID,Input Text,Sentiment,Confidence (%),Key Phrases,Analysis Type,Tokens Used,Processing Time (ms),Created At
uuid-1,"This product is amazing!",positive,85,"amazing, product",single_text,150,1200,2024-01-15T10:30:00Z
uuid-2,"I hate this service",negative,92,"hate, service",batch_file,180,1500,2024-01-15T09:15:00Z
```

## Error Handling

- **Authentication**: Returns 401 if user is not authenticated
- **Subscription**: Returns 403 if user doesn't have active subscription
- **Database Errors**: Returns 500 with error message
- **Frontend**: Shows toast notifications for success/failure

## Security

- Row Level Security (RLS) ensures users can only download their own data
- Authentication required for all download requests
- Subscription status validation prevents unauthorized access

## Testing

Run the test script to verify functionality:
```bash
node test-download.js
```

## Implementation Details

### Files Modified
1. `src/app/api/sentiment/history/download/route.ts` - New API endpoint
2. `src/app/dashboard/history/page.tsx` - Updated UI with download button and filters

### Key Features
- Proper CSV escaping for text fields
- Automatic filename generation with filters
- Toast notifications for user feedback
- Date range filtering UI
- Responsive design for mobile/desktop
- Loading states and error handling 
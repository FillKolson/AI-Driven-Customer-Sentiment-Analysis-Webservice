# Batch Sentiment Analysis Feature

## Overview

The Dashboard now includes a powerful batch analysis feature that allows users to upload CSV or TXT files containing multiple texts for sentiment analysis. This feature is designed to handle large volumes of customer feedback efficiently.

## Features

### File Upload Support
- **CSV Files**: Upload CSV files with one text per line
- **TXT Files**: Upload plain text files with one text per line
- **File Size Limit**: Maximum 5MB per file
- **Line Limit**: Maximum 100 texts per file
- **Text Length**: Each text can be up to 10,000 characters

### Batch Processing
- **Concurrent Analysis**: Processes multiple texts efficiently
- **Progress Tracking**: Real-time progress indicators
- **Error Handling**: Graceful handling of failed analyses
- **Usage Tracking**: Monitors API usage and limits

### Results Display
- **Summary Statistics**: Overview of analysis results
- **Sentiment Distribution**: Breakdown by positive/negative/neutral
- **Success Rate**: Percentage of successful analyses
- **Detailed Results**: Individual text analysis with filtering
- **Export Functionality**: Download results as CSV

## Usage

### 1. Access Batch Analysis
- Navigate to the Dashboard
- Click on the "Batch Analysis" tab
- The interface will show the file upload area

### 2. Upload File
- Click "Choose File" or drag and drop
- Select a CSV or TXT file
- The system will validate the file and show preview
- Review the file information and estimated API usage

### 3. Analyze Texts
- Click "Analyze All Texts" to start processing
- Monitor progress with the progress bar
- Wait for completion notification

### 4. Review Results
- View summary statistics and sentiment distribution
- Filter results by sentiment type
- Toggle detailed view to see individual analyses
- Export results as CSV file

## File Format Requirements

### CSV Format
```csv
"I love this product! It's exactly what I was looking for."
"This is the worst purchase I've ever made."
"The product works fine, nothing special but gets the job done."
```

### TXT Format
```
I love this product! It's exactly what I was looking for.
This is the worst purchase I've ever made.
The product works fine, nothing special but gets the job done.
```

## API Endpoints

### Batch Analysis API
- **Endpoint**: `/api/sentiment/batch-analyze`
- **Method**: POST
- **Body**: `{ texts: string[], fileType?: string }`
- **Response**: Batch analysis results with summary

## Components

### FileUpload Component
- Handles file selection and validation
- Parses CSV/TXT files
- Manages upload progress
- Integrates with batch analysis API

### BatchAnalysisResults Component
- Displays analysis results
- Provides filtering and export functionality
- Shows detailed statistics
- Handles error reporting

## Error Handling

### Common Issues
1. **File Too Large**: Files over 5MB are rejected
2. **Too Many Lines**: Files with more than 100 lines are rejected
3. **Invalid Format**: Non-CSV/TXT files are rejected
4. **Usage Limits**: Exceeds monthly API limits
5. **Empty File**: Files with no valid content

### Error Recovery
- Failed analyses are reported individually
- Success rate is calculated and displayed
- Users can retry with smaller files
- Detailed error messages guide troubleshooting

## Performance Considerations

### Rate Limiting
- Respects API rate limits
- Processes texts sequentially to avoid overwhelming the API
- Provides progress feedback during long operations

### Memory Management
- Streams file content to avoid memory issues
- Limits file size and line count
- Efficient text processing

## Security

### File Validation
- Validates file types and extensions
- Checks file size limits
- Sanitizes text content
- Prevents malicious file uploads

### Usage Tracking
- Monitors API usage per user
- Enforces subscription limits
- Prevents abuse through rate limiting

## Testing

### Sample Files
- `sample-data.csv`: Sample CSV file with 20 customer feedback texts
- `sample-data.txt`: Sample TXT file with 20 customer feedback texts

### Test Scenarios
1. Upload valid CSV file
2. Upload valid TXT file
3. Test with empty file
4. Test with oversized file
5. Test with too many lines
6. Test with invalid file type
7. Test usage limit scenarios

## Future Enhancements

### Planned Features
- **Excel Support**: Upload Excel files (.xlsx, .xls)
- **JSON Support**: Upload JSON files with structured data
- **Bulk Export**: Export results in multiple formats
- **Scheduled Analysis**: Schedule batch analyses
- **Advanced Filtering**: More sophisticated result filtering
- **Analytics Dashboard**: Enhanced batch analysis analytics

### Performance Improvements
- **Parallel Processing**: Process multiple texts concurrently
- **Caching**: Cache analysis results
- **Background Processing**: Handle large files in background
- **Streaming**: Stream results as they complete

## Troubleshooting

### Common Problems

**File won't upload**
- Check file size (max 5MB)
- Verify file format (CSV or TXT)
- Ensure file has valid content

**Analysis fails**
- Check API usage limits
- Verify subscription status
- Try with smaller file

**Results incomplete**
- Check for empty lines in file
- Verify text length limits
- Review error messages in detailed view

### Support
For issues with batch analysis, check:
1. File format and size
2. API usage limits
3. Subscription status
4. Network connectivity
5. Browser console for errors 
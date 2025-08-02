// Test script for CSV download functionality
// Run this with: node test-download.js

const fetch = require('node-fetch');

async function testDownloadAPI() {
  console.log('Testing CSV download API...');
  
  try {
    // Test the download endpoint
    const response = await fetch('http://localhost:3000/api/sentiment/history/download', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const csvContent = await response.text();
      console.log('CSV content preview (first 500 chars):');
      console.log(csvContent.substring(0, 500));
      console.log('\nCSV download test PASSED');
    } else {
      const error = await response.text();
      console.log('Error response:', error);
      console.log('\nCSV download test FAILED');
    }
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

// Test with filters
async function testDownloadWithFilters() {
  console.log('\nTesting CSV download with filters...');
  
  try {
    const params = new URLSearchParams({
      sentiment: 'positive',
      date_from: '2024-01-01',
      date_to: '2024-12-31'
    });

    const response = await fetch(`http://localhost:3000/api/sentiment/history/download?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Filtered response status:', response.status);
    
    if (response.ok) {
      console.log('Filtered CSV download test PASSED');
    } else {
      console.log('Filtered CSV download test FAILED');
    }
  } catch (error) {
    console.error('Filtered test failed with error:', error.message);
  }
}

// Run tests
async function runTests() {
  await testDownloadAPI();
  await testDownloadWithFilters();
  console.log('\nAll tests completed!');
}

runTests(); 
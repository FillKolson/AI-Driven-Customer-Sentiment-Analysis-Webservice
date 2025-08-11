export interface MetricData {
  review_id?: string;
  customer_id?: string;
  product_id?: string;
  review_date?: string;
  gender?: string;
  age?: number;
  country?: string;
  language?: string;
  category_of_product?: string;
  input_text: string;
}

export interface ParsedCSVRow {
  id: string;
  text: string;
  lineNumber: number;
  metrics: MetricData;
}

export interface CSVColumnMapping {
  review_id?: number;
  customer_id?: number;
  product_id?: number;
  review_date?: number;
  gender?: number;
  age?: number;
  country?: number;
  language?: number;
  category_of_product?: number;
  input_text: number;
}

/**
 * Parse CSV content and automatically detect column mapping
 * @param csvContent - Raw CSV content as string
 * @returns Array of parsed rows with metrics and detected column mapping
 */
export function parseCSVWithMetrics(csvContent: string): {
  rows: ParsedCSVRow[];
  columnMapping: CSVColumnMapping;
  totalColumns: number;
} {
  const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Parse header row to detect column mapping
  const headerRow = lines[0];
  const headers = parseCSVRow(headerRow);
  const columnMapping = detectColumnMapping(headers);
  
  // Parse data rows
  const rows: ParsedCSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().length === 0) continue;
    
    const values = parseCSVRow(line);
    const metrics = extractMetrics(values, columnMapping);
    
    // Ensure we have text content
    if (!metrics.input_text || metrics.input_text.trim().length === 0) {
      continue; // Skip rows without text content
    }
    
    rows.push({
      id: `row_${i}`,
      text: metrics.input_text,
      lineNumber: i + 1,
      metrics
    });
  }
  
  return {
    rows,
    columnMapping,
    totalColumns: headers.length
  };
}

/**
 * Detect which columns contain which metric data based on header names
 * @param headers - Array of header strings
 * @returns Object mapping metric fields to column indices
 */
function detectColumnMapping(headers: string[]): CSVColumnMapping {
  const mapping: CSVColumnMapping = {} as CSVColumnMapping;
  
  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    
    // Map common variations of header names
    switch (normalizedHeader) {
      case 'reviewid':
      case 'review_id':
      case 'reviewid':
        mapping.review_id = index;
        break;
      case 'customerid':
      case 'customer_id':
      case 'customerid':
      case 'userid':
      case 'user_id':
        mapping.customer_id = index;
        break;
      case 'productid':
      case 'product_id':
      case 'productid':
      case 'itemid':
      case 'item_id':
        mapping.product_id = index;
        break;
      case 'reviewdate':
      case 'review_date':
      case 'reviewdate':
      case 'date':
      case 'createddate':
      case 'created_date':
        mapping.review_date = index;
        break;
      case 'gender':
      case 'sex':
        mapping.gender = index;
        break;
      case 'age':
      case 'customerage':
      case 'customer_age':
        mapping.age = index;
        break;
      case 'country':
      case 'nation':
      case 'location':
        mapping.country = index;
        break;
      case 'language':
      case 'lang':
      case 'reviewlanguage':
      case 'review_language':
        mapping.language = index;
        break;
      case 'categoryofproduct':
      case 'category_of_product':
      case 'category':
      case 'productcategory':
      case 'product_category':
      case 'type':
        mapping.category_of_product = index;
        break;
      case 'inputtext':
      case 'input_text':
      case 'text':
      case 'review':
      case 'comment':
      case 'feedback':
      case 'description':
      case 'content':
        mapping.input_text = index;
        break;
    }
  });
  
  // Ensure input_text is always mapped (required field)
  if (mapping.input_text === undefined) {
    // If no text column found, assume the last column contains text
    mapping.input_text = headers.length - 1;
  }
  
  return mapping;
}

/**
 * Extract metric data from CSV row values using column mapping
 * @param values - Array of values from CSV row
 * @param mapping - Column mapping object
 * @returns MetricData object
 */
function extractMetrics(values: string[], mapping: CSVColumnMapping): MetricData {
  const metrics: MetricData = {
    input_text: values[mapping.input_text] || ''
  };
  
  // Extract optional metric fields
  if (mapping.review_id !== undefined && values[mapping.review_id]) {
    metrics.review_id = values[mapping.review_id].trim();
  }
  
  if (mapping.customer_id !== undefined && values[mapping.customer_id]) {
    metrics.customer_id = values[mapping.customer_id].trim();
  }
  
  if (mapping.product_id !== undefined && values[mapping.product_id]) {
    metrics.product_id = values[mapping.product_id].trim();
  }
  
  if (mapping.review_date !== undefined && values[mapping.review_date]) {
    metrics.review_date = values[mapping.review_date].trim();
  }
  
  if (mapping.gender !== undefined && values[mapping.gender]) {
    metrics.gender = values[mapping.gender].trim();
  }
  
  if (mapping.age !== undefined && values[mapping.age]) {
    const ageValue = parseInt(values[mapping.age]);
    if (!isNaN(ageValue) && ageValue > 0 && ageValue < 150) {
      metrics.age = ageValue;
    }
  }
  
  if (mapping.country !== undefined && values[mapping.country]) {
    metrics.country = values[mapping.country].trim();
  }
  
  if (mapping.language !== undefined && values[mapping.language]) {
    metrics.language = values[mapping.language].trim();
  }
  
  if (mapping.category_of_product !== undefined && values[mapping.category_of_product]) {
    metrics.category_of_product = values[mapping.category_of_product].trim();
  }
  
  return metrics;
}

/**
 * Parse a single CSV row, handling quoted fields and commas
 * @param row - Single CSV row as string
 * @returns Array of field values
 */
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < row.length) {
    const char = row[i];
    
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Validate that the CSV has the minimum required structure
 * @param csvContent - Raw CSV content
 * @returns Validation result with any errors
 */
export function validateCSVStructure(csvContent: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    const { rows, columnMapping, totalColumns } = parseCSVWithMetrics(csvContent);
    
    if (rows.length === 0) {
      errors.push('No valid data rows found in CSV');
    }
    
    if (totalColumns < 1) {
      errors.push('CSV must have at least one column');
    }
    
    if (columnMapping.input_text === undefined) {
      errors.push('Could not identify text column in CSV headers');
    }
    
    // Check for potential issues
    if (totalColumns > 20) {
      warnings.push('CSV has many columns - some may not be recognized');
    }
    
    if (rows.length > 100) {
      warnings.push('CSV has more than 100 rows - only first 100 will be processed');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [error instanceof Error ? error.message : 'Unknown error parsing CSV'],
      warnings: []
    };
  }
} 
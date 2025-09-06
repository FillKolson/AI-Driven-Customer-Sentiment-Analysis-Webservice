import { parseCSVWithMetrics, validateCSVStructure } from '../lib/csvParser';

describe('CSV Parser', () => {
  describe('parseCSVWithMetrics', () => {
    it('should parse CSV with standard headers', () => {
      const csvContent = `review_id,customer_id,input_text
REV001,CUST001,"Great product!"
REV002,CUST002,"Terrible quality"`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(2);
      expect(result.columnMapping.review_id).toBe(0);
      expect(result.columnMapping.customer_id).toBe(1);
      expect(result.columnMapping.input_text).toBe(2);
      expect(result.rows[0].metrics.review_id).toBe('REV001');
      expect(result.rows[0].metrics.customer_id).toBe('CUST001');
      expect(result.rows[0].text).toBe('Great product!');
    });

    it('should handle different column orders', () => {
      const csvContent = `input_text,age,gender,review_id
"Great product!",28,Male,REV001
"Terrible quality",35,Female,REV002`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.columnMapping.input_text).toBe(0);
      expect(result.columnMapping.age).toBe(1);
      expect(result.columnMapping.gender).toBe(2);
      expect(result.columnMapping.review_id).toBe(3);
      expect(result.rows[0].metrics.age).toBe(28);
      expect(result.rows[0].metrics.gender).toBe('Male');
    });

    it('should handle various header naming conventions', () => {
      const csvContent = `reviewid,userid,productid,date,sex,customerage,nation,lang,category,text
REV001,USER001,PROD001,2024-01-15,M,28,USA,EN,Electronics,"Great product!"`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.columnMapping.review_id).toBe(0);
      expect(result.columnMapping.customer_id).toBe(1);
      expect(result.columnMapping.product_id).toBe(2);
      expect(result.columnMapping.review_date).toBe(3);
      expect(result.columnMapping.gender).toBe(4);
      expect(result.columnMapping.age).toBe(5);
      expect(result.columnMapping.country).toBe(6);
      expect(result.columnMapping.language).toBe(7);
      expect(result.columnMapping.category_of_product).toBe(8);
      expect(result.columnMapping.input_text).toBe(9);
    });

    it('should handle quoted fields with commas', () => {
      const csvContent = `review_id,input_text
REV001,"This product is great, but expensive"
REV002,"Terrible quality, don't buy"`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].text).toBe('This product is great, but expensive');
      expect(result.rows[1].text).toBe("Terrible quality, don't buy");
    });

    it('should skip empty rows', () => {
      const csvContent = `review_id,input_text
REV001,"Great product!"

REV002,"Terrible quality"`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].text).toBe('Great product!');
      expect(result.rows[1].text).toBe('Terrible quality');
    });

    it('should handle missing optional fields', () => {
      const csvContent = `input_text,review_id
"Great product!",REV001
"Terrible quality",`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].metrics.review_id).toBe('REV001');
      expect(result.rows[1].metrics.review_id).toBeUndefined();
    });

    it('should validate age as numeric', () => {
      const csvContent = `input_text,age
"Great product!",28
"Terrible quality",invalid
"Good product",35`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(3);
      expect(result.rows[0].metrics.age).toBe(28);
      expect(result.rows[1].metrics.age).toBeUndefined(); // Invalid age
      expect(result.rows[2].metrics.age).toBe(35);
    });
  });

  describe('validateCSVStructure', () => {
    it('should validate valid CSV structure', () => {
      const csvContent = `review_id,input_text
REV001,"Great product!"
REV002,"Terrible quality"`;

      const result = validateCSVStructure(csvContent);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing text column', () => {
      const csvContent = `review_id,customer_id
REV001,CUST001
REV002,CUST002`;

      const result = validateCSVStructure(csvContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Could not identify text column in CSV headers');
    });

    it('should detect empty CSV', () => {
      const csvContent = '';

      const result = validateCSVStructure(csvContent);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('CSV file is empty');
    });

    it('should provide warnings for large files', () => {
      const csvContent = `review_id,input_text\n${Array(101).fill('REV001,"Test"').join('\n')}`;

      const result = validateCSVStructure(csvContent);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('CSV has more than 10000 rows - only first 10000 will be processed');
    });

    it('should provide warnings for many columns', () => {
      const csvContent = `col1,col2,col3,col4,col5,col6,col7,col8,col9,col10,col11,col12,col13,col14,col15,col16,col17,col18,col19,col20,col21,input_text
REV001,"Test"`;

      const result = validateCSVStructure(csvContent);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('CSV has many columns - some may not be recognized');
    });
  });

  describe('edge cases', () => {
    it('should handle single column CSV', () => {
      const csvContent = `input_text
"Great product!"
"Terrible quality"`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(2);
      expect(result.columnMapping.input_text).toBe(0);
      expect(result.totalColumns).toBe(1);
    });

    it('should handle CSV with only headers', () => {
      const csvContent = `review_id,input_text`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(0);
      expect(result.totalColumns).toBe(2);
    });

    it('should handle escaped quotes', () => {
      const csvContent = `review_id,input_text
REV001,"This product is ""amazing""!"
REV002,"Don't buy this ""terrible"" product"`;

      const result = parseCSVWithMetrics(csvContent);
      
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].text).toBe('This product is "amazing"!');
      expect(result.rows[1].text).toBe("Don't buy this \"terrible\" product");
    });
  });
}); 
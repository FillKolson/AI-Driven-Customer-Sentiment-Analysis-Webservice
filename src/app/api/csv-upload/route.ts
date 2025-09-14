import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../supabase/server';
import Papa, { ParseResult, ParseError } from 'papaparse';

interface CsvRow {
  [key: string]: string | number | null;
}

// Table configurations with column mappings
const tableConfigs = {
  sentiment_analyses: {
    tableName: 'sentiment_analyses',
    columns: [
      'sentiment_id', 'customer_id', 'supermarket_id', 'basket_id', 
      'sentiment_date', 'sentiment_score', 'confidence_level', 'sentiment_category'
    ],
    // Allow category to be computed from score if missing/invalid
    requiredColumns: ['customer_id', 'supermarket_id', 'sentiment_score'],
    transformRow: (row: any) => {
      const parseNum = (v: any) => {
        if (v === null || v === undefined) return null;
        const s = String(v).replace(/[^0-9.+-eE]/g, '').trim();
        const n = parseFloat(s);
        return isNaN(n) ? null : n;
      };

      const score = parseNum(row.sentiment_score);
      const conf = row.confidence_level !== undefined ? parseInt(String(row.confidence_level).replace(/[^0-9-]/g,'')) : null;

      const rawCat = (row.sentiment_category ?? '').toString().trim().toLowerCase();
      const cleanedCat = rawCat.replace(/[^a-z]/g, '');
      const map: Record<string, 'positive'|'negative'|'neutral'> = {
        positive: 'positive', pos: 'positive', plus: 'positive',
        negative: 'negative', neg: 'negative', minus: 'negative',
        neutral: 'neutral', neu: 'neutral'
      };
      let category: 'positive'|'negative'|'neutral' | null = map[cleanedCat] ?? null;

      if (!category) {
        // Infer from score if available
        if (typeof score === 'number') {
          if (score >= 0.6) category = 'positive';
          else if (score <= 0.4) category = 'negative';
          else category = 'neutral';
        }
      }

      return {
        sentiment_id: row.sentiment_id ? parseInt(String(row.sentiment_id).replace(/[^0-9-]/g,'')) : null,
        customer_id: parseInt(String(row.customer_id).replace(/[^0-9-]/g,'')),
        supermarket_id: parseInt(String(row.supermarket_id).replace(/[^0-9-]/g,'')),
        basket_id: row.basket_id ? parseInt(String(row.basket_id).replace(/[^0-9-]/g,'')) : null,
        sentiment_date: row.sentiment_date || new Date().toISOString().split('T')[0],
        sentiment_score: score ?? 0,
        confidence_level: conf,
        sentiment_category: category ?? 'neutral',
      };
    }
  },
  supermarket_branches: {
    tableName: 'supermarket_branches',
    columns: [
      'supermarket_id', 'advertisement_spend', 'promotion_spend', 
      'administration_spend', 'state', 'profit'
    ],
    requiredColumns: ['supermarket_id', 'state'],
    transformRow: (row: any) => ({
      supermarket_id: parseInt(row.supermarket_id),
      advertisement_spend: row.advertisement_spend ? parseFloat(row.advertisement_spend) : 0,
      promotion_spend: row.promotion_spend ? parseFloat(row.promotion_spend) : 0,
      administration_spend: row.administration_spend ? parseFloat(row.administration_spend) : 0,
      state: row.state,
      profit: row.profit ? parseFloat(row.profit) : 0
    })
  },
  supermarket_customer_members: {
    tableName: 'supermarket_customer_members',
    columns: [
      'customer_id', 'gender', 'age', 'annual_income', 'spending_score',
      'total_purchases', 'average_order_value', 'purchase_frequency', 'last_purchase_date'
    ],
    requiredColumns: ['customer_id', 'gender', 'age'],
    transformRow: (row: any) => ({
      customer_id: parseInt(row.customer_id),
      gender: row.gender,
      age: parseInt(row.age),
      annual_income: row.annual_income ? parseInt(row.annual_income) : null,
      spending_score: row.spending_score ? parseInt(row.spending_score) : null,
      total_purchases: row.total_purchases ? parseInt(row.total_purchases) : 0,
      average_order_value: row.average_order_value ? parseFloat(row.average_order_value) : 0,
      purchase_frequency: row.purchase_frequency ? parseFloat(row.purchase_frequency) : 0,
      last_purchase_date: row.last_purchase_date || null
    })
  },
  market_basket_optimisation: {
    tableName: 'market_basket_optimisation',
    columns: [
      'basket_id', 'product1', 'product2', 'product3', 'product4', 'product5',
      'product6', 'product7', 'product8', 'product9'
    ],
    requiredColumns: ['basket_id'],
    transformRow: (row: any) => ({
      basket_id: parseInt(row.basket_id),
      product1: row.product1 || null,
      product2: row.product2 || null,
      product3: row.product3 || null,
      product4: row.product4 || null,
      product5: row.product5 || null,
      product6: row.product6 || null,
      product7: row.product7 || null,
      product8: row.product8 || null,
      product9: row.product9 || null
    })
  },
  ads_ctr_optimisation: {
    tableName: 'ads_ctr_optimisation',
    columns: [
      'supermarket_id', 'ad1', 'ad2', 'ad3', 'ad4', 'ad5',
      'ad6', 'ad7', 'ad8', 'ad9', 'ad10'
    ],
    requiredColumns: ['supermarket_id'],
    transformRow: (row: any) => ({
      supermarket_id: parseInt(row.supermarket_id),
      ad1: row.ad1 ? parseInt(row.ad1) : 0,
      ad2: row.ad2 ? parseInt(row.ad2) : 0,
      ad3: row.ad3 ? parseInt(row.ad3) : 0,
      ad4: row.ad4 ? parseInt(row.ad4) : 0,
      ad5: row.ad5 ? parseInt(row.ad5) : 0,
      ad6: row.ad6 ? parseInt(row.ad6) : 0,
      ad7: row.ad7 ? parseInt(row.ad7) : 0,
      ad8: row.ad8 ? parseInt(row.ad8) : 0,
      ad9: row.ad9 ? parseInt(row.ad9) : 0,
      ad10: row.ad10 ? parseInt(row.ad10) : 0
    })
  }
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tableType = formData.get('tableType') as string;
    const datasetName = (formData.get('datasetName') as string | null) || null;

    if (!file || !tableType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate table type
    const config = tableConfigs[tableType as keyof typeof tableConfigs];
    if (!config) {
      return NextResponse.json({ error: 'Invalid table type' }, { status: 400 });
    }

    // Read and parse CSV file
    const fileContent = await file.text();

    // Server-side usage limit enforcement for sentiment uploads
    if (tableType === 'sentiment_analyses') {
      // Fetch user's current usage and limit
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('api_usage_current_month, api_limit_per_month')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return NextResponse.json({ error: 'Failed to fetch user usage profile' }, { status: 500 });
      }

      const currentUsage = profile?.api_usage_current_month ?? 0;
      const usageLimit = profile?.api_limit_per_month ?? 100;
      const nonEmptyLines = fileContent.split('\n').filter(line => line.trim() !== '').length;
      const tokensToUse = Math.max(0, nonEmptyLines - 1); // exclude header

      if (currentUsage + tokensToUse > usageLimit) {
        const remaining = Math.max(0, usageLimit - currentUsage);
        return NextResponse.json({
          error: `Insufficient API balance. This upload would use ${tokensToUse} calls, but you only have ${remaining} remaining.`
        }, { status: 402 });
      }
    }

    return new Promise((resolve) => {
      Papa.parse<CsvRow>(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim().toLowerCase(),
        complete: async (results: ParseResult<CsvRow>) => {
          try {
            if (results.errors.length > 0) {
              resolve(NextResponse.json({ 
                error: 'CSV parsing error: ' + results.errors[0].message 
              }, { status: 400 }));
              return;
            }

            const rows = results.data as CsvRow[];
            if (rows.length === 0) {
              resolve(NextResponse.json({ error: 'No data found in CSV' }, { status: 400 }));
              return;
            }

            // Validate required columns
            const headers = Object.keys(rows[0]);
            const missingColumns = config.requiredColumns.filter(col => 
              !headers.some(header => header.includes(col.toLowerCase()))
            );

            if (missingColumns.length > 0) {
              resolve(NextResponse.json({ 
                error: `Missing required columns: ${missingColumns.join(', ')}` 
              }, { status: 400 }));
              return;
            }

            // Transform and validate data
            const transformedRows = [];
            const errors = [];

            for (let i = 0; i < rows.length; i++) {
              try {
                const transformedRow = config.transformRow(rows[i]);
                
                // Validate required fields are not null/undefined
                const hasRequiredData = config.requiredColumns.every(col => {
                  const value = transformedRow[col as keyof typeof transformedRow];
                  return value !== null && value !== undefined && value !== '';
                });

                if (hasRequiredData) {
                  transformedRows.push(transformedRow);
                } else {
                  errors.push(`Row ${i + 1}: Missing required data`);
                }
              } catch (error) {
                errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data format'}`);
              }
            }

            if (transformedRows.length === 0) {
              resolve(NextResponse.json({ 
                error: 'No valid rows found. Errors: ' + errors.slice(0, 5).join('; ') 
              }, { status: 400 }));
              return;
            }

            // If any row had validation errors, abort without inserting anything
            if (errors.length > 0) {
              resolve(NextResponse.json({
                error: 'Validation failed. No rows were inserted.',
                details: errors.slice(0, 20)
              }, { status: 400 }));
              return;
            }

            // Perform a single bulk insert to ensure atomicity per file
            const payloadWithMeta = transformedRows.map((r: any) => ({
              ...r,
              user_id: user.id,
              file_name: datasetName ?? file.name,
            }));

            let attempt = 0;
            let currentPayload: any[] = payloadWithMeta;
            let insertErrorMsg: string | null = null;

            while (attempt < 3) {
              const { error: insertError } = await supabase
                .from(config.tableName)
                .insert(currentPayload);

              if (!insertError) {
                break; // success
              }

              insertErrorMsg = insertError.message || String(insertError);

              // If table lacks user_id or file_name columns, strip and retry
              if (insertErrorMsg.includes('column "user_id" does not exist') && attempt === 0) {
                currentPayload = currentPayload.map((r) => {
                  const { user_id, ...rest } = r as any;
                  return rest;
                });
                attempt++;
                continue;
              }
              if (insertErrorMsg.includes('column "file_name" does not exist') && attempt <= 1) {
                currentPayload = currentPayload.map((r) => {
                  const { file_name, ...rest } = r as any;
                  return rest;
                });
                attempt++;
                continue;
              }

              console.error('Insert error:', insertErrorMsg);
              resolve(NextResponse.json({
                error: `Failed to insert data: ${insertErrorMsg}`
              }, { status: 500 }));
              return;
            }

            const totalInserted = transformedRows.length;

            // Calculate tokens based on data rows (excluding header) for sentiment_analyses table only
            let tokensUsed = 0;
            if (tableType === 'sentiment_analyses') {
              // Count non-empty lines and subtract 1 for the header
              const lineCount = fileContent.split('\n').filter(line => line.trim() !== '').length;
              tokensUsed = Math.max(0, lineCount - 1); // Exclude header
            }

            // Update user's monthly usage using named parameters
            const { error: usageError } = await supabase.rpc('increment_monthly_usage', {
              user_id_param: user.id,
              token_count: tokensUsed
            });

            if (usageError) {
              console.error('Error updating monthly usage:', usageError);
            }

            // Log the upload activity
            await supabase
              .from('csv_upload_logs')
              .insert({
                user_id: user.id, // authenticated user
                table_name: config.tableName,
                records_processed: totalInserted,
                upload_date: new Date().toISOString(),
                file_name: datasetName ?? file.name,
                tokens_used: tokensUsed
              });

            // Update usage tracking with tokens consumed
            await supabase.rpc('increment_usage', {
              user_id: user.id,
              tokens: tokensUsed
            });

            resolve(NextResponse.json({
              success: true,
              recordsProcessed: totalInserted,
              tableName: config.tableName,
              errors: errors.length > 0 ? errors.slice(0, 10) : undefined
            }));

          } catch (error) {
            console.error('Processing error:', error);
            resolve(NextResponse.json({ 
              error: 'Failed to process CSV data: ' + (error instanceof Error ? error.message : 'Unknown error')
            }, { status: 500 }));
          }
        }
      });
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

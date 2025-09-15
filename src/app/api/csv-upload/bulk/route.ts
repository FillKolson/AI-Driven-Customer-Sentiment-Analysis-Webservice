import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';
import Papa, { ParseResult } from 'papaparse';

interface CsvRow {
  [key: string]: string | number | null;
}

// Keep this in sync with single-upload route. Consider refactoring to a shared module in the future.
const tableConfigs = {
  sentiment_analyses: {
    tableName: 'sentiment_analyses',
    columns: [
      'sentiment_id', 'customer_id', 'supermarket_id', 'basket_id',
      'sentiment_date', 'sentiment_score', 'confidence_level', 'sentiment_category'
    ],
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
} as const;

type TableKey = keyof typeof tableConfigs;

const ORDER: TableKey[] = [
  'supermarket_branches',
  'supermarket_customer_members',
  'market_basket_optimisation',
  'ads_ctr_optimisation',
  'sentiment_analyses',
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const datasetName = (formData.get('datasetName') as string | null) || null;

    // Collect files per table key
    const files: Partial<Record<TableKey, File>> = {};
    for (const key of ORDER) {
      const f = formData.get(key) as File | null;
      if (f) files[key] = f;
    }

    // Ensure all required files provided
    for (const key of ORDER) {
      if (!files[key]) {
        return NextResponse.json({ error: `Missing file for ${key}` }, { status: 400 });
      }
    }

    // Server-side usage limit enforcement for sentiment uploads
    const sentimentFile = files['sentiment_analyses']!;
    if (sentimentFile) {
      const text = await sentimentFile.text();
      const nonEmptyLines = text.split('\n').filter(line => line.trim() !== '').length;
      const tokensToUse = Math.max(0, nonEmptyLines - 1);
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
      if (currentUsage + tokensToUse > usageLimit) {
        const remaining = Math.max(0, usageLimit - currentUsage);
        return NextResponse.json({
          error: `Insufficient API balance. This upload would use ${tokensToUse} calls, but you only have ${remaining} remaining.`
        }, { status: 402 });
      }
    }

    // Parse and pre-validate ALL files first
    const parsedData: Record<TableKey, CsvRow[]> = {
      supermarket_branches: [],
      supermarket_customer_members: [],
      market_basket_optimisation: [],
      ads_ctr_optimisation: [],
      sentiment_analyses: [],
    };
    const transformedData: Record<TableKey, any[]> = {
      supermarket_branches: [],
      supermarket_customer_members: [],
      market_basket_optimisation: [],
      ads_ctr_optimisation: [],
      sentiment_analyses: [],
    };
    const allErrors: string[] = [];

    // helper to parse csv text with Papa
    const parseCsv = (text: string) => new Promise<ParseResult<CsvRow>>((resolve) => {
      Papa.parse<CsvRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase(),
        complete: (res) => resolve(res)
      });
    });

    for (const key of ORDER) {
      const file = files[key]!;
      const text = await file.text();
      const results = await parseCsv(text);

      if (results.errors.length > 0) {
        allErrors.push(`${key}: CSV parsing error: ${results.errors[0].message}`);
        continue;
      }
      const rows = results.data as CsvRow[];
      if (rows.length === 0) {
        allErrors.push(`${key}: No data found in CSV`);
        continue;
      }

      // Validate required columns
      const headers = Object.keys(rows[0]);
      const cfg = tableConfigs[key];
      const missingColumns = cfg.requiredColumns.filter(col =>
        !headers.some(header => header.includes(col.toLowerCase()))
      );
      if (missingColumns.length > 0) {
        allErrors.push(`${key}: Missing required columns: ${missingColumns.join(', ')}`);
        continue;
      }

      parsedData[key] = rows;

      // Transform and validate every row
      for (let i = 0; i < rows.length; i++) {
        try {
          const transformed = cfg.transformRow(rows[i]);
          const hasRequiredData = cfg.requiredColumns.every(col => {
            const value = transformed[col as keyof typeof transformed];
            return value !== null && value !== undefined && value !== '';
          });
          if (hasRequiredData) {
            transformedData[key].push(transformed);
          } else {
            allErrors.push(`${key}: Row ${i + 1}: Missing required data`);
          }
        } catch (e) {
          allErrors.push(`${key}: Row ${i + 1}: ${e instanceof Error ? e.message : 'Invalid data format'}`);
        }
      }
      if (transformedData[key].length === 0) {
        allErrors.push(`${key}: No valid rows found`);
      }
    }

    if (allErrors.length > 0) {
      return NextResponse.json({
        error: 'Validation failed. No data was inserted.',
        details: allErrors.slice(0, 50),
      }, { status: 400 });
    }

    // All files valid. Perform inserts per table. Use compensating rollback on failure.
    const insertedTables: TableKey[] = [];
    try {
      for (const key of ORDER) {
        const dataRows = transformedData[key].map((r: any) => ({
          ...r,
          user_id: user.id,
          file_name: datasetName ?? (files[key] as File).name,
        }));

        let attempt = 0;
        let currentPayload: any[] = dataRows;
        let insertErrorMsg: string | null = null;
        while (attempt < 3) {
          const { error: insertError } = await supabase
            .from(tableConfigs[key].tableName)
            .insert(currentPayload);
          if (!insertError) break;
          insertErrorMsg = insertError.message || String(insertError);
          if (insertErrorMsg.includes('column "user_id" does not exist') && attempt === 0) {
            currentPayload = currentPayload.map((r) => { const { user_id, ...rest } = r as any; return rest; });
            attempt++; continue;
          }
          if (insertErrorMsg.includes('column "file_name" does not exist') && attempt <= 1) {
            currentPayload = currentPayload.map((r) => { const { file_name, ...rest } = r as any; return rest; });
            attempt++; continue;
          }
          throw new Error(insertErrorMsg);
        }
        insertedTables.push(key);
      }
    } catch (e) {
      // Compensating rollback: delete by user_id + file_name
      for (const key of insertedTables.reverse()) {
        const fname = datasetName ?? (files[key] as File).name;
        await supabase.from(tableConfigs[key].tableName)
          .delete()
          .match({ user_id: user.id, file_name: fname });
      }
      return NextResponse.json({ error: `Failed to insert data: ${e instanceof Error ? e.message : 'Unknown error'}` }, { status: 500 });
    }

    // Usage accounting and logging only after successful inserts
    let tokensUsed = 0;
    if (files['sentiment_analyses']) {
      const text = await files['sentiment_analyses']!.text();
      const lineCount = text.split('\n').filter(line => line.trim() !== '').length;
      tokensUsed = Math.max(0, lineCount - 1);
    }

    const { error: usageError } = await supabase.rpc('increment_monthly_usage', {
      user_id_param: user.id,
      token_count: tokensUsed,
    });
    if (usageError) {
      console.error('Error updating monthly usage:', usageError);
    }

    // Log single consolidated upload
    await supabase.from('csv_upload_logs').insert({
      user_id: user.id,
      table_name: 'bulk_upload',
      records_processed: ORDER.reduce((sum, k) => sum + transformedData[k].length, 0),
      upload_date: new Date().toISOString(),
      file_name: datasetName ?? 'bulk_upload',
      tokens_used: tokensUsed,
    });

    // Update usage tracking
    await supabase.rpc('increment_usage', { user_id: user.id, tokens: tokensUsed });

    return NextResponse.json({
      success: true,
      byTable: ORDER.map(k => ({ key: k, table: tableConfigs[k].tableName, inserted: transformedData[k].length })),
      totalInserted: ORDER.reduce((sum, k) => sum + transformedData[k].length, 0),
    });

  } catch (error) {
    console.error('Bulk CSV upload error:', error);
    return NextResponse.json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}

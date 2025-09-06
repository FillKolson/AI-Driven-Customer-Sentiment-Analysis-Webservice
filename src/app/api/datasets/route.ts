import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../supabase/server';

const TABLES_IN_DELETE_ORDER = [
  'sentiment_analyses',
  'ads_ctr_optimisation',
  'market_basket_optimisation',
  'supermarket_branches',
  'supermarket_customer_members',
] as const;

type DeletableTable = typeof TABLES_IN_DELETE_ORDER[number];

// Helper to fetch distinct file_name values for a user from a table (if table has file_name)
async function getDistinctFileNames(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: DeletableTable,
  userId: string
): Promise<string[]> {
  // Select file_name distinct where not null and user match if user_id exists
  // We attempt with user_id filter first; if it errors (no user_id column), retry without it.
  try {
    const { data, error } = await supabase
      .from(table)
      .select('file_name', { count: 'exact', head: false })
      .not('file_name', 'is', null)
      .eq('user_id', userId);

    if (error) throw error;
    const names = (data || [])
      .map((r: any) => r.file_name)
      .filter((v: any): v is string => typeof v === 'string');
    return Array.from(new Set(names));
  } catch {
    const { data, error } = await supabase
      .from(table)
      .select('file_name', { count: 'exact', head: false })
      .not('file_name', 'is', null);
    if (error) return [];
    const names = (data || [])
      .map((r: any) => r.file_name)
      .filter((v: any): v is string => typeof v === 'string');
    return Array.from(new Set(names));
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Gather names from all tables and de-duplicate
    const allSets: string[][] = [];
    for (const table of TABLES_IN_DELETE_ORDER) {
      const names = await getDistinctFileNames(supabase, table, user.id);
      allSets.push(names);
    }
    const unique = Array.from(new Set(allSets.flat())).sort((a, b) => a.localeCompare(b));

    return NextResponse.json({ datasets: unique });
  } catch (e) {
    console.error('GET /api/datasets error', e);
    return NextResponse.json({ error: 'Failed to list datasets' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => null);
    const file_name = body?.file_name as string | undefined;
    if (!file_name || typeof file_name !== 'string') {
      return NextResponse.json({ error: 'file_name is required' }, { status: 400 });
    }

    const results: Record<string, { deleted: number; error?: string }> = {};

    for (const table of TABLES_IN_DELETE_ORDER) {
      // Try with user filter first (multi-tenant safety)
      try {
        const { error, count } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .eq('file_name', file_name)
          .eq('user_id', user.id);

        if (error) throw error;
        results[table] = { deleted: count ?? 0 };
        continue;
      } catch (err: any) {
        // Retry without user_id filter for tables that might miss it
        const { error, count } = await supabase
          .from(table)
          .delete({ count: 'exact' })
          .eq('file_name', file_name);

        if (error) {
          results[table] = { deleted: 0, error: error.message || String(error) };
        } else {
          results[table] = { deleted: count ?? 0 };
        }
      }
    }

    const totalDeleted = Object.values(results).reduce((sum, r) => sum + (r.deleted || 0), 0);
    const hadErrors = Object.values(results).some((r) => r.error);

    return NextResponse.json({
      success: !hadErrors,
      file_name,
      totalDeleted,
      results,
      message: hadErrors ? 'Deleted with partial errors' : 'Deleted successfully',
    }, { status: hadErrors ? 207 : 200 });
  } catch (e) {
    console.error('DELETE /api/datasets error', e);
    return NextResponse.json({ error: 'Failed to delete dataset' }, { status: 500 });
  }
}

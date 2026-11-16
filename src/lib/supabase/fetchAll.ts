const PAGE_SIZE = 1000

interface PageResult {
  // Supabase rows are untyped in this project (no generated Database types).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[] | null
  error: { message: string; code?: string } | null
  count: number | null
}

interface FetchAllOptions {
  /** Treat "table does not exist" as an empty list instead of an error. */
  missingTableIsEmpty?: boolean
}

// Postgres "undefined_table" and PostgREST "table not found in schema cache"
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205'])

/**
 * Loads every row of a query, page by page.
 *
 * Supabase returns at most 1,000 rows per request and gives no error when it
 * cuts a result short, which silently corrupts totals and ledgers. This keeps
 * requesting pages until the server-reported row count has been reached.
 *
 * It throws on any query error so that a failed load is shown as an error
 * instead of looking like an empty list.
 *
 * The query passed in must:
 *  - select with `{ count: 'exact' }`
 *  - have a deterministic order (end with `.order('id')`) so pages don't overlap
 *  - end with `.range(from, to)`
 */
export async function fetchAllRows<T>(
  label: string,
  getPage: (from: number, to: number) => PromiseLike<PageResult>,
  options: FetchAllOptions = {}
): Promise<T[]> {
  const rows: T[] = []

  for (;;) {
    const from = rows.length
    const { data, error, count } = await getPage(from, from + PAGE_SIZE - 1)

    if (error) {
      if (options.missingTableIsEmpty && error.code && MISSING_TABLE_CODES.has(error.code)) {
        return []
      }
      console.error(`[fetchAllRows] ${label}:`, error)
      throw new Error(`Failed to load ${label}: ${error.message}`)
    }

    const page = (data ?? []) as T[]
    rows.push(...page)

    // Stop when the server has no more rows. The page-size check is only a
    // fallback for when no count was returned.
    if (page.length === 0) break
    if (count !== null ? rows.length >= count : page.length < PAGE_SIZE) break
  }

  return rows
}

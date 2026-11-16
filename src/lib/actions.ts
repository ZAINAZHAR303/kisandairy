import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Shared plumbing for server actions: authentication, error handling and
 * form parsing. Every action returns a plain `{ error }` (or `{ data, error }`)
 * object instead of throwing, because the UI reads `result.error`.
 */

export type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export interface ActionContext {
  supabase: ServerSupabase
  user: User
}

/** Result of an action that returns the saved row. */
export interface DataResult<T> {
  data: T | null
  error: string | null
}

/** Result of an action that only succeeds or fails (deletes, bulk updates). */
export interface StatusResult {
  error: string | null
}

const UNEXPECTED = 'An unexpected error occurred'

export function errorMessage(err: unknown, fallback: string = UNEXPECTED): string {
  if (typeof err === 'string' && err) return err
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

async function withUser<R>(
  onFail: (message: string) => R,
  run: (ctx: ActionContext) => Promise<R>
): Promise<R> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return onFail('Unauthorized')
    return await run({ supabase, user })
  } catch (err) {
    return onFail(errorMessage(err))
  }
}

/** Runs an action for the signed-in user and returns `{ data, error }`. */
export function dataAction<T>(
  run: (ctx: ActionContext) => Promise<DataResult<T>>
): Promise<DataResult<T>> {
  return withUser<DataResult<T>>((message) => ({ data: null, error: message }), run)
}

/** Runs an action for the signed-in user and returns `{ error }`. */
export function statusAction(
  run: (ctx: ActionContext) => Promise<StatusResult>
): Promise<StatusResult> {
  return withUser<StatusResult>((message) => ({ error: message }), run)
}

export function fail<T = never>(message: string): DataResult<T> {
  return { data: null, error: message }
}

/** Typed reader for the fields of a submitted form. */
export class FormReader {
  constructor(private readonly formData: FormData) {}

  /** The value exactly as submitted, or null when the field is missing. */
  raw(name: string): string | null {
    const value = this.formData.get(name)
    return typeof value === 'string' ? value : null
  }

  /** Trimmed text; an empty string when missing. */
  text(name: string): string {
    return (this.raw(name) ?? '').trim()
  }

  /** Trimmed text, or null when missing or blank. */
  optionalText(name: string): string | null {
    return this.text(name) || null
  }

  /** A number; 0 when missing, blank or not numeric. */
  number(name: string): number {
    const raw = this.raw(name)
    if (!raw) return 0
    const value = Number(raw)
    return Number.isNaN(value) ? 0 : value
  }

  /** A number, or null when missing, blank or not numeric. */
  optionalNumber(name: string): number | null {
    const raw = this.raw(name)
    if (!raw) return null
    const value = Number(raw)
    return Number.isNaN(value) ? null : value
  }
}

type Row = Record<string, unknown>

interface WriteResult<T> {
  data: T | null
  error: { message?: string } | null
}

/**
 * Runs an insert/update and, if the database reports that a column is missing
 * ("schema cache" error), retries once without the given optional columns.
 * This keeps saves working on databases that predate those columns.
 */
export async function writeWithOptionalColumns<T>(
  payload: Row,
  optionalColumns: string[],
  write: (payload: Row) => PromiseLike<WriteResult<T>>
): Promise<WriteResult<T>> {
  const result = await write(payload)
  if (!result.error?.message?.includes('schema cache')) return result

  const reduced: Row = { ...payload }
  for (const column of optionalColumns) delete reduced[column]
  return write(reduced)
}

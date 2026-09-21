/**
 * Export and import utilities for backup/restore.
 */

import type { BudgetState } from '../store/types'
import { BudgetStateSchema } from './schema'
import { migrateV1 } from './migrate'
import { todayStr } from '../lib/dates'

/**
 * Download the full state as a JSON backup file.
 */
export function downloadBackup(state: BudgetState): void {
  const json = JSON.stringify(state, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const today = todayStr()
  const a = document.createElement('a')
  a.href = url
  a.download = `budget-backup-${today}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Parse, migrate, and validate an imported file.
 * Returns a summary for confirmation or a specific error.
 */
export async function parseImportFile(
  file: File
): Promise<{ ok: true; state: BudgetState; counts: Record<string, number> } | { ok: false; error: string }> {
  try {
    const text = await file.text()

    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, error: 'The file is not valid JSON.' }
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'The file does not contain a valid budget backup.' }
    }

    // Check if it's a v2 state
    const obj = parsed as Record<string, unknown>
    let state: BudgetState

    if (obj['version'] === 2) {
      const result = BudgetStateSchema.safeParse(parsed)
      if (!result.success) {
        const issues = result.error.issues.slice(0, 3).map(i => i.message).join('; ')
        return { ok: false, error: `Invalid backup format: ${issues}` }
      }
      state = result.data
    } else {
      // Try v1 migration
      try {
        state = migrateV1(parsed as never)
        const result = BudgetStateSchema.safeParse(state)
        if (!result.success) {
          return { ok: false, error: 'The file could not be converted to a valid budget format.' }
        }
        state = result.data
      } catch {
        return { ok: false, error: 'The file does not contain a recognized budget format.' }
      }
    }

    const counts: Record<string, number> = {
      transactions: state.transactions.length,
      bills: state.bills.length,
      people: state.debtors.length,
      wallets: state.wallets.length,
    }

    return { ok: true, state, counts }
  } catch {
    return { ok: false, error: 'Failed to read the file.' }
  }
}

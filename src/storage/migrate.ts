/**
 * v1 → v2 migration.
 * Converts old format: dollar floats → integer cents, numeric ids → strings,
 * ISO dates → local YYYY-MM-DD, drops future-dated entries.
 */

import type { BudgetState } from '../store/types'
import { DEFAULT_STATE } from '../store/reducer'
import { todayStr, toDateStr } from '../lib/dates'
import { newId } from '../lib/id'

interface V1Transaction {
  id?: number | string
  type?: string
  amount?: number
  label?: string
  category?: string
  date?: string
  createdAt?: string
}

interface V1State {
  transactions?: V1Transaction[]
  openingBalance?: number
  settings?: {
    displayName?: string
    currency?: string
    openingBalance?: number
  }
}

function floatToCents(amount: number): number {
  return Math.round(amount * 100)
}

function isoToLocalDate(isoStr: string): string {
  // If already YYYY-MM-DD, just return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoStr)) return isoStr

  // Parse ISO datetime — extract local date from components
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return todayStr()
    return toDateStr(d)
  } catch {
    return todayStr()
  }
}

export function migrateV1(raw: V1State): BudgetState {
  const today = todayStr()
  const state: BudgetState = { ...DEFAULT_STATE }

  // Migrate settings
  const openingBalance = raw.settings?.openingBalance ?? raw.openingBalance ?? 0
  state.settings = {
    ...state.settings,
    openingBalanceCents: floatToCents(openingBalance),
    displayName: raw.settings?.displayName ?? 'You',
  }

  // Migrate transactions
  if (Array.isArray(raw.transactions)) {
    state.transactions = raw.transactions
      .map((tx): { valid: boolean; result: BudgetState['transactions'][number] } => {
        const type = tx.type === 'income' || tx.type === 'expense' ? tx.type : 'expense'
        const amountCents = floatToCents(Math.abs(tx.amount ?? 0))
        if (amountCents <= 0) return { valid: false, result: null as never }

        const date = tx.date ? isoToLocalDate(tx.date) : today
        // Drop future-dated entries
        if (date > today) return { valid: false, result: null as never }

        return {
          valid: true,
          result: {
            id: String(tx.id ?? newId()),
            type,
            amountCents,
            label: tx.label ?? '',
            category: tx.category ?? 'Other',
            date,
            createdAt: tx.createdAt ?? new Date().toISOString(),
          },
        }
      })
      .filter(r => r.valid)
      .map(r => r.result)
  }

  // Bills, debtors, wallets weren't in v1 — start with defaults
  state.wallets = [...DEFAULT_STATE.wallets]

  return state
}

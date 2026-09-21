/**
 * localStorage adapter — implements the persistence interface.
 * Handles load, save, corruption recovery, and cross-tab sync.
 */

import type { BudgetState } from '../store/types'
import { DEFAULT_STATE } from '../store/reducer'
import { BudgetStateSchema } from './schema'
import { migrateV1 } from './migrate'

const STORAGE_KEY = 'budget.v2'
const V1_STORAGE_KEY = 'budget.v1'

export interface StorageAdapter {
  load(): { state: BudgetState; notice: string | null }
  save(state: BudgetState): { error: string | null }
}

export function createLocalAdapter(): StorageAdapter {
  return {
    load(): { state: BudgetState; notice: string | null } {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)

        // If no v2 data, check for v1 migration
        if (raw === null) {
          const v1Raw = localStorage.getItem(V1_STORAGE_KEY)
          if (v1Raw !== null) {
            try {
              const v1Data = JSON.parse(v1Raw) as Record<string, unknown>
              const migrated = migrateV1(v1Data as never)
              // Save the migrated data (leave v1 untouched)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
              return { state: migrated, notice: 'Your data was migrated from v1. Please verify everything looks correct.' }
            } catch {
              // v1 data was corrupt — start fresh
              return { state: { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] }, notice: null }
            }
          }
          return { state: { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] }, notice: null }
        }

        // Parse and validate
        let parsed: unknown
        try {
          parsed = JSON.parse(raw)
        } catch {
          // JSON is corrupt — backup and start fresh
          const timestamp = Date.now()
          localStorage.setItem(`${STORAGE_KEY}.corrupt-${timestamp}`, raw)
          return {
            state: { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] },
            notice: "Your saved data couldn't be read. A copy was kept — export or contact the developer.",
          }
        }

        const result = BudgetStateSchema.safeParse(parsed)
        if (!result.success) {
          // Validation failed — backup and start fresh
          const timestamp = Date.now()
          localStorage.setItem(`${STORAGE_KEY}.corrupt-${timestamp}`, raw)
          return {
            state: { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] },
            notice: "Your saved data couldn't be read. A copy was kept — export or contact the developer.",
          }
        }

        return { state: result.data, notice: null }
      } catch {
        // localStorage not available
        return { state: { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] }, notice: null }
      }
    },

    save(state: BudgetState): { error: string | null } {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
        return { error: null }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        return { error: `Couldn't save your changes: ${msg}. Export a backup now.` }
      }
    },
  }
}

/** Storage key for cross-tab sync detection. */
export { STORAGE_KEY }

/**
 * React context for the budget store.
 * Separated from the provider for Fast Refresh compatibility.
 */

import { createContext } from 'react'
import type { BudgetState, TxType, Settings, Wallet } from './types'

export interface BudgetContextValue {
  state: BudgetState
  balanceCents: number
  canUndo: boolean
  notice: string | null
  persistError: string | null

  addTransaction(i: { type: TxType; amountCents: number; label: string; category: string; date: string }): string
  removeTransaction(id: string): void

  addBill(i: { name: string; amountCents: number; dueDay: number; category: string }): void
  removeBill(id: string): void
  toggleBillPaid(billId: string, month: string): void

  addDebtor(i: { name: string; amountCents: number; reason: string }): void
  recordRepayment(debtorId: string, amountCents: number): void
  settleDebtor(debtorId: string): void
  removeDebtor(id: string): void

  addWallet(i: Omit<Wallet, 'id' | 'linked'>): void
  updateWallet(id: string, patch: Partial<Omit<Wallet, 'id' | 'linked'>>): void
  removeWallet(id: string): void

  updateSettings(patch: Partial<Settings>): void
  exportData(): void
  importData(file: File): Promise<{ ok: true; counts: Record<string, number> } | { ok: false; error: string }>
  loadDemoData(): void
  resetAll(): void

  undo(): void
  dismissNotice(): void
}

export const BudgetContext = createContext<BudgetContextValue | null>(null)

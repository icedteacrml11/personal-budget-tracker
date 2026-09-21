/**
 * Memoized selectors for derived values.
 * These are pure functions — never stored in state.
 */

import type { BudgetState, Transaction } from './types'
import { monthKey } from '../lib/dates'

/** Available balance: openingBalanceCents + Σ income − Σ expense (all time). */
export function selectBalanceCents(state: BudgetState): number {
  return state.transactions.reduce((bal, tx) => {
    return tx.type === 'income'
      ? bal + tx.amountCents
      : bal - tx.amountCents
  }, state.settings.openingBalanceCents)
}

/** Month totals for a given YYYY-MM. */
export function selectMonthTotals(state: BudgetState, month: string): {
  income: number
  spent: number
  net: number
} {
  let income = 0
  let spent = 0
  for (const tx of state.transactions) {
    if (monthKey(tx.date) === month) {
      if (tx.type === 'income') income += tx.amountCents
      else spent += tx.amountCents
    }
  }
  return { income, spent, net: income - spent }
}

/** Spending by category for a month, sorted descending. */
export function selectSpendingByCategory(
  state: BudgetState,
  month: string
): { category: string; amountCents: number; percent: number }[] {
  const map = new Map<string, number>()
  let total = 0

  for (const tx of state.transactions) {
    if (tx.type === 'expense' && monthKey(tx.date) === month) {
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amountCents)
      total += tx.amountCents
    }
  }

  return Array.from(map.entries())
    .map(([category, amountCents]) => ({
      category,
      amountCents,
      percent: total > 0 ? (amountCents / total) * 100 : 0,
    }))
    .sort((a, b) => b.amountCents - a.amountCents)
}

/** Transactions for a given month, sorted by date desc then createdAt desc. */
export function selectMonthTransactions(
  state: BudgetState,
  month: string,
  type?: 'income' | 'expense'
): Transaction[] {
  return state.transactions
    .filter(tx => monthKey(tx.date) === month && (!type || tx.type === type))
    .sort((a, b) => {
      const dateComp = b.date.localeCompare(a.date)
      if (dateComp !== 0) return dateComp
      return b.createdAt.localeCompare(a.createdAt)
    })
}

/** Bill paid status for a given month. */
export function selectBillStatus(
  state: BudgetState,
  billId: string,
  month: string
): { paid: boolean; paymentId?: string } {
  const bp = state.billPayments.find(
    bp => bp.billId === billId && bp.month === month
  )
  return bp ? { paid: true, paymentId: bp.id } : { paid: false }
}

/** Debtor progress: paid, remaining, percent. */
export function selectDebtorProgress(
  state: BudgetState,
  debtorId: string
): { paidCents: number; remainingCents: number; percent: number } {
  const debtor = state.debtors.find(d => d.id === debtorId)
  if (!debtor) return { paidCents: 0, remainingCents: 0, percent: 0 }

  const paidCents = state.repayments
    .filter(r => r.debtorId === debtorId)
    .reduce((sum, r) => sum + r.amountCents, 0)

  const remainingCents = debtor.amountCents - paidCents
  const percent = debtor.amountCents > 0
    ? (paidCents / debtor.amountCents) * 100
    : 0

  return { paidCents, remainingCents, percent }
}

/** Net worth and wallet view calculations. */
export function selectWalletView(state: BudgetState, availableBalance: number): {
  netWorth: number
  assets: number
  liabilities: number
  wallets: Array<{
    id: string
    kind: string
    name: string
    institution: string
    last4?: string
    balanceCents: number
    linked?: boolean
  }>
} {
  const wallets = state.wallets.map(w => ({
    ...w,
    // The linked wallet's balance mirrors Available Balance
    balanceCents: w.linked ? availableBalance : w.balanceCents,
  }))

  let assets = 0
  let liabilities = 0
  for (const w of wallets) {
    if (w.balanceCents >= 0) {
      assets += w.balanceCents
    } else {
      liabilities += Math.abs(w.balanceCents)
    }
  }

  return {
    netWorth: assets - liabilities,
    assets,
    liabilities,
    wallets,
  }
}

/** Bill summary for a month. */
export function selectBillSummary(
  state: BudgetState,
  month: string
): { paidTotal: number; dueTotal: number; paidCount: number; totalCount: number } {
  let paidTotal = 0
  let dueTotal = 0
  let paidCount = 0

  for (const bill of state.bills) {
    const isPaid = state.billPayments.some(
      bp => bp.billId === bill.id && bp.month === month
    )
    if (isPaid) {
      paidTotal += bill.amountCents
      paidCount++
    } else {
      dueTotal += bill.amountCents
    }
  }

  return { paidTotal, dueTotal, paidCount, totalCount: state.bills.length }
}

/** Total still owed across all outstanding debtors. */
export function selectTotalOwed(state: BudgetState): {
  totalRemaining: number
  totalCollected: number
  outstandingCount: number
} {
  let totalRemaining = 0
  let totalCollected = 0
  let outstandingCount = 0

  for (const debtor of state.debtors) {
    const paid = state.repayments
      .filter(r => r.debtorId === debtor.id)
      .reduce((sum, r) => sum + r.amountCents, 0)
    totalCollected += paid
    if (!debtor.settled) {
      totalRemaining += debtor.amountCents - paid
      outstandingCount++
    }
  }

  return { totalRemaining, totalCollected, outstandingCount }
}

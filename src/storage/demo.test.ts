import { describe, it, expect } from 'vitest'
import { buildDemoData } from './demo'
import { BudgetStateSchema } from './schema'
import { todayStr } from '../lib/dates'

describe('demo data', () => {
  it('produces valid BudgetState', () => {
    const demo = buildDemoData()
    const result = BudgetStateSchema.safeParse(demo)
    expect(result.success).toBe(true)
  })

  it('has no future-dated entries', () => {
    const today = todayStr()
    const demo = buildDemoData()

    for (const tx of demo.transactions) {
      expect(tx.date <= today).toBe(true)
    }
    for (const d of demo.debtors) {
      expect(d.date <= today).toBe(true)
    }
    for (const r of demo.repayments) {
      expect(r.date <= today).toBe(true)
    }
  })

  it('satisfies all invariants', () => {
    const state = buildDemoData()

    // Every BillPayment.transactionId exists
    for (const bp of state.billPayments) {
      expect(state.transactions.some(t => t.id === bp.transactionId)).toBe(true)
    }

    // Every Repayment.transactionId exists
    for (const r of state.repayments) {
      expect(state.transactions.some(t => t.id === r.transactionId)).toBe(true)
    }

    // All money is integer
    for (const t of state.transactions) {
      expect(Number.isInteger(t.amountCents)).toBe(true)
    }
    for (const b of state.bills) {
      expect(Number.isInteger(b.amountCents)).toBe(true)
    }

    // Exactly one linked wallet
    expect(state.wallets.filter(w => w.linked).length).toBe(1)

    // Debtor repayments ≤ amountCents
    for (const d of state.debtors) {
      const paid = state.repayments
        .filter(r => r.debtorId === d.id)
        .reduce((sum, r) => sum + r.amountCents, 0)
      expect(paid).toBeLessThanOrEqual(d.amountCents)
      expect(d.settled).toBe(paid === d.amountCents)
    }
  })

  it('has transactions, bills, wallets, and debtors', () => {
    const demo = buildDemoData()
    expect(demo.transactions.length).toBeGreaterThan(0)
    expect(demo.bills.length).toBeGreaterThan(0)
    expect(demo.wallets.length).toBeGreaterThan(1)
    expect(demo.debtors.length).toBeGreaterThan(0)
  })
})

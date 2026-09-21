import { describe, it, expect } from 'vitest'
import { budgetReducer, DEFAULT_STATE } from './reducer'
import type { BudgetState } from './types'
import { selectBalanceCents } from './selectors'
import { newId } from '../lib/id'


function addTx(state: BudgetState, type: 'income' | 'expense', amountCents: number, label = 'Test', category = 'Other', date = '2026-09-15'): BudgetState {
  return budgetReducer(state, {
    type: 'ADD_TRANSACTION',
    payload: { id: newId(), type, amountCents, label, category, date, createdAt: new Date().toISOString() },
  })
}

describe('reducer - balance math', () => {
  it('income increases balance', () => {
    const state = addTx(DEFAULT_STATE, 'income', 10000)
    expect(selectBalanceCents(state)).toBe(10000)
  })

  it('expense decreases balance', () => {
    let state = addTx(DEFAULT_STATE, 'income', 10000)
    state = addTx(state, 'expense', 3000)
    expect(selectBalanceCents(state)).toBe(7000)
  })

  it('opening balance is included', () => {
    const state: BudgetState = {
      ...DEFAULT_STATE,
      settings: { ...DEFAULT_STATE.settings, openingBalanceCents: 5000 },
    }
    const updated = addTx(state, 'income', 2000)
    expect(selectBalanceCents(updated)).toBe(7000)
  })

  it('balance can go negative', () => {
    const state = addTx(DEFAULT_STATE, 'expense', 1000)
    expect(selectBalanceCents(state)).toBe(-1000)
  })
})

describe('reducer - bill pay/unpay', () => {
  it('paying a bill creates an expense and billPayment', () => {
    const billId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_BILL',
      payload: { id: billId, name: 'Rent', amountCents: 52000, dueDay: 1, category: 'Bills' },
    })

    // Add some income first
    state = addTx(state, 'income', 100000)
    const balBefore = selectBalanceCents(state)

    const paymentId = newId()
    const txId = newId()
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId, transactionId: txId, date: '2026-09-15', createdAt: new Date().toISOString() },
    })

    expect(selectBalanceCents(state)).toBe(balBefore - 52000)
    expect(state.billPayments).toHaveLength(1)
    expect(state.transactions.some(t => t.source?.kind === 'bill')).toBe(true)
  })

  it('un-paying restores the balance exactly', () => {
    const billId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_BILL',
      payload: { id: billId, name: 'Rent', amountCents: 52000, dueDay: 1, category: 'Bills' },
    })
    state = addTx(state, 'income', 100000)
    const balBefore = selectBalanceCents(state)

    // Pay
    const paymentId = newId()
    const txId = newId()
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId, transactionId: txId, date: '2026-09-15', createdAt: new Date().toISOString() },
    })

    // Unpay
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId: newId(), transactionId: newId(), date: '2026-09-15', createdAt: new Date().toISOString() },
    })

    expect(selectBalanceCents(state)).toBe(balBefore)
    expect(state.billPayments).toHaveLength(0)
  })

  it('paying the same bill in two months creates two payments', () => {
    const billId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_BILL',
      payload: { id: billId, name: 'Phone', amountCents: 2500, dueDay: 5, category: 'Bills' },
    })

    // Pay for September
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId: newId(), transactionId: newId(), date: '2026-09-15', createdAt: new Date().toISOString() },
    })

    // Pay for October
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-10', paymentId: newId(), transactionId: newId(), date: '2026-10-05', createdAt: new Date().toISOString() },
    })

    expect(state.billPayments).toHaveLength(2)
    expect(state.transactions.filter(t => t.source?.kind === 'bill')).toHaveLength(2)
  })
})

describe('reducer - delete cascades', () => {
  it('removeTransaction cascades for bill-sourced transaction', () => {
    const billId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_BILL',
      payload: { id: billId, name: 'Rent', amountCents: 52000, dueDay: 1, category: 'Bills' },
    })

    const paymentId = newId()
    const txId = newId()
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId, transactionId: txId, date: '2026-09-15', createdAt: new Date().toISOString() },
    })

    expect(state.billPayments).toHaveLength(1)

    // Delete the transaction
    state = budgetReducer(state, { type: 'REMOVE_TRANSACTION', payload: { id: txId } })

    expect(state.transactions).toHaveLength(0)
    expect(state.billPayments).toHaveLength(0) // Cascaded
  })

  it('removeTransaction cascades for repayment-sourced transaction', () => {
    const debtorId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_DEBTOR',
      payload: { id: debtorId, name: 'Sam', amountCents: 5000, reason: 'Lunch', date: '2026-09-01' },
    })

    const repaymentId = newId()
    const txId = newId()
    state = budgetReducer(state, {
      type: 'RECORD_REPAYMENT',
      payload: { repaymentId, debtorId, amountCents: 2500, date: '2026-09-10', transactionId: txId, createdAt: new Date().toISOString(), label: 'Repayment · Sam' },
    })

    expect(state.repayments).toHaveLength(1)

    // Delete the income transaction
    state = budgetReducer(state, { type: 'REMOVE_TRANSACTION', payload: { id: txId } })

    expect(state.transactions).toHaveLength(0)
    expect(state.repayments).toHaveLength(0) // Cascaded
    expect(state.debtors[0]!.settled).toBe(false) // Unsettled
  })

  it('removeBill keeps expenses but clears source', () => {
    const billId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_BILL',
      payload: { id: billId, name: 'Rent', amountCents: 52000, dueDay: 1, category: 'Bills' },
    })

    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId: newId(), transactionId: newId(), date: '2026-09-15', createdAt: new Date().toISOString() },
    })

    state = budgetReducer(state, { type: 'REMOVE_BILL', payload: { id: billId } })

    expect(state.bills).toHaveLength(0)
    expect(state.billPayments).toHaveLength(0)
    expect(state.transactions).toHaveLength(1) // Transaction kept
    expect(state.transactions[0]!.source).toBeUndefined() // Source cleared
  })

  it('removeDebtor keeps income but clears source', () => {
    const debtorId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_DEBTOR',
      payload: { id: debtorId, name: 'Sam', amountCents: 5000, reason: 'Lunch', date: '2026-09-01' },
    })

    state = budgetReducer(state, {
      type: 'RECORD_REPAYMENT',
      payload: { repaymentId: newId(), debtorId, amountCents: 2500, date: '2026-09-10', transactionId: newId(), createdAt: new Date().toISOString(), label: 'Repayment · Sam' },
    })

    state = budgetReducer(state, { type: 'REMOVE_DEBTOR', payload: { id: debtorId } })

    expect(state.debtors).toHaveLength(0)
    expect(state.repayments).toHaveLength(0)
    expect(state.transactions).toHaveLength(1) // Income kept
    expect(state.transactions[0]!.source).toBeUndefined() // Source cleared
  })
})

describe('reducer - repayments', () => {
  it('clamps to remaining balance', () => {
    const debtorId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_DEBTOR',
      payload: { id: debtorId, name: 'Sam', amountCents: 3000, reason: 'Lunch', date: '2026-09-01' },
    })

    state = budgetReducer(state, {
      type: 'RECORD_REPAYMENT',
      payload: { repaymentId: newId(), debtorId, amountCents: 5000 /* more than owed */, date: '2026-09-10', transactionId: newId(), createdAt: new Date().toISOString(), label: 'Repayment · Sam' },
    })

    expect(state.repayments[0]!.amountCents).toBe(3000) // Clamped
    expect(state.debtors[0]!.settled).toBe(true) // Auto-settled
  })

  it('auto-settles when fully paid', () => {
    const debtorId = newId()
    let state = budgetReducer(DEFAULT_STATE, {
      type: 'ADD_DEBTOR',
      payload: { id: debtorId, name: 'Sam', amountCents: 2000, reason: 'Coffee', date: '2026-09-01' },
    })

    state = budgetReducer(state, {
      type: 'RECORD_REPAYMENT',
      payload: { repaymentId: newId(), debtorId, amountCents: 1000, date: '2026-09-05', transactionId: newId(), createdAt: new Date().toISOString(), label: 'Repayment · Sam' },
    })
    expect(state.debtors[0]!.settled).toBe(false)

    state = budgetReducer(state, {
      type: 'RECORD_REPAYMENT',
      payload: { repaymentId: newId(), debtorId, amountCents: 1000, date: '2026-09-10', transactionId: newId(), createdAt: new Date().toISOString(), label: 'Repayment · Sam' },
    })
    expect(state.debtors[0]!.settled).toBe(true)
  })
})

describe('reducer - wallets', () => {
  it('cannot remove the linked wallet', () => {
    const linked = DEFAULT_STATE.wallets.find(w => w.linked)!
    const state = budgetReducer(DEFAULT_STATE, { type: 'REMOVE_WALLET', payload: { id: linked.id } })
    expect(state.wallets.find(w => w.linked)).toBeDefined()
  })
})

describe('invariants', () => {
  it('hold after a randomized sequence of actions', () => {
    let state = { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] }
    state = addTx(state, 'income', 50000, 'Allowance', 'Allowance', '2026-09-01')

    // Add some bills
    const billId = newId()
    state = budgetReducer(state, {
      type: 'ADD_BILL',
      payload: { id: billId, name: 'Phone', amountCents: 2500, dueDay: 5, category: 'Bills' },
    })

    // Pay bill
    const bpId = newId()
    const bpTxId = newId()
    state = budgetReducer(state, {
      type: 'TOGGLE_BILL_PAID',
      payload: { billId, month: '2026-09', paymentId: bpId, transactionId: bpTxId, date: '2026-09-05', createdAt: new Date().toISOString() },
    })

    // Add debtor
    const debtorId = newId()
    state = budgetReducer(state, {
      type: 'ADD_DEBTOR',
      payload: { id: debtorId, name: 'Test', amountCents: 3000, reason: 'Book', date: '2026-09-01' },
    })

    // Record repayment
    const rpId = newId()
    const rpTxId = newId()
    state = budgetReducer(state, {
      type: 'RECORD_REPAYMENT',
      payload: { repaymentId: rpId, debtorId, amountCents: 1500, date: '2026-09-10', transactionId: rpTxId, createdAt: new Date().toISOString(), label: 'Repayment · Test' },
    })

    // Verify invariants
    // 1. Every BillPayment.transactionId points to an existing transaction
    for (const bp of state.billPayments) {
      expect(state.transactions.some(t => t.id === bp.transactionId)).toBe(true)
    }

    // 2. Every Repayment.transactionId points to an existing transaction
    for (const r of state.repayments) {
      expect(state.transactions.some(t => t.id === r.transactionId)).toBe(true)
    }

    // 3. Every transaction source points to an existing record
    for (const t of state.transactions) {
      if (t.source?.kind === 'bill') {
        expect(state.billPayments.some(bp => bp.id === (t.source as { kind: 'bill'; billPaymentId: string }).billPaymentId)).toBe(true)
      }
      if (t.source?.kind === 'repayment') {
        expect(state.repayments.some(r => r.id === (t.source as { kind: 'repayment'; repaymentId: string }).repaymentId)).toBe(true)
      }
    }

    // 4. All money fields are integers
    for (const t of state.transactions) {
      expect(Number.isInteger(t.amountCents)).toBe(true)
    }
    for (const b of state.bills) {
      expect(Number.isInteger(b.amountCents)).toBe(true)
    }

    // 5. Exactly one linked wallet
    expect(state.wallets.filter(w => w.linked).length).toBe(1)

    // 6. For each debtor, Σ repayments ≤ amountCents
    for (const d of state.debtors) {
      const paid = state.repayments
        .filter(r => r.debtorId === d.id)
        .reduce((sum, r) => sum + r.amountCents, 0)
      expect(paid).toBeLessThanOrEqual(d.amountCents)
      // settled === (remaining === 0)
      expect(d.settled).toBe(paid === d.amountCents)
    }
  })
})

/**
 * Pure reducer for the budget store.
 * No React, no I/O — just state transitions.
 * All cascade logic (bill pay/unpay, repayment clamp, delete cascades) lives here.
 */

import type { BudgetState, BudgetAction, Transaction } from './types'

export const DEFAULT_STATE: BudgetState = {
  version: 2,
  settings: {
    displayName: 'You',
    currency: 'USD',
    openingBalanceCents: 0,
  },
  transactions: [],
  bills: [],
  billPayments: [],
  debtors: [],
  repayments: [],
  wallets: [
    {
      id: 'default-wallet',
      kind: 'checking',
      name: 'Main Checking',
      institution: '',
      balanceCents: 0,
      linked: true,
    },
  ],
}

export function budgetReducer(state: BudgetState, action: BudgetAction): BudgetState {
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const tx: Transaction = {
        id: action.payload.id,
        type: action.payload.type,
        amountCents: action.payload.amountCents,
        label: action.payload.label,
        category: action.payload.category,
        date: action.payload.date,
        createdAt: action.payload.createdAt,
        ...(action.payload.source ? { source: action.payload.source } : {}),
      }
      return {
        ...state,
        transactions: [tx, ...state.transactions],
      }
    }

    case 'REMOVE_TRANSACTION': {
      const tx = state.transactions.find(t => t.id === action.payload.id)
      if (!tx) return state

      let newState = { ...state }

      // Cascade: if from a bill payment, remove that bill payment
      if (tx.source?.kind === 'bill') {
        newState = {
          ...newState,
          billPayments: newState.billPayments.filter(
            bp => bp.id !== (tx.source as { kind: 'bill'; billPaymentId: string }).billPaymentId
          ),
        }
      }

      // Cascade: if from a repayment, remove that repayment and possibly unsettle debtor
      if (tx.source?.kind === 'repayment') {
        const repayment = newState.repayments.find(
          r => r.id === (tx.source as { kind: 'repayment'; repaymentId: string }).repaymentId
        )
        if (repayment) {
          newState = {
            ...newState,
            repayments: newState.repayments.filter(r => r.id !== repayment.id),
          }
          // Check if debtor needs to be unsettled
          const debtor = newState.debtors.find(d => d.id === repayment.debtorId)
          if (debtor && debtor.settled) {
            // Calculate remaining after removing this repayment
            const paidAfter = newState.repayments
              .filter(r => r.debtorId === debtor.id)
              .reduce((sum, r) => sum + r.amountCents, 0)
            if (paidAfter < debtor.amountCents) {
              newState = {
                ...newState,
                debtors: newState.debtors.map(d =>
                  d.id === debtor.id ? { ...d, settled: false } : d
                ),
              }
            }
          }
        }
      }

      // Remove the transaction itself
      newState = {
        ...newState,
        transactions: newState.transactions.filter(t => t.id !== action.payload.id),
      }

      return newState
    }

    case 'ADD_BILL': {
      return {
        ...state,
        bills: [
          ...state.bills,
          {
            id: action.payload.id,
            name: action.payload.name,
            amountCents: action.payload.amountCents,
            dueDay: action.payload.dueDay,
            category: action.payload.category,
          },
        ],
      }
    }

    case 'REMOVE_BILL': {
      // Remove the bill and its bill payments, but keep the expense transactions
      // (real spending) with their source cleared
      const billPaymentsToRemove = state.billPayments.filter(
        bp => bp.billId === action.payload.id
      )
      const txIdsToUnsource = new Set(billPaymentsToRemove.map(bp => bp.transactionId))

      return {
        ...state,
        bills: state.bills.filter(b => b.id !== action.payload.id),
        billPayments: state.billPayments.filter(bp => bp.billId !== action.payload.id),
        transactions: state.transactions.map(t =>
          txIdsToUnsource.has(t.id) ? { ...t, source: undefined } : t
        ),
      }
    }

    case 'TOGGLE_BILL_PAID': {
      const { billId, month, paymentId, transactionId, date, createdAt } = action.payload
      const bill = state.bills.find(b => b.id === billId)
      if (!bill) return state

      const existing = state.billPayments.find(
        bp => bp.billId === billId && bp.month === month
      )

      if (existing) {
        // Unpay: remove the bill payment and its transaction
        return {
          ...state,
          billPayments: state.billPayments.filter(bp => bp.id !== existing.id),
          transactions: state.transactions.filter(t => t.id !== existing.transactionId),
        }
      }

      // Pay: create expense + bill payment
      const tx: Transaction = {
        id: transactionId,
        type: 'expense',
        amountCents: bill.amountCents,
        label: bill.name,
        category: bill.category,
        date,
        createdAt,
        source: { kind: 'bill', billPaymentId: paymentId },
      }

      return {
        ...state,
        transactions: [tx, ...state.transactions],
        billPayments: [
          ...state.billPayments,
          { id: paymentId, billId, month, transactionId },
        ],
      }
    }

    case 'ADD_DEBTOR': {
      return {
        ...state,
        debtors: [
          ...state.debtors,
          {
            id: action.payload.id,
            name: action.payload.name,
            amountCents: action.payload.amountCents,
            reason: action.payload.reason,
            date: action.payload.date,
            settled: false,
          },
        ],
      }
    }

    case 'RECORD_REPAYMENT': {
      const { repaymentId, debtorId, amountCents, date, transactionId, createdAt, label } = action.payload
      const debtor = state.debtors.find(d => d.id === debtorId)
      if (!debtor) return state

      // Clamp to remaining
      const paidSoFar = state.repayments
        .filter(r => r.debtorId === debtorId)
        .reduce((sum, r) => sum + r.amountCents, 0)
      const remaining = debtor.amountCents - paidSoFar
      const actualAmount = Math.min(amountCents, remaining)
      if (actualAmount <= 0) return state

      const newRemaining = remaining - actualAmount
      const settled = newRemaining === 0

      const tx: Transaction = {
        id: transactionId,
        type: 'income',
        amountCents: actualAmount,
        label,
        category: 'Other',
        date,
        createdAt,
        source: { kind: 'repayment', repaymentId },
      }

      return {
        ...state,
        transactions: [tx, ...state.transactions],
        repayments: [
          ...state.repayments,
          { id: repaymentId, debtorId, amountCents: actualAmount, date, transactionId },
        ],
        debtors: state.debtors.map(d =>
          d.id === debtorId ? { ...d, settled } : d
        ),
      }
    }

    case 'SETTLE_DEBTOR': {
      // This is essentially RECORD_REPAYMENT for the full remaining amount
      const { debtorId, repaymentId, transactionId, date, createdAt, label, amountCents } = action.payload
      const debtor = state.debtors.find(d => d.id === debtorId)
      if (!debtor || debtor.settled) return state

      const tx: Transaction = {
        id: transactionId,
        type: 'income',
        amountCents,
        label,
        category: 'Other',
        date,
        createdAt,
        source: { kind: 'repayment', repaymentId },
      }

      return {
        ...state,
        transactions: [tx, ...state.transactions],
        repayments: [
          ...state.repayments,
          { id: repaymentId, debtorId, amountCents, date, transactionId },
        ],
        debtors: state.debtors.map(d =>
          d.id === debtorId ? { ...d, settled: true } : d
        ),
      }
    }

    case 'REMOVE_DEBTOR': {
      // Remove debtor and repayments, but keep income transactions with source cleared
      const repaymentsToRemove = state.repayments.filter(
        r => r.debtorId === action.payload.id
      )
      const txIdsToUnsource = new Set(repaymentsToRemove.map(r => r.transactionId))

      return {
        ...state,
        debtors: state.debtors.filter(d => d.id !== action.payload.id),
        repayments: state.repayments.filter(r => r.debtorId !== action.payload.id),
        transactions: state.transactions.map(t =>
          txIdsToUnsource.has(t.id) ? { ...t, source: undefined } : t
        ),
      }
    }

    case 'ADD_WALLET': {
      return {
        ...state,
        wallets: [...state.wallets, action.payload],
      }
    }

    case 'UPDATE_WALLET': {
      return {
        ...state,
        wallets: state.wallets.map(w =>
          w.id === action.payload.id
            ? { ...w, ...action.payload.patch }
            : w
        ),
      }
    }

    case 'REMOVE_WALLET': {
      // The linked wallet cannot be removed
      const wallet = state.wallets.find(w => w.id === action.payload.id)
      if (!wallet || wallet.linked) return state

      return {
        ...state,
        wallets: state.wallets.filter(w => w.id !== action.payload.id),
      }
    }

    case 'UPDATE_SETTINGS': {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      }
    }

    case 'REPLACE_STATE': {
      return action.payload
    }
  }
}

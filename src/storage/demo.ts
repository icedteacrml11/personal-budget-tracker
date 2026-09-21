/**
 * Demo data — builds realistic data using the same reducer actions.
 * Anchored to today's date so it looks lived-in on any day.
 */

import type { BudgetState } from '../store/types'
import { budgetReducer, DEFAULT_STATE } from '../store/reducer'
import { todayStr, addMonths, monthKey, daysInMonth } from '../lib/dates'
import { newId } from '../lib/id'

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isoNow(): string {
  return new Date().toISOString()
}

export function buildDemoData(): BudgetState {
  const today = todayStr()
  const currentMonth = monthKey(today)
  const prevMonth = addMonths(currentMonth, -1)

  const todayParts = today.split('-')
  const todayDay = parseInt(todayParts[2]!, 10)
  const todayMonth = parseInt(todayParts[1]!, 10)
  const todayYear = parseInt(todayParts[0]!, 10)

  const prevParts = prevMonth.split('-')
  const prevMonthNum = parseInt(prevParts[1]!, 10)
  const prevYear = parseInt(prevParts[0]!, 10)
  const prevDays = daysInMonth(prevMonth)

  let state: BudgetState = {
    ...DEFAULT_STATE,
    settings: {
      displayName: 'Alex',
      currency: 'USD',
      openingBalanceCents: 18000, // $180.00
    },
    wallets: [
      { id: 'demo-wallet-1', kind: 'checking', name: 'Main Checking', institution: 'Chase', last4: '4821', balanceCents: 0, linked: true },
    ],
  }

  // Helper to add a transaction via reducer
  function addTx(type: 'income' | 'expense', amountCents: number, label: string, category: string, date: string) {
    if (date > today) return // Don't add future dates
    state = budgetReducer(state, {
      type: 'ADD_TRANSACTION',
      payload: {
        id: newId(),
        type,
        amountCents,
        label,
        category,
        date,
        createdAt: isoNow(),
      },
    })
  }

  // === PREVIOUS MONTH ===
  // Weekly allowances on 1st, 8th, 15th
  addTx('income', 15000, 'Weekly Allowance', 'Allowance', dateStr(prevYear, prevMonthNum, 1))
  addTx('income', 15000, 'Weekly Allowance', 'Allowance', dateStr(prevYear, prevMonthNum, 8))
  addTx('income', 15000, 'Weekly Allowance', 'Allowance', dateStr(prevYear, prevMonthNum, 15))

  // Job income
  addTx('income', 6000, 'Tutoring Session', 'Job', dateStr(prevYear, prevMonthNum, 12))

  // Expenses throughout the month
  const prevExpenses: Array<[number, number, string, string]> = [
    [2, 3250, 'Grocery run', 'Groceries'],
    [3, 550, 'Coffee & bagel', 'Food & Dining'],
    [5, 6500, 'Bus pass', 'Transport'],
    [6, 280, 'Bread & milk', 'Groceries'],
    [8, 1200, 'Movie night', 'Entertainment'],
    [10, 850, 'Lunch', 'Food & Dining'],
    [11, 1450, 'Notebook & pens', 'Shopping'],
    [13, 999, 'Spotify', 'Entertainment'],
    [15, 4200, 'Grocery run', 'Groceries'],
    [17, 650, 'Coffee & bagel', 'Food & Dining'],
    [19, 780, 'Lunch', 'Food & Dining'],
    [21, 2100, 'Grocery run', 'Groceries'],
    [23, 550, 'Coffee', 'Food & Dining'],
    [25, 1800, 'T-shirt', 'Shopping'],
    [27, 350, 'Bread & eggs', 'Groceries'],
    [28, 1500, 'Pharmacy', 'Health'],
  ]

  for (const [day, cents, label, cat] of prevExpenses) {
    if (day <= prevDays) {
      addTx('expense', cents, label, cat, dateStr(prevYear, prevMonthNum, day))
    }
  }

  // === CURRENT MONTH (up to today) ===
  // Weekly allowances
  if (todayDay >= 1) addTx('income', 15000, 'Weekly Allowance', 'Allowance', dateStr(todayYear, todayMonth, 1))
  if (todayDay >= 8) addTx('income', 15000, 'Weekly Allowance', 'Allowance', dateStr(todayYear, todayMonth, 8))
  if (todayDay >= 15) addTx('income', 15000, 'Weekly Allowance', 'Allowance', dateStr(todayYear, todayMonth, 15))

  // Job income
  if (todayDay >= 10) addTx('income', 6000, 'Tutoring Session', 'Job', dateStr(todayYear, todayMonth, 10))

  // Current month expenses
  const curExpenses: Array<[number, number, string, string]> = [
    [1, 2800, 'Grocery run', 'Groceries'],
    [2, 550, 'Coffee & bagel', 'Food & Dining'],
    [3, 6500, 'Bus pass', 'Transport'],
    [5, 380, 'Bread & milk', 'Groceries'],
    [6, 1200, 'Movie night', 'Entertainment'],
    [7, 750, 'Lunch', 'Food & Dining'],
    [9, 1650, 'Notebook & pens', 'Shopping'],
    [11, 999, 'Spotify', 'Entertainment'],
    [12, 3500, 'Grocery run', 'Groceries'],
    [14, 620, 'Coffee & bagel', 'Food & Dining'],
    [16, 880, 'Lunch', 'Food & Dining'],
    [18, 2400, 'Grocery run', 'Groceries'],
    [19, 450, 'Coffee', 'Food & Dining'],
    [20, 2200, 'New backpack', 'Shopping'],
    [21, 300, 'Bread & eggs', 'Groceries'],
  ]

  for (const [day, cents, label, cat] of curExpenses) {
    if (day <= todayDay) {
      addTx('expense', cents, label, cat, dateStr(todayYear, todayMonth, day))
    }
  }

  // === BILLS (all unpaid) ===
  const bills = [
    { name: 'Rent (room share)', amountCents: 52000, dueDay: 1, category: 'Bills' },
    { name: 'Phone Plan', amountCents: 2500, dueDay: 5, category: 'Bills' },
    { name: 'Spotify', amountCents: 999, dueDay: 12, category: 'Entertainment' },
    { name: 'Gym Membership', amountCents: 2900, dueDay: 15, category: 'Health' },
    { name: 'Student Loan', amountCents: 12000, dueDay: 20, category: 'Bills' },
  ]

  for (const bill of bills) {
    state = budgetReducer(state, {
      type: 'ADD_BILL',
      payload: { id: newId(), ...bill },
    })
  }

  // === ADDITIONAL WALLETS ===
  state = budgetReducer(state, {
    type: 'ADD_WALLET',
    payload: { id: newId(), kind: 'savings', name: 'High-Yield Savings', institution: 'Ally', last4: '7392', balanceCents: 240000 },
  })
  state = budgetReducer(state, {
    type: 'ADD_WALLET',
    payload: { id: newId(), kind: 'cash', name: 'Cash on Hand', institution: '', balanceCents: 5000 },
  })
  state = budgetReducer(state, {
    type: 'ADD_WALLET',
    payload: { id: newId(), kind: 'investment', name: 'Investment Portfolio', institution: 'Fidelity', last4: '1055', balanceCents: 80000 },
  })
  state = budgetReducer(state, {
    type: 'ADD_WALLET',
    payload: { id: newId(), kind: 'credit', name: 'Credit Card', institution: 'Citi', last4: '3344', balanceCents: -34000 },
  })

  // === DEBTORS (People) ===
  // 1. Partially repaid
  const debtor1Id = newId()
  state = budgetReducer(state, {
    type: 'ADD_DEBTOR',
    payload: { id: debtor1Id, name: 'Jordan Kim', amountCents: 5000, reason: 'Concert tickets', date: dateStr(prevYear, prevMonthNum, 5) },
  })
  // Record a partial payment
  const repay1TxId = newId()
  const repay1Id = newId()
  state = budgetReducer(state, {
    type: 'RECORD_REPAYMENT',
    payload: {
      repaymentId: repay1Id,
      debtorId: debtor1Id,
      amountCents: 2500,
      date: dateStr(prevYear, prevMonthNum, 20),
      transactionId: repay1TxId,
      createdAt: isoNow(),
      label: 'Repayment · Jordan Kim',
    },
  })

  // 2. Untouched
  const debtor2Id = newId()
  state = budgetReducer(state, {
    type: 'ADD_DEBTOR',
    payload: { id: debtor2Id, name: 'Sam Rivera', amountCents: 3000, reason: 'Lunch money', date: dateStr(prevYear, prevMonthNum, 15) },
  })

  // 3. Settled
  const debtor3Id = newId()
  state = budgetReducer(state, {
    type: 'ADD_DEBTOR',
    payload: { id: debtor3Id, name: 'Casey Lee', amountCents: 1500, reason: 'Textbook split', date: dateStr(prevYear, prevMonthNum, 3) },
  })
  const repay3TxId = newId()
  const repay3Id = newId()
  state = budgetReducer(state, {
    type: 'RECORD_REPAYMENT',
    payload: {
      repaymentId: repay3Id,
      debtorId: debtor3Id,
      amountCents: 1500,
      date: dateStr(prevYear, prevMonthNum, 25),
      transactionId: repay3TxId,
      createdAt: isoNow(),
      label: 'Repayment · Casey Lee',
    },
  })

  return state
}

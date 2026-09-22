/**
 * src/store.tsx — Single-file store for Budget Tracker v2.
 * Now expanded to handle full data persistence (Wallets, Bills, People).
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/* ───────────────────────── Palette ───────────────────────── */

export const P = {
  bg: '#F4F4F6',
  card: '#FFFFFF',
  ink: '#1A1A1C',
  secondary: '#67676C',
  tertiary: '#9A9AA0',
  hair: 'rgba(0,0,0,0.06)',

  blue:  { text: '#0A62D6', solid: '#0A6CFF', hover: '#0954C8', soft: '#EAF1FE' },
  green: { text: '#0B845B', solid: '#12A66F', soft: '#E7F6EF' },
  red:   { text: '#C4362C', solid: '#E5453A', soft: '#FBEBE9' },

  shadowSm: '0 1px 2px rgba(17,20,45,.05), 0 4px 12px rgba(17,20,45,.04)',
  shadowMd: '0 1px 3px rgba(17,20,45,.06), 0 8px 24px rgba(17,20,45,.05)',
} as const

/* ───────────────────── Category metadata ─────────────────── */

interface CatMeta { emoji: string; color: string }

export const EXPENSE_CATEGORIES: Record<string, CatMeta> = {
  'Groceries':      { emoji: '🛒', color: '#0E9E6E' },
  'Food & Dining':  { emoji: '🍔', color: '#E07E2E' },
  'Shopping':       { emoji: '🛍️', color: '#E04862' },
  'Transport':      { emoji: '🚌', color: '#2E7BE0' },
  'Entertainment':  { emoji: '🎬', color: '#8B5CF6' },
  'Health':         { emoji: '💊', color: '#1FA5B8' },
  'Bills':          { emoji: '🧾', color: '#5B5FD6' },
  'Other':          { emoji: '📋', color: '#8A8A90' },
}

export const INCOME_CATEGORIES: Record<string, CatMeta> = {
  'Allowance': { emoji: '💵', color: '#0E9E6E' },
  'Job':       { emoji: '💼', color: '#2E7BE0' },
  'Gift':      { emoji: '🎁', color: '#8B5CF6' },
  'Refund':    { emoji: '↩️', color: '#E07E2E' },
  'Other':     { emoji: '➕', color: '#8A8A90' },
}

export function catMeta(type: 'income' | 'expense', category: string): CatMeta {
  const map = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return map[category] ?? map['Other']!
}

/* ───────────────────── Formatters ────────────────────────── */

export function fmt(n: number): string {
  return n
    .toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
    .replace(/-/, '\u2212')
}

export function fmtShort(n: number): string {
  const abs = Math.abs(n)
  if (abs < 1000) {
    if (n % 1 === 0) {
      return n
        .toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 })
        .replace(/-/, '\u2212')
    }
    return fmt(n)
  }
  return n
    .toLocaleString('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 } as Intl.NumberFormatOptions)
    .replace(/-/, '\u2212')
}

/* ───────────────────── ID helper ─────────────────────────── */

export function newId(): string {
  try { return crypto.randomUUID() } catch { /* fallback */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

/* ───────────────────── Types ─────────────────────────────── */

export interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  label: string
  category: string
  date: string
}

export interface WalletAccount {
  id: string
  kind: 'checking' | 'savings' | 'cash' | 'investment' | 'credit'
  name: string
  institution: string
  last4: string
  balance: number
  gradient: string
}

export interface BillDef {
  id: string
  name: string
  amount: number
  dueDay: number
  category: string
}

export interface BillPayment {
  id: string
  billId: string
  month: string // YYYY-MM
  transactionId: string
}

export interface Debtor {
  id: string
  name: string
  initials: string
  avatarColor: string
  totalAmount: number
  amountPaid: number
  reason: string
  date: string
  settled: boolean
}

interface StoreState {
  openingBalance: number
  transactions: Transaction[]
  wallets: WalletAccount[]
  bills: BillDef[]
  billPayments: BillPayment[]
  debtors: Debtor[]
}

type Action =
  | { type: 'REPLACE'; state: StoreState }
  | { type: 'ADD_TX'; tx: Transaction }
  | { type: 'REMOVE_TX'; id: string }
  | { type: 'UPDATE_WALLET'; id: string; balance: number }
  | { type: 'ADD_BILL_PAYMENT'; payment: BillPayment }
  | { type: 'REMOVE_BILL_PAYMENT'; paymentId: string }
  | { type: 'ADD_DEBTOR'; debtor: Debtor }
  | { type: 'UPDATE_DEBTOR'; id: string; amountPaid: number; settled: boolean }
  | { type: 'REMOVE_DEBTOR'; id: string }

/* ───────────────────── Reducer ────────────────────────────── */

function reducer(s: StoreState, a: Action): StoreState {
  switch (a.type) {
    case 'REPLACE': return a.state
    case 'ADD_TX': return { ...s, transactions: [a.tx, ...s.transactions] }
    case 'REMOVE_TX': return { ...s, transactions: s.transactions.filter(t => t.id !== a.id) }
    case 'UPDATE_WALLET': return { ...s, wallets: s.wallets.map(w => w.id === a.id ? { ...w, balance: a.balance } : w) }
    case 'ADD_BILL_PAYMENT': return { ...s, billPayments: [...s.billPayments, a.payment] }
    case 'REMOVE_BILL_PAYMENT': return { ...s, billPayments: s.billPayments.filter(bp => bp.id !== a.paymentId) }
    case 'ADD_DEBTOR': return { ...s, debtors: [a.debtor, ...s.debtors] }
    case 'UPDATE_DEBTOR': return { ...s, debtors: s.debtors.map(d => d.id === a.id ? { ...d, amountPaid: a.amountPaid, settled: a.settled } : d) }
    case 'REMOVE_DEBTOR': return { ...s, debtors: s.debtors.filter(d => d.id !== a.id) }
  }
}

function calcBalance(s: StoreState): number {
  return s.transactions.reduce((bal, tx) => {
    return tx.type === 'income' ? bal + tx.amount : bal - tx.amount
  }, s.openingBalance)
}

/* ───────────────────── Persistence & Migration ───────────── */

const STORAGE_KEY = 'budget.v3'
const OLD_V2_KEY = 'budget.v2'
const OLD_V1_KEY = 'budget.v1'

const AVATAR_COLORS = [
  '#0A6CFF', '#0E9E6E', '#E07E2E', '#8B5CF6',
  '#E04862', '#2E7BE0', '#1FA5B8', '#5B5FD6',
]

const GRADIENTS = [
  'linear-gradient(135deg, #1F2024, #35363B)',
  'linear-gradient(135deg, #0A6CFF, #3E93FF)',
  'linear-gradient(135deg, #0E9E6E, #3DDC97)',
  'linear-gradient(135deg, #6B4CE0, #9B7EFF)',
  'linear-gradient(135deg, #4A4B50, #67676C)',
]

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function loadState(): StoreState {
  try {
    // 1. Try to load v3 (current)
    const rawV3 = localStorage.getItem(STORAGE_KEY)
    if (rawV3) return JSON.parse(rawV3) as StoreState
  } catch { /* ignore */ }

  try {
    // 2. Try to migrate from v2
    const rawV2 = localStorage.getItem(OLD_V2_KEY)
    if (rawV2) {
      const old = JSON.parse(rawV2)
      
      const transactions = (old.transactions || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        amount: (t.amountCents || 0) / 100,
        label: t.label,
        category: t.category,
        date: t.date,
      }))

      let gIdx = 0
      const wallets = (old.wallets || []).map((w: any) => ({
        id: w.id,
        kind: w.kind || 'checking',
        name: w.name,
        institution: w.institution || '',
        last4: w.last4 || '',
        balance: (w.balanceCents || 0) / 100,
        gradient: GRADIENTS[gIdx++ % GRADIENTS.length],
      }))

      const bills = (old.bills || []).map((b: any) => ({
        id: b.id,
        name: b.name,
        amount: (b.amountCents || 0) / 100,
        dueDay: b.dueDay,
        category: b.category,
      }))

      let cIdx = 0
      const debtors = (old.debtors || []).map((d: any) => {
        const paidSoFarCents = (old.repayments || [])
          .filter((r: any) => r.debtorId === d.id)
          .reduce((sum: number, r: any) => sum + (r.amountCents || 0), 0)
        return {
          id: d.id,
          name: d.name,
          initials: getInitials(d.name),
          avatarColor: AVATAR_COLORS[cIdx++ % AVATAR_COLORS.length],
          totalAmount: (d.amountCents || 0) / 100,
          amountPaid: paidSoFarCents / 100,
          reason: d.reason,
          date: d.date,
          settled: d.settled,
        }
      })

      const migrated: StoreState = {
        openingBalance: (old.settings?.openingBalanceCents || 0) / 100,
        transactions,
        wallets,
        bills,
        billPayments: old.billPayments || [],
        debtors,
      }
      
      // Save the migrated state to v3 so we don't migrate again
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch (e) {
    console.error("Migration failed:", e)
  }

  try {
    // 3. Try to migrate from v1 (which stored amounts in dollars directly)
    const rawV1 = localStorage.getItem(OLD_V1_KEY)
    if (rawV1) {
      const old = JSON.parse(rawV1)
      
      const transactions = (old.transactions || []).map((t: any) => {
        let date = t.date || new Date().toISOString().slice(0, 10)
        if (date.length > 10) date = date.slice(0, 10) // Convert ISO string to YYYY-MM-DD
        
        return {
          id: String(t.id || newId()),
          type: t.type === 'income' || t.type === 'expense' ? t.type : 'expense',
          amount: Math.abs(t.amount || 0),
          label: t.label || '',
          category: t.category || 'Other',
          date: date,
        }
      })

      const openingBalance = old.settings?.openingBalance ?? old.openingBalance ?? 0

      const migrated: StoreState = {
        openingBalance,
        transactions,
        wallets: [
          { id: 'w1', kind: 'checking', name: 'Main Checking', institution: 'Bank', last4: '', balance: openingBalance, gradient: GRADIENTS[0]! }
        ],
        bills: [],
        billPayments: [],
        debtors: [],
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch (e) {
    console.error("V1 Migration failed:", e)
  }

  // 4. Fallback to empty fresh state
  return {
    openingBalance: 0,
    transactions: [],
    wallets: [
      { id: 'w1', kind: 'checking', name: 'Main Checking', institution: 'Bank', last4: '', balance: 0, gradient: GRADIENTS[0]! }
    ],
    bills: [],
    billPayments: [],
    debtors: [],
  }
}

function saveState(s: StoreState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

/* ───────────────────── Context ────────────────────────────── */

interface BudgetCtx extends StoreState {
  balance: number
  addTransaction(tx: Omit<Transaction, 'id'>): string
  removeTransaction(id: string): void
  updateWallet(id: string, balance: number): void
  toggleBillPaid(billId: string, month: string): void
  addDebtor(d: Omit<Debtor, 'id' | 'initials' | 'avatarColor'>): void
  recordRepayment(debtorId: string, amount: number): void
  settleDebtor(debtorId: string): void
  removeDebtor(debtorId: string): void
}

const Ctx = createContext<BudgetCtx | null>(null)

export function BudgetProvider({ children }: { children: ReactNode }) {
  const [initState] = useState(loadState)
  const [state, dispatch] = useReducer(reducer, initState)
  const prevRef = useRef(state)

  // persist
  useEffect(() => {
    if (state === prevRef.current) return
    prevRef.current = state
    saveState(state)
  }, [state])

  const balance = calcBalance(state)

  const addTransaction = useCallback((tx: Omit<Transaction, 'id'>): string => {
    const id = newId()
    dispatch({ type: 'ADD_TX', tx: { ...tx, id } })
    return id
  }, [])

  const removeTransaction = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TX', id })
    // Also cleanup bill payments if it was a bill transaction
    const bp = state.billPayments.find(b => b.transactionId === id)
    if (bp) dispatch({ type: 'REMOVE_BILL_PAYMENT', paymentId: bp.id })
  }, [state.billPayments])

  const updateWallet = useCallback((id: string, balance: number) => {
    dispatch({ type: 'UPDATE_WALLET', id, balance })
  }, [])

  const toggleBillPaid = useCallback((billId: string, month: string) => {
    const existing = state.billPayments.find(bp => bp.billId === billId && bp.month === month)
    if (existing) {
      dispatch({ type: 'REMOVE_BILL_PAYMENT', paymentId: existing.id })
      dispatch({ type: 'REMOVE_TX', id: existing.transactionId })
    } else {
      const bill = state.bills.find(b => b.id === billId)
      if (!bill) return
      const txId = newId()
      dispatch({ type: 'ADD_TX', tx: { id: txId, type: 'expense', amount: bill.amount, label: bill.name, category: 'Bills', date: new Date().toISOString().slice(0, 10) }})
      dispatch({ type: 'ADD_BILL_PAYMENT', payment: { id: newId(), billId, month, transactionId: txId }})
    }
  }, [state.bills, state.billPayments])

  const addDebtor = useCallback((d: Omit<Debtor, 'id' | 'initials' | 'avatarColor'>) => {
    const id = newId()
    const color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]!
    dispatch({ type: 'ADD_DEBTOR', debtor: { ...d, id, initials: getInitials(d.name), avatarColor: color } })
  }, [])

  const recordRepayment = useCallback((debtorId: string, amount: number) => {
    const debtor = state.debtors.find(d => d.id === debtorId)
    if (!debtor) return
    const remaining = debtor.totalAmount - debtor.amountPaid
    const actual = Math.min(amount, remaining)
    if (actual <= 0) return
    
    addTransaction({ type: 'income', amount: actual, label: `Repayment · ${debtor.name}`, category: 'Other', date: new Date().toISOString().slice(0, 10) })
    dispatch({ type: 'UPDATE_DEBTOR', id: debtorId, amountPaid: debtor.amountPaid + actual, settled: (debtor.amountPaid + actual) >= debtor.totalAmount })
  }, [state.debtors, addTransaction])

  const settleDebtor = useCallback((debtorId: string) => {
    const debtor = state.debtors.find(d => d.id === debtorId)
    if (!debtor || debtor.settled) return
    const remaining = debtor.totalAmount - debtor.amountPaid
    if (remaining > 0) {
      addTransaction({ type: 'income', amount: remaining, label: `Repayment · ${debtor.name}`, category: 'Other', date: new Date().toISOString().slice(0, 10) })
    }
    dispatch({ type: 'UPDATE_DEBTOR', id: debtorId, amountPaid: debtor.totalAmount, settled: true })
  }, [state.debtors, addTransaction])

  const removeDebtor = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DEBTOR', id })
  }, [])

  return (
    <Ctx.Provider value={{
      ...state,
      balance,
      addTransaction,
      removeTransaction,
      updateWallet,
      toggleBillPaid,
      addDebtor,
      recordRepayment,
      settleDebtor,
      removeDebtor,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useBudget(): BudgetCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBudget must be used within <BudgetProvider>')
  return ctx
}

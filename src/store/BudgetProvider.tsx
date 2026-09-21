/**
 * BudgetProvider — the single source of truth.
 * Wraps the pure reducer with persistence, undo, and all action methods.
 */

import { useReducer, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { BudgetState, TxType, Settings, Wallet } from './types'
import { budgetReducer, DEFAULT_STATE } from './reducer'
import { selectBalanceCents } from './selectors'
import { BudgetContext, type BudgetContextValue } from './context'
import { createLocalAdapter, STORAGE_KEY } from '../storage/localAdapter'
import { downloadBackup, parseImportFile } from '../storage/backup'
import { buildDemoData } from '../storage/demo'
import { newId } from '../lib/id'
import { todayStr } from '../lib/dates'

const adapter = createLocalAdapter()

export function BudgetProvider({ children }: { children: ReactNode }) {
  // Load initial state
  const [initResult] = useState(() => adapter.load())
  const [state, dispatch] = useReducer(budgetReducer, initResult.state)
  const [notice, setNotice] = useState<string | null>(initResult.notice)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [undoSnapshot, setUndoSnapshot] = useState<BudgetState | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Persist on every state change
  const prevStateRef = useRef(state)
  useEffect(() => {
    if (state === prevStateRef.current) return
    prevStateRef.current = state
    const result = adapter.save(state)
    setPersistError(result.error)
  }, [state])

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as BudgetState
          dispatch({ type: 'REPLACE_STATE', payload: parsed })
        } catch {
          // Ignore invalid cross-tab data
        }
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // Request persistent storage
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => { /* best effort */ })
  }, [])

  // Save snapshot for undo, clear after 6 seconds
  const saveUndoSnapshot = useCallback(() => {
    setUndoSnapshot({ ...state, transactions: [...state.transactions] })
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    undoTimerRef.current = setTimeout(() => setUndoSnapshot(null), 6000)
  }, [state])

  const balanceCents = selectBalanceCents(state)

  const value: BudgetContextValue = {
    state,
    balanceCents,
    canUndo: undoSnapshot !== null,
    notice,
    persistError,

    addTransaction: useCallback((i: { type: TxType; amountCents: number; label: string; category: string; date: string }) => {
      const id = newId()
      dispatch({
        type: 'ADD_TRANSACTION',
        payload: { id, ...i, createdAt: new Date().toISOString() },
      })
      return id
    }, []),

    removeTransaction: useCallback((id: string) => {
      saveUndoSnapshot()
      dispatch({ type: 'REMOVE_TRANSACTION', payload: { id } })
    }, [saveUndoSnapshot]),

    addBill: useCallback((i: { name: string; amountCents: number; dueDay: number; category: string }) => {
      dispatch({ type: 'ADD_BILL', payload: { id: newId(), ...i } })
    }, []),

    removeBill: useCallback((id: string) => {
      saveUndoSnapshot()
      dispatch({ type: 'REMOVE_BILL', payload: { id } })
    }, [saveUndoSnapshot]),

    toggleBillPaid: useCallback((billId: string, month: string) => {
      dispatch({
        type: 'TOGGLE_BILL_PAID',
        payload: {
          billId,
          month,
          paymentId: newId(),
          transactionId: newId(),
          date: todayStr(),
          createdAt: new Date().toISOString(),
        },
      })
    }, []),

    addDebtor: useCallback((i: { name: string; amountCents: number; reason: string }) => {
      dispatch({
        type: 'ADD_DEBTOR',
        payload: { id: newId(), ...i, date: todayStr() },
      })
    }, []),

    recordRepayment: useCallback((debtorId: string, amountCents: number) => {
      const debtor = state.debtors.find(d => d.id === debtorId)
      if (!debtor) return
      dispatch({
        type: 'RECORD_REPAYMENT',
        payload: {
          repaymentId: newId(),
          debtorId,
          amountCents,
          date: todayStr(),
          transactionId: newId(),
          createdAt: new Date().toISOString(),
          label: `Repayment · ${debtor.name}`,
        },
      })
    }, [state.debtors]),

    settleDebtor: useCallback((debtorId: string) => {
      const debtor = state.debtors.find(d => d.id === debtorId)
      if (!debtor || debtor.settled) return
      const paidSoFar = state.repayments
        .filter(r => r.debtorId === debtorId)
        .reduce((sum, r) => sum + r.amountCents, 0)
      const remaining = debtor.amountCents - paidSoFar
      if (remaining <= 0) return
      dispatch({
        type: 'SETTLE_DEBTOR',
        payload: {
          debtorId,
          repaymentId: newId(),
          transactionId: newId(),
          date: todayStr(),
          createdAt: new Date().toISOString(),
          label: `Repayment · ${debtor.name}`,
          amountCents: remaining,
        },
      })
    }, [state.debtors, state.repayments]),

    removeDebtor: useCallback((id: string) => {
      saveUndoSnapshot()
      dispatch({ type: 'REMOVE_DEBTOR', payload: { id } })
    }, [saveUndoSnapshot]),

    addWallet: useCallback((i: Omit<Wallet, 'id' | 'linked'>) => {
      dispatch({ type: 'ADD_WALLET', payload: { ...i, id: newId() } })
    }, []),

    updateWallet: useCallback((id: string, patch: Partial<Omit<Wallet, 'id' | 'linked'>>) => {
      dispatch({ type: 'UPDATE_WALLET', payload: { id, patch } })
    }, []),

    removeWallet: useCallback((id: string) => {
      saveUndoSnapshot()
      dispatch({ type: 'REMOVE_WALLET', payload: { id } })
    }, [saveUndoSnapshot]),

    updateSettings: useCallback((patch: Partial<Settings>) => {
      dispatch({ type: 'UPDATE_SETTINGS', payload: patch })
    }, []),

    exportData: useCallback(() => {
      downloadBackup(state)
    }, [state]),

    importData: useCallback(async (file: File) => {
      const result = await parseImportFile(file)
      if (!result.ok) return result
      dispatch({ type: 'REPLACE_STATE', payload: result.state })
      return { ok: true as const, counts: result.counts }
    }, []),

    loadDemoData: useCallback(() => {
      const demo = buildDemoData()
      dispatch({ type: 'REPLACE_STATE', payload: demo })
    }, []),

    resetAll: useCallback(() => {
      dispatch({ type: 'REPLACE_STATE', payload: { ...DEFAULT_STATE, wallets: [...DEFAULT_STATE.wallets] } })
    }, []),

    undo: useCallback(() => {
      if (undoSnapshot) {
        dispatch({ type: 'REPLACE_STATE', payload: undoSnapshot })
        setUndoSnapshot(null)
        if (undoTimerRef.current) {
          clearTimeout(undoTimerRef.current)
          undoTimerRef.current = null
        }
      }
    }, [undoSnapshot]),

    dismissNotice: useCallback(() => {
      setNotice(null)
    }, []),
  }

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  )
}

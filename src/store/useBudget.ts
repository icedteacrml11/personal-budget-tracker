/**
 * useBudget hook — access the budget store from any component.
 */

import { useContext } from 'react'
import { BudgetContext, type BudgetContextValue } from './context'

export function useBudget(): BudgetContextValue {
  const ctx = useContext(BudgetContext)
  if (!ctx) {
    throw new Error('useBudget must be used within a BudgetProvider')
  }
  return ctx
}

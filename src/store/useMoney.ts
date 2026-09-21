/**
 * useMoney hook — returns fmt and fmtShort bound to the user's currency.
 */

import { useCallback } from 'react'
import { useBudget } from './useBudget'
import { formatMoney, formatMoneyShort } from '../lib/money'

export function useMoney() {
  const { state } = useBudget()
  const currency = state.settings.currency

  const fmt = useCallback(
    (cents: number) => formatMoney(cents, currency),
    [currency]
  )

  const fmtShort = useCallback(
    (cents: number) => formatMoneyShort(cents, currency),
    [currency]
  )

  return { fmt, fmtShort }
}

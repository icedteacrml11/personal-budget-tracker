/**
 * HomeView — monthly overview with editorial layout.
 * Balance headline, add-money form, stats, spending breakdown, money-in list.
 */

import { useState, useMemo } from 'react'
import { useBudget, useMoney, selectMonthTotals, selectSpendingByCategory, selectMonthTransactions, catMeta, categoryNames } from '../store'
import { Money } from '../components/Money'
import { AddButton } from '../components/AddButton'
import { DateChip } from '../components/DateChip'
import { todayStr, monthKey, addMonths, monthLabel, shortDate } from '../lib/dates'
import { toCents } from '../lib/money'

export function HomeView() {
  const { state, balanceCents, addTransaction, removeTransaction, loadDemoData } = useBudget()
  const { fmt } = useMoney()

  const today = todayStr()
  const [selectedMonth, setSelectedMonth] = useState(monthKey(today))
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [amountInput, setAmountInput] = useState('')
  const [category, setCategory] = useState('Allowance')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(today)
  const [amountError, setAmountError] = useState('')

  const monthTotals = useMemo(() => selectMonthTotals(state, selectedMonth), [state, selectedMonth])
  const spending = useMemo(() => selectSpendingByCategory(state, selectedMonth), [state, selectedMonth])
  const incomeTransactions = useMemo(
    () => selectMonthTransactions(state, selectedMonth, 'income'),
    [state, selectedMonth]
  )

  const currentMonth = monthKey(today)
  const isCurrentMonth = selectedMonth === currentMonth

  const isEmpty = state.transactions.length === 0

  const handleAddMoney = () => {
    const cents = toCents(amountInput)
    if (!cents) {
      setAmountError('Enter an amount greater than $0.')
      return
    }
    setAmountError('')
    addTransaction({
      type: 'income',
      amountCents: cents,
      label: note.trim() || category,
      category,
      date,
    })
    setAmountInput('')
    setNote('')
    setDate(todayStr())
    setShowAddMoney(false)
    // Jump to the transaction's month
    setSelectedMonth(monthKey(date))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMoney()
    }
  }

  const totalSpending = spending.reduce((sum, s) => sum + s.amountCents, 0)
  const saveRate = monthTotals.income > 0
    ? Math.round((monthTotals.net / monthTotals.income) * 100)
    : null

  return (
    <div className="space-y-6">
      {/* Month picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, -1))}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
            aria-label="Previous month"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M7 1L1 7L7 13" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold" style={{ color: '#1D1D1F' }}>
            {monthLabel(selectedMonth)}
          </h2>
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
            aria-label="Next month"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
              <path d="M1 1L7 7L1 13" stroke="#6E6E73" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        {!isCurrentMonth && (
          <button
            onClick={() => setSelectedMonth(currentMonth)}
            className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
            style={{ backgroundColor: '#EBF4FF', color: '#007AFF' }}
          >
            Today
          </button>
        )}
      </div>

      {/* First-run empty state */}
      {isEmpty && (
        <div
          className="rounded-2xl p-6"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <p className="text-base font-medium mb-2" style={{ color: '#1D1D1F' }}>
            Nothing here yet
          </p>
          <p className="text-sm mb-5" style={{ color: '#6E6E73' }}>
            Set your opening balance in Settings, or add your first allowance.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddMoney(true)}
              className="px-4 h-10 rounded-xl text-sm font-medium text-white cursor-pointer"
              style={{ backgroundColor: '#007AFF' }}
            >
              Add money
            </button>
            <button
              onClick={loadDemoData}
              className="px-4 h-10 rounded-xl text-sm font-medium cursor-pointer"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#007AFF' }}
            >
              Load demo data
            </button>
          </div>
        </div>
      )}

      {/* Balance headline */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6E6E73' }}>
            Available Balance
          </p>
          <div className="whitespace-nowrap" style={{ letterSpacing: '-0.02em' }}>
            <Money cents={balanceCents} className="text-4xl sm:text-5xl font-medium" />
          </div>
          <p className="text-sm mt-1" style={{ color: monthTotals.net >= 0 ? '#34C759' : '#FF3B30' }}>
            <Money cents={monthTotals.net} signed short /> net in {monthLabel(selectedMonth)}
          </p>
        </div>
        <AddButton isOpen={showAddMoney} onClick={() => setShowAddMoney(!showAddMoney)} label="Add money" />
      </div>

      {/* Add money form */}
      {showAddMoney && (
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={amountInput}
                onChange={(e) => { setAmountInput(e.target.value); setAmountError('') }}
                onKeyDown={handleKeyDown}
                className="w-full h-11 px-3 rounded-xl text-sm outline-none"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  border: amountError ? '1.5px solid #FF3B30' : '1.5px solid transparent',
                  color: '#1D1D1F',
                  fontFamily: "'DM Mono', monospace",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                onBlur={e => { e.currentTarget.style.borderColor = amountError ? '#FF3B30' : 'transparent' }}
                autoFocus
              />
              {amountError && <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>{amountError}</p>}
            </div>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="h-11 px-3 rounded-xl text-sm outline-none cursor-pointer"
              style={{
                backgroundColor: 'rgba(0,0,0,0.04)',
                border: '1.5px solid transparent',
                color: '#1D1D1F',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            >
              {categoryNames('income').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 items-center">
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={e => setNote(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-11 px-3 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: 'rgba(0,0,0,0.04)',
                border: '1.5px solid transparent',
                color: '#1D1D1F',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            />
            <DateChip value={date} onChange={setDate} />
          </div>
          <button
            onClick={handleAddMoney}
            disabled={!amountInput.trim()}
            className="mt-4 w-full h-11 rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#34C759' }}
          >
            Add to balance
          </button>
        </div>
      )}

      {/* Stats strip */}
      {!isEmpty && (
        <div
          className="rounded-2xl flex"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          {[
            { label: 'Income', value: monthTotals.income, color: '#34C759' },
            { label: 'Spent', value: monthTotals.spent, color: '#FF3B30' },
            { label: 'Net', value: monthTotals.net, color: monthTotals.net >= 0 ? '#1D1D1F' : '#FF3B30' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex-1 py-4 px-4 text-center"
              style={i > 0 ? { borderLeft: '1px solid rgba(0,0,0,0.06)' } : {}}
            >
              <p className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: '#6E6E73' }}>
                {stat.label}
              </p>
              <Money cents={stat.value} short className="text-lg font-medium" style={{ color: stat.color, fontFamily: "'DM Mono', monospace" }} />
            </div>
          ))}
        </div>
      )}

      {/* Where it went */}
      {!isEmpty && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E6E73' }}>
              Where it went
            </p>
            {totalSpending > 0 && (
              <p className="text-sm" style={{ color: '#6E6E73', fontFamily: "'DM Mono', monospace" }}>
                {fmt(totalSpending)} total
              </p>
            )}
          </div>

          {spending.length === 0 ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <p className="text-sm" style={{ color: '#6E6E73' }}>No spending this month</p>
            </div>
          ) : (
            <>
              {/* Proportion bar */}
              <div className="flex gap-[1px] mb-3 h-1.5 rounded-full overflow-hidden">
                {spending.map(s => {
                  const meta = catMeta('expense', s.category)
                  return (
                    <div
                      key={s.category}
                      style={{
                        width: `${s.percent}%`,
                        backgroundColor: meta.color,
                        minWidth: '3px',
                      }}
                    />
                  )
                })}
              </div>

              {/* Category rows */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                {spending.map((s, i) => {
                  const meta = catMeta('expense', s.category)
                  const pct = s.percent < 1 && s.percent > 0 ? '<1' : Math.round(s.percent)
                  return (
                    <div
                      key={s.category}
                      className="relative flex items-center px-4 py-3"
                      style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.06)' } : {}}
                    >
                      {/* Background fill */}
                      <div
                        className="absolute inset-0"
                        style={{
                          width: `${s.percent}%`,
                          backgroundColor: `${meta.color}09`,
                        }}
                      />
                      <div className="relative flex items-center justify-between w-full">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: meta.color }}
                          />
                          <span className="text-sm font-medium" style={{ color: '#1D1D1F' }}>
                            {s.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs" style={{ color: '#6E6E73', fontFamily: "'DM Mono', monospace" }}>
                            {pct}%
                          </span>
                          <Money cents={s.amountCents} className="text-sm font-medium" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Save rate */}
      {saveRate !== null && (
        <p className="text-sm text-center" style={{ color: '#6E6E73' }}>
          Save rate this month{' '}
          <span
            className="font-semibold"
            style={{
              color: saveRate >= 0 ? '#34C759' : '#FF3B30',
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {saveRate}%
          </span>
        </p>
      )}

      {/* Money in */}
      {!isEmpty && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#6E6E73' }}>
            Money in
          </p>

          {incomeTransactions.length === 0 ? (
            <div
              className="rounded-2xl p-5 text-center"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              <p className="text-sm" style={{ color: '#6E6E73' }}>No income this month</p>
            </div>
          ) : (
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              }}
            >
              {incomeTransactions.map((tx, i) => {
                const meta = catMeta('income', tx.category)
                const isRepayment = tx.source?.kind === 'repayment'
                return (
                  <div
                    key={tx.id}
                    className="group flex items-center px-4 py-2.5"
                    style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.06)' } : {}}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${meta.color}15` }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <span className="text-sm font-medium truncate block" style={{ color: '#1D1D1F' }}>
                        {tx.label}
                      </span>
                    </div>
                    {isRepayment && (
                      <span
                        className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium mr-2"
                        style={{ backgroundColor: '#EBF4FF', color: '#007AFF' }}
                      >
                        Repayment
                      </span>
                    )}
                    <span className="text-xs mr-3 shrink-0 w-12 text-right" style={{ color: '#6E6E73' }}>
                      {shortDate(tx.date)}
                    </span>
                    <Money cents={tx.amountCents} signed className="text-sm font-medium shrink-0" style={{ color: '#34C759', fontFamily: "'DM Mono', monospace" }} />
                    <button
                      onClick={() => removeTransaction(tx.id)}
                      className="ml-2 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'rgba(255,59,48,0.08)' }}
                      aria-label={`Delete ${tx.label}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 2L10 10M10 2L2 10" stroke="#FF3B30" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

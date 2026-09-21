/**
 * ExpensesView — free-form spending + recurring bills.
 * Quick-add expense, spending history, bills planner.
 */

import { useState, useMemo } from 'react'
import { useBudget, useMoney, selectBillStatus, selectBillSummary, catMeta, categoryNames } from '../store'
import { Money } from '../components/Money'
import { AddButton } from '../components/AddButton'
import { DateChip } from '../components/DateChip'
import { todayStr, monthKey, monthLabel, shortDate, ordinal, daysInMonth } from '../lib/dates'
import { toCents } from '../lib/money'

export function ExpensesView() {
  const { state, balanceCents, addTransaction, removeTransaction, addBill, removeBill, toggleBillPaid } = useBudget()
  const { fmt } = useMoney()

  const today = todayStr()
  const currentMonth = monthKey(today)
  const todayDay = parseInt(today.split('-')[2]!, 10)

  // Quick-add expense form
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState('Groceries')
  const [amountInput, setAmountInput] = useState('')
  const [date, setDate] = useState(today)
  const [amountError, setAmountError] = useState('')

  // Bills form
  const [showAddBill, setShowAddBill] = useState(false)
  const [billName, setBillName] = useState('')
  const [billAmount, setBillAmount] = useState('')
  const [billDueDay, setBillDueDay] = useState('1')
  const [billCategory, setBillCategory] = useState('Bills')
  const [billError, setBillError] = useState('')

  // Spending history pagination
  const [showCount, setShowCount] = useState(50)

  const allExpenses = useMemo(() => {
    return [...state.transactions]
      .filter(tx => tx.type === 'expense')
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date)
        if (dateComp !== 0) return dateComp
        return b.createdAt.localeCompare(a.createdAt)
      })
  }, [state.transactions])

  const totalExpenses = allExpenses.reduce((sum, tx) => sum + tx.amountCents, 0)
  const visibleExpenses = allExpenses.slice(0, showCount)
  const hasMore = allExpenses.length > showCount

  const billSummary = useMemo(() => selectBillSummary(state, currentMonth), [state, currentMonth])
  const daysThisMonth = daysInMonth(currentMonth)

  const handleAddExpense = () => {
    if (!label.trim()) { setAmountError('Enter what you bought.'); return }
    const cents = toCents(amountInput)
    if (!cents) { setAmountError('Enter an amount greater than $0.'); return }
    setAmountError('')
    addTransaction({
      type: 'expense',
      amountCents: cents,
      label: label.trim(),
      category,
      date,
    })
    setLabel('')
    setAmountInput('')
    setDate(todayStr())
  }

  const handleExpenseKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddExpense()
    }
  }

  const handleAddBill = () => {
    if (!billName.trim()) { setBillError('Enter a bill name.'); return }
    const cents = toCents(billAmount)
    if (!cents) { setBillError('Enter a valid amount.'); return }
    const day = parseInt(billDueDay, 10)
    if (isNaN(day) || day < 1 || day > 31) { setBillError('Due day must be 1–31.'); return }
    setBillError('')
    addBill({ name: billName.trim(), amountCents: cents, dueDay: day, category: billCategory })
    setBillName(''); setBillAmount(''); setBillDueDay('1'); setBillCategory('Bills')
    setShowAddBill(false)
  }

  return (
    <div className="space-y-6">
      {/* Balance banner */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#6E6E73' }}>
          Balance after spending
        </p>
        <Money
          cents={balanceCents}
          className="text-3xl sm:text-4xl font-medium"
          style={{ color: balanceCents < 0 ? '#FF3B30' : '#1D1D1F' }}
        />
      </div>

      {/* Quick-add expense */}
      <div
        className="rounded-2xl p-5"
        style={{
          backgroundColor: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <h3 className="text-base font-semibold mb-1" style={{ color: '#1D1D1F' }}>
          Log an expense
        </h3>
        <p className="text-xs mb-4" style={{ color: '#6E6E73' }}>
          Bought something? Add it here — it comes straight out of your balance.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="What did you buy? e.g. Bread"
            value={label}
            onChange={e => { setLabel(e.target.value); setAmountError('') }}
            onKeyDown={handleExpenseKeyDown}
            className="flex-1 h-11 px-3 rounded-xl text-sm outline-none"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="h-11 px-3 rounded-xl text-sm outline-none cursor-pointer sm:w-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
          >
            {categoryNames('expense').map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Amount"
            value={amountInput}
            onChange={e => { setAmountInput(e.target.value); setAmountError('') }}
            onKeyDown={handleExpenseKeyDown}
            className="h-11 px-3 rounded-xl text-sm outline-none sm:w-28"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
            onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
          />
          <DateChip value={date} onChange={setDate} />
          <button
            onClick={handleAddExpense}
            disabled={!label.trim() || !amountInput.trim()}
            className="h-11 px-5 rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            style={{ backgroundColor: '#007AFF' }}
          >
            + Add
          </button>
        </div>
        {amountError && <p className="text-xs mt-2" style={{ color: '#FF3B30' }}>{amountError}</p>}
      </div>

      {/* Spending history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E6E73' }}>
            Spending
          </p>
          {totalExpenses > 0 && (
            <p className="text-sm" style={{ color: '#6E6E73', fontFamily: "'DM Mono', monospace" }}>
              {fmt(totalExpenses)} total
            </p>
          )}
        </div>

        {allExpenses.length === 0 ? (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm" style={{ color: '#6E6E73' }}>No expenses yet. Log your first purchase above.</p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            {visibleExpenses.map((tx, i) => {
              const meta = catMeta('expense', tx.category)
              return (
                <div
                  key={tx.id}
                  className="group flex items-center px-4 py-2.5 hover:bg-black/[0.02] transition-colors"
                  style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.06)' } : {}}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ backgroundColor: `${meta.color}15` }}
                  >
                    {meta.emoji}
                  </div>
                  <span className="ml-3 text-sm font-medium truncate flex-1" style={{ color: '#1D1D1F' }}>
                    {tx.label}
                  </span>
                  <span
                    className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium mr-2 shrink-0"
                    style={{ backgroundColor: `${meta.color}10`, color: meta.color }}
                  >
                    {tx.category}
                  </span>
                  <span className="text-xs mr-3 shrink-0 w-12 text-right" style={{ color: '#6E6E73' }}>
                    {shortDate(tx.date)}
                  </span>
                  <Money
                    cents={-tx.amountCents}
                    className="text-sm font-medium shrink-0 w-20 text-right"
                    style={{ color: '#FF3B30' }}
                  />
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
            {hasMore && (
              <button
                onClick={() => setShowCount(showCount + 50)}
                className="w-full py-3 text-sm font-medium cursor-pointer"
                style={{ color: '#007AFF', borderTop: '1px solid rgba(0,0,0,0.06)' }}
              >
                Show more
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bills & subscriptions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E6E73' }}>
              {monthLabel(currentMonth)} bills
            </p>
            {state.bills.length > 0 && (
              <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
                <span style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(billSummary.paidTotal)}</span> paid · <span style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(billSummary.dueTotal)}</span> due
              </p>
            )}
          </div>
          <AddButton isOpen={showAddBill} onClick={() => setShowAddBill(!showAddBill)} label="Add bill" />
        </div>

        {/* Add bill form */}
        {showAddBill && (
          <div
            className="rounded-2xl p-5 mb-4"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Bill name"
                value={billName}
                onChange={e => { setBillName(e.target.value); setBillError('') }}
                className="h-11 px-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Amount"
                value={billAmount}
                onChange={e => { setBillAmount(e.target.value); setBillError('') }}
                className="h-11 px-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                inputMode="numeric"
                placeholder="Due day (1–31)"
                min={1}
                max={31}
                value={billDueDay}
                onChange={e => setBillDueDay(e.target.value)}
                className="h-11 px-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
              />
              <select
                value={billCategory}
                onChange={e => setBillCategory(e.target.value)}
                className="h-11 px-3 rounded-xl text-sm outline-none cursor-pointer"
                style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
              >
                {categoryNames('expense').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {billError && <p className="text-xs mb-2" style={{ color: '#FF3B30' }}>{billError}</p>}
            <button
              onClick={handleAddBill}
              className="w-full h-11 rounded-xl text-sm font-medium text-white cursor-pointer"
              style={{ backgroundColor: '#007AFF' }}
            >
              Add bill
            </button>
          </div>
        )}

        {/* Bill list */}
        {state.bills.length === 0 ? (
          <div
            className="rounded-2xl p-5 text-center"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <p className="text-2xl mb-2">🧾</p>
            <p className="text-sm" style={{ color: '#6E6E73' }}>No bills yet. Add your first recurring bill.</p>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            {[...state.bills]
              .sort((a, b) => a.dueDay - b.dueDay)
              .map((bill, i) => {
                const status = selectBillStatus(state, bill.id, currentMonth)
                const meta = catMeta('expense', bill.category)
                const effectiveDueDay = Math.min(bill.dueDay, daysThisMonth)
                const isOverdue = !status.paid && effectiveDueDay < todayDay

                return (
                  <div
                    key={bill.id}
                    className="group flex items-center px-4 py-3"
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(0,0,0,0.06)' : undefined,
                      opacity: status.paid ? 0.6 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleBillPaid(bill.id, currentMonth)}
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer mr-3 transition-colors"
                      style={{
                        borderColor: status.paid ? meta.color : 'rgba(0,0,0,0.15)',
                        backgroundColor: status.paid ? meta.color : 'transparent',
                      }}
                      aria-label={`Mark ${bill.name} as ${status.paid ? 'unpaid' : 'paid'}`}
                    >
                      {status.paid && (
                        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                          <path d="M1 5L4.5 8.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span
                        className="text-sm font-medium block"
                        style={{
                          color: '#1D1D1F',
                          textDecoration: status.paid ? 'line-through' : 'none',
                        }}
                      >
                        {bill.name}
                      </span>
                      <span className="text-xs" style={{ color: '#6E6E73' }}>
                        Due {ordinal(effectiveDueDay)} · monthly
                      </span>
                    </div>

                    {isOverdue && (
                      <span
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold mr-2 shrink-0"
                        style={{ backgroundColor: '#FFF0EF', color: '#FF3B30' }}
                      >
                        Overdue
                      </span>
                    )}

                    <Money cents={bill.amountCents} className="text-sm font-medium shrink-0" />

                    <button
                      onClick={() => removeBill(bill.id)}
                      className="ml-2 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                      style={{ backgroundColor: 'rgba(255,59,48,0.08)' }}
                      aria-label={`Delete ${bill.name}`}
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
    </div>
  )
}

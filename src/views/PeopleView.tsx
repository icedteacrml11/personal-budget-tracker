/**
 * PeopleView — who owes you.
 * Hero panel, outstanding/settled tabs, add form, debtor cards with progress.
 */

import { useState, useMemo } from 'react'
import { useBudget, useMoney, selectDebtorProgress, selectTotalOwed } from '../store'
import { Money } from '../components/Money'
import { AddButton } from '../components/AddButton'
import { shortDate } from '../lib/dates'
import { toCents } from '../lib/money'

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 0 || words[0] === '') return '?'
  if (words.length === 1) return words[0]![0]!.toUpperCase()
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase()
}

const AVATAR_COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5856D6', '#30B0C7']

export function PeopleView() {
  const { state, addDebtor, recordRepayment, settleDebtor, removeDebtor } = useBudget()
  const { fmt } = useMoney()

  const [tab, setTab] = useState<'outstanding' | 'settled'>('outstanding')
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [reason, setReason] = useState('')
  const [addError, setAddError] = useState('')
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')

  const totals = useMemo(() => selectTotalOwed(state), [state])
  const outstanding = state.debtors.filter(d => !d.settled)
  const settled = state.debtors.filter(d => d.settled)

  const handleAdd = () => {
    if (!name.trim()) { setAddError('Enter a name.'); return }
    const cents = toCents(amountInput)
    if (!cents) { setAddError('Enter an amount greater than $0.'); return }
    setAddError('')
    addDebtor({ name: name.trim(), amountCents: cents, reason: reason.trim() })
    setName(''); setAmountInput(''); setReason('')
    setShowAdd(false)
    setTab('outstanding')
  }

  const handlePay = (debtorId: string) => {
    const cents = toCents(payAmount)
    if (!cents) return
    recordRepayment(debtorId, cents)
    setPayingId(null)
    setPayAmount('')
  }

  const handlePayKeyDown = (e: React.KeyboardEvent, debtorId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handlePay(debtorId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero panel */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #EBF4FF 0%, #D6EAFF 100%)',
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: '#007AFF' }}>
          Still owed to you
        </p>
        <Money
          cents={totals.totalRemaining}
          className="text-4xl sm:text-5xl font-medium"
          style={{ color: '#007AFF' }}
        />

        <div className="flex items-center gap-6 mt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(0,122,255,0.5)' }}>Collected</p>
            <Money cents={totals.totalCollected} signed className="text-base font-medium" style={{ color: '#34C759', fontFamily: "'DM Mono', monospace" }} />
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(0,122,255,0.15)' }} />
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(0,122,255,0.5)' }}>People</p>
            <span className="text-base font-medium" style={{ color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}>
              {totals.outstandingCount}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs + Add */}
      <div className="flex items-center justify-between">
        <div
          className="flex rounded-lg p-0.5"
          style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}
        >
          <button
            onClick={() => setTab('outstanding')}
            className="px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: tab === 'outstanding' ? '#FFFFFF' : 'transparent',
              color: tab === 'outstanding' ? '#1D1D1F' : '#6E6E73',
              boxShadow: tab === 'outstanding' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Outstanding ({outstanding.length})
          </button>
          <button
            onClick={() => setTab('settled')}
            className="px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors"
            style={{
              backgroundColor: tab === 'settled' ? '#FFFFFF' : 'transparent',
              color: tab === 'settled' ? '#1D1D1F' : '#6E6E73',
              boxShadow: tab === 'settled' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            Settled ({settled.length})
          </button>
        </div>
        <AddButton isOpen={showAdd} onClick={() => setShowAdd(!showAdd)} label="Add person" />
      </div>

      {/* Add form */}
      {showAdd && (
        <div
          className="rounded-2xl p-5"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={e => { setName(e.target.value); setAddError('') }}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
              autoFocus
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="Amount owed"
              value={amountInput}
              onChange={e => { setAmountInput(e.target.value); setAddError('') }}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            />
          </div>
          <input
            type="text"
            placeholder="Reason (optional)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="w-full h-11 px-3 rounded-xl text-sm outline-none mb-3"
            style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
          />
          {addError && <p className="text-xs mb-2" style={{ color: '#FF3B30' }}>{addError}</p>}
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !amountInput.trim()}
            className="w-full h-11 rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#007AFF' }}
          >
            Add person
          </button>
        </div>
      )}

      {/* Debtor list */}
      {tab === 'outstanding' && outstanding.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-sm" style={{ color: '#6E6E73' }}>
            Nobody owes you right now. Add someone when they borrow money.
          </p>
        </div>
      )}

      {tab === 'settled' && settled.length === 0 && (
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm" style={{ color: '#6E6E73' }}>
            No settled debts yet.
          </p>
        </div>
      )}

      {(tab === 'outstanding' ? outstanding : settled).map((debtor, idx) => {
        const progress = selectDebtorProgress(state, debtor.id)
        const avatarColor = AVATAR_COLORS[idx % AVATAR_COLORS.length]!
        const isPaying = payingId === debtor.id

        return (
          <div
            key={debtor.id}
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                  style={{
                    backgroundColor: avatarColor,
                    opacity: debtor.settled ? 0.5 : 1,
                  }}
                >
                  {getInitials(debtor.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: '#1D1D1F' }}>{debtor.name}</span>
                    {debtor.settled ? (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{ backgroundColor: '#EAFAF0', color: '#34C759' }}
                      >
                        ✓ Settled
                      </span>
                    ) : (
                      <Money
                        cents={progress.remainingCents}
                        className="text-lg font-semibold"
                      />
                    )}
                  </div>

                  {/* Secondary info */}
                  <p className="text-xs mt-0.5" style={{ color: '#6E6E73' }}>
                    {debtor.reason ? `${debtor.reason} · ` : ''}{shortDate(debtor.date)}
                  </p>

                  {!debtor.settled && (
                    <p className="text-xs mt-0.5" style={{ color: '#6E6E73', fontFamily: "'DM Mono', monospace" }}>
                      of {fmt(debtor.amountCents)}
                    </p>
                  )}

                  {/* Progress bar */}
                  {!debtor.settled && (
                    <>
                      <div
                        className="mt-3 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(progress.percent, 100)}%`,
                            backgroundColor: '#007AFF',
                          }}
                        />
                      </div>
                      <p className="text-xs mt-1.5" style={{ color: '#6E6E73' }}>
                        {progress.paidCents > 0 ? (
                          <><span style={{ fontFamily: "'DM Mono', monospace" }}>{fmt(progress.paidCents)}</span> paid · {Math.round(progress.percent)}%</>
                        ) : (
                          'No payments yet'
                        )}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!debtor.settled && (
                <div className="flex gap-2 mt-4 ml-[52px]">
                  <button
                    onClick={() => setPayingId(isPaying ? null : debtor.id)}
                    className="px-3 h-9 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: '#EBF4FF', color: '#007AFF' }}
                  >
                    Record payment
                  </button>
                  <button
                    onClick={() => settleDebtor(debtor.id)}
                    className="px-3 h-9 rounded-xl text-sm font-medium cursor-pointer"
                    style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: '#1D1D1F' }}
                  >
                    Settle
                  </button>
                </div>
              )}

              {/* Delete / remove record */}
              {debtor.settled && (
                <div className="mt-3 ml-[52px]">
                  <button
                    onClick={() => removeDebtor(debtor.id)}
                    className="group px-3 h-8 rounded-lg text-xs font-medium cursor-pointer opacity-60 hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
                  >
                    Remove record
                  </button>
                </div>
              )}
            </div>

            {/* Payment panel */}
            {isPaying && (
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{
                  backgroundColor: '#EBF4FF',
                  borderTop: '1px solid rgba(0,122,255,0.1)',
                }}
              >
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder={`Max ${fmt(progress.remainingCents)}`}
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  onKeyDown={e => handlePayKeyDown(e, debtor.id)}
                  autoFocus
                  className="flex-1 h-10 px-3 rounded-xl text-sm outline-none"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid rgba(0,122,255,0.2)',
                    color: '#1D1D1F',
                    fontFamily: "'DM Mono', monospace",
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(0,122,255,0.2)' }}
                />
                <button
                  onClick={() => handlePay(debtor.id)}
                  disabled={!payAmount.trim()}
                  className="h-10 px-4 rounded-xl text-sm font-medium text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#007AFF' }}
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

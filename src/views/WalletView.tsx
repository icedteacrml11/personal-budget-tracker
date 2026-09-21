/**
 * WalletView — accounts & net worth.
 * Net worth hero, wallet cards, linked wallet, add/edit forms, allocation.
 */

import { useState, useMemo } from 'react'
import { useBudget, selectWalletView } from '../store'
import { Money } from '../components/Money'
import { AddButton } from '../components/AddButton'
import { toCents } from '../lib/money'
import type { WalletKind } from '../store/types'

const WALLET_GRADIENTS: Record<WalletKind, string> = {
  checking: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
  savings: 'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
  cash: 'linear-gradient(135deg, #34C759 0%, #30B0C7 100%)',
  investment: 'linear-gradient(135deg, #AF52DE 0%, #5856D6 100%)',
  credit: 'linear-gradient(135deg, #636366 0%, #8E8E93 100%)',
}

const WALLET_KINDS: { kind: WalletKind; label: string }[] = [
  { kind: 'checking', label: 'Checking' },
  { kind: 'savings', label: 'Savings' },
  { kind: 'cash', label: 'Cash' },
  { kind: 'investment', label: 'Investment' },
  { kind: 'credit', label: 'Credit' },
]

export function WalletView() {
  const { state, balanceCents, addWallet, updateWallet, removeWallet } = useBudget()
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Add form state
  const [newName, setNewName] = useState('')
  const [newKind, setNewKind] = useState<WalletKind>('savings')
  const [newInstitution, setNewInstitution] = useState('')
  const [newLast4, setNewLast4] = useState('')
  const [newBalance, setNewBalance] = useState('')
  const [addError, setAddError] = useState('')

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editInstitution, setEditInstitution] = useState('')
  const [editLast4, setEditLast4] = useState('')
  const [editBalance, setEditBalance] = useState('')

  const view = useMemo(() => selectWalletView(state, balanceCents), [state, balanceCents])

  const assetWallets = view.wallets.filter(w => w.balanceCents > 0)
  const totalAssets = assetWallets.reduce((sum, w) => sum + w.balanceCents, 0)

  const handleAdd = () => {
    if (!newName.trim()) { setAddError('Enter a name.'); return }
    const cents = toCents(newBalance)
    if (!cents && newBalance.trim() !== '0') { setAddError('Enter a valid balance.'); return }

    const balanceCentsVal = cents ?? 0
    addWallet({
      kind: newKind,
      name: newName.trim(),
      institution: newInstitution.trim(),
      last4: newLast4.trim() || undefined,
      balanceCents: newKind === 'credit' ? -Math.abs(balanceCentsVal) : balanceCentsVal,
    })
    setNewName(''); setNewKind('savings'); setNewInstitution(''); setNewLast4(''); setNewBalance('')
    setAddError('')
    setShowAdd(false)
  }

  const handleSelect = (id: string) => {
    const wallet = state.wallets.find(w => w.id === id)
    if (!wallet || wallet.linked) {
      setSelectedId(selectedId === id ? null : id)
      return
    }
    if (selectedId === id) {
      setSelectedId(null)
      return
    }
    setSelectedId(id)
    setEditName(wallet.name)
    setEditInstitution(wallet.institution)
    setEditLast4(wallet.last4 ?? '')
    setEditBalance((Math.abs(wallet.balanceCents) / 100).toFixed(2))
  }

  const handleSaveEdit = () => {
    if (!selectedId) return
    const wallet = state.wallets.find(w => w.id === selectedId)
    if (!wallet || wallet.linked) return

    const cents = toCents(editBalance)
    const balanceVal = cents ?? 0

    updateWallet(selectedId, {
      name: editName.trim() || wallet.name,
      institution: editInstitution.trim(),
      last4: editLast4.trim() || undefined,
      balanceCents: wallet.kind === 'credit' ? -Math.abs(balanceVal) : balanceVal,
    })
    setSelectedId(null)
  }

  const handleDelete = (id: string) => {
    removeWallet(id)
    setSelectedId(null)
  }

  return (
    <div className="space-y-6">
      {/* Net worth hero */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1D1D1F 0%, #3A3A3C 100%)',
        }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -right-16 -top-16 w-48 h-48 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        />
        <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Net Worth
        </p>
        <Money cents={view.netWorth} className="text-4xl sm:text-5xl font-medium text-white" />

        <div className="flex items-center gap-6 mt-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Assets</p>
            <Money cents={view.assets} signed className="text-base font-medium" style={{ color: '#34C759', fontFamily: "'DM Mono', monospace" }} />
          </div>
          <div style={{ width: '1px', height: '28px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <div>
            <p className="text-[11px] uppercase tracking-wide mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Liabilities</p>
            <Money cents={-view.liabilities} className="text-base font-medium" style={{ color: '#FF3B30', fontFamily: "'DM Mono', monospace" }} />
          </div>
        </div>
      </div>

      {/* Wallet cards header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: '#6E6E73' }}>
          Accounts
        </p>
        <AddButton isOpen={showAdd} onClick={() => setShowAdd(!showAdd)} label="Add wallet" />
      </div>

      {/* Add wallet form */}
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
              placeholder="Account name"
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddError('') }}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            />
            <select
              value={newKind}
              onChange={e => setNewKind(e.target.value as WalletKind)}
              className="h-11 px-3 rounded-xl text-sm outline-none cursor-pointer"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
            >
              {WALLET_KINDS.map(w => (
                <option key={w.kind} value={w.kind}>{w.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Institution"
              value={newInstitution}
              onChange={e => setNewInstitution(e.target.value)}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            />
            <input
              type="text"
              placeholder="Last 4 digits"
              maxLength={4}
              value={newLast4}
              onChange={e => setNewLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder={newKind === 'credit' ? 'Outstanding amount' : 'Balance'}
              value={newBalance}
              onChange={e => { setNewBalance(e.target.value); setAddError('') }}
              className="h-11 px-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
              onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
            />
          </div>
          {addError && <p className="text-xs mb-2" style={{ color: '#FF3B30' }}>{addError}</p>}
          <button
            onClick={handleAdd}
            className="w-full h-11 rounded-xl text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: '#007AFF' }}
          >
            Add account
          </button>
        </div>
      )}

      {/* Wallet cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {view.wallets.map(wallet => {
          const isSelected = selectedId === wallet.id
          const isLinked = wallet.linked
          return (
            <div key={wallet.id}>
              <button
                onClick={() => handleSelect(wallet.id)}
                className="w-full text-left rounded-2xl p-5 transition-transform cursor-pointer"
                style={{
                  background: WALLET_GRADIENTS[wallet.kind as WalletKind] ?? WALLET_GRADIENTS.checking,
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected
                    ? '0 8px 32px rgba(0,122,255,0.2), 0 2px 8px rgba(0,0,0,0.1)'
                    : '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {wallet.kind}{wallet.institution ? ` · ${wallet.institution}` : ''}
                  </span>
                  {isLinked && (
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ backgroundColor: 'rgba(52,199,89,0.3)', color: '#34C759' }}
                    >
                      Live
                    </span>
                  )}
                </div>
                <p className="text-base font-medium text-white mb-1">{wallet.name}</p>
                {wallet.last4 && (
                  <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace" }}>
                    ···· {wallet.last4}
                  </p>
                )}
                <Money
                  cents={wallet.balanceCents}
                  className="text-2xl font-medium text-white"
                />
                {isLinked && (
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Synced with Available Balance
                  </p>
                )}
                {wallet.balanceCents < 0 && (
                  <p className="text-[11px] mt-1" style={{ color: 'rgba(255,59,48,0.8)' }}>
                    Outstanding balance
                  </p>
                )}
              </button>

              {/* Edit panel for manual wallets */}
              {isSelected && !isLinked && (
                <div
                  className="mt-2 rounded-2xl p-4"
                  style={{
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
                  }}
                >
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Name"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="h-10 px-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
                    />
                    <input
                      type="text"
                      placeholder="Institution"
                      value={editInstitution}
                      onChange={e => setEditInstitution(e.target.value)}
                      className="h-10 px-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F' }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Last 4"
                      maxLength={4}
                      value={editLast4}
                      onChange={e => setEditLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="h-10 px-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Balance"
                      value={editBalance}
                      onChange={e => setEditBalance(e.target.value)}
                      className="h-10 px-3 rounded-xl text-sm outline-none"
                      style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1.5px solid transparent', color: '#1D1D1F', fontFamily: "'DM Mono', monospace" }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#007AFF' }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'transparent' }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveEdit}
                      className="flex-1 h-10 rounded-xl text-sm font-medium text-white cursor-pointer"
                      style={{ backgroundColor: '#007AFF' }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => handleDelete(wallet.id)}
                      className="h-10 px-4 rounded-xl text-sm font-medium cursor-pointer"
                      style={{ backgroundColor: 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Allocation card */}
      {assetWallets.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#6E6E73' }}>
            Allocation
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
            }}
          >
            {assetWallets.map((w, i) => {
              const pct = totalAssets > 0 ? Math.round((w.balanceCents / totalAssets) * 100) : 0
              const kind = w.kind as WalletKind
              const colors: Record<WalletKind, string> = {
                checking: '#1D1D1F',
                savings: '#007AFF',
                cash: '#34C759',
                investment: '#AF52DE',
                credit: '#636366',
              }
              return (
                <div
                  key={w.id}
                  className="flex items-center px-4 py-3"
                  style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.06)' } : {}}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: colors[kind] ?? '#8E8E93' }}
                  />
                  <span className="ml-3 text-sm flex-1" style={{ color: '#1D1D1F' }}>{w.name}</span>
                  <Money cents={w.balanceCents} className="text-sm mr-3" />
                  <span className="text-xs w-8 text-right" style={{ color: '#6E6E73', fontFamily: "'DM Mono', monospace" }}>
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useBudget, P, fmt } from '../store'

/* ── Types ────────────────────────────────────────────────── */

import { type WalletAccount } from '../store'

const kindLabels: Record<string, string> = {
  checking: 'Checking', savings: 'Savings', cash: 'Cash',
  investment: 'Investment', credit: 'Credit',
}

/* ── Component ────────────────────────────────────────────── */

export function WalletView() {
  const { wallets, updateWallet } = useBudget()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const assets = wallets.filter(w => w.balance >= 0).reduce((s, w) => s + w.balance, 0)
  const liabilities = wallets.filter(w => w.balance < 0).reduce((s, w) => s + Math.abs(w.balance), 0)
  const netWorth = assets - liabilities

  function startEdit(w: WalletAccount) {
    setEditingId(w.id)
    setEditValue(String(Math.abs(w.balance)))
  }

  function saveEdit(w: WalletAccount) {
    const n = parseFloat(editValue)
    if (isNaN(n) || n < 0) { setEditingId(null); return }
    const newBal = w.kind === 'credit' ? -n : n
    updateWallet(w.id, Math.round(newBal * 100) / 100)
    setEditingId(null)
  }

  function cancelEdit() { setEditingId(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Net worth hero ────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1F2024, #35363B)',
          borderRadius: 20, padding: '32px 28px',
          boxShadow: P.shadowMd, position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Subtle radial accent */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
        }} />
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: 500 }}>
          NET WORTH
        </div>
        <div className="mono" style={{
          fontSize: 40, fontWeight: 500,
          color: netWorth < 0 ? '#FF7A6E' : '#fff',
          lineHeight: 1.1, marginBottom: 20,
        }}>
          {netWorth < 0 ? '\u2212' : ''}{fmt(Math.abs(netWorth)).replace(/^-/, '')}
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Assets</div>
            <div className="mono" style={{ fontSize: 18, color: '#3DDC97', fontWeight: 500 }}>
              +{fmt(assets)}
            </div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', alignSelf: 'stretch' }} />
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>Liabilities</div>
            <div className="mono" style={{ fontSize: 18, color: '#FF7A6E', fontWeight: 500 }}>
              {'\u2212'}{fmt(liabilities)}
            </div>
          </div>
        </div>
      </div>

      {/* ── Wallet cards ──────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {wallets.map(w => {
          const isExpanded = expandedId === w.id
          const isEditing = editingId === w.id
          const isCredit = w.kind === 'credit'

          return (
            <div key={w.id}>
              {/* Card */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
                style={{
                  background: w.gradient,
                  borderRadius: isExpanded ? '16px 16px 0 0' : 16,
                  padding: '22px 24px',
                  cursor: 'pointer',
                  boxShadow: P.shadowSm,
                  transition: 'border-radius 0.2s',
                }}
              >
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>
                  {kindLabels[w.kind]} {w.institution ? `· ${w.institution}` : ''}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                  {w.name}
                </div>
                {w.last4 && (
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
                    ···· {w.last4}
                  </div>
                )}
                <div className="mono" style={{ fontSize: 28, fontWeight: 500, color: '#fff', lineHeight: 1.2 }}>
                  {isCredit ? `\u2212${fmt(Math.abs(w.balance))}` : fmt(w.balance)}
                </div>
                {isCredit && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
                    Outstanding balance
                  </div>
                )}
              </div>

              {/* Expanded edit panel */}
              {isExpanded && (
                <div style={{
                  background: P.card, borderRadius: '0 0 16px 16px',
                  padding: '18px 24px',
                  borderTop: `1px solid ${P.hair}`,
                  boxShadow: P.shadowSm,
                }}>
                  {!isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 12, color: P.tertiary }}>Current balance</div>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: isCredit ? P.red.text : P.ink }}>
                          {isCredit ? `\u2212${fmt(Math.abs(w.balance))}` : fmt(w.balance)}
                        </div>
                      </div>
                      <button onClick={() => startEdit(w)} style={softBlueBtnStyle}>
                        Edit balance
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: P.secondary, fontSize: 16 }}>$</span>
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(w)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        className="mono"
                        style={{ ...inputStyle, flex: 1 }}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(w)} style={softBlueBtnStyle}>Save</button>
                      <button onClick={cancelEdit} style={softGrayBtnStyle}>Cancel</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Allocation card ───────────────────────────────── */}
      <div>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: P.tertiary, marginBottom: 12, fontWeight: 500, padding: '0 4px' }}>
          ALLOCATION
        </div>
        <div style={{ background: P.card, borderRadius: 16, boxShadow: P.shadowSm, overflow: 'hidden' }}>
          {wallets.map((w, i) => {
            const isLiability = w.balance < 0
            const pct = assets > 0 && !isLiability ? ((w.balance / assets) * 100).toFixed(1) : null
            const dotColor = w.gradient.match(/#[0-9A-Fa-f]{6}/)?.[0] ?? P.secondary

            return (
              <div
                key={w.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 18px',
                  borderTop: i > 0 ? `1px solid ${P.hair}` : 'none',
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 5, background: dotColor, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: P.ink }}>{w.name}</span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: isLiability ? P.red.text : P.ink, width: 100, textAlign: 'right' }}>
                  {isLiability ? `\u2212${fmt(Math.abs(w.balance))}` : fmt(w.balance)}
                </span>
                <span className="mono" style={{ fontSize: 13, color: P.tertiary, width: 52, textAlign: 'right' }}>
                  {pct !== null ? `${pct}%` : '\u2014'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Shared styles ─────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  padding: '10px 14px', fontSize: 15,
  background: 'rgba(0,0,0,0.035)', borderRadius: 12,
  border: '1.5px solid transparent', outline: 'none',
  color: P.ink, fontFamily: 'inherit',
}

const softBlueBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 10,
  background: P.blue.soft, color: P.blue.text,
  border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
}

const softGrayBtnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 10,
  background: 'rgba(0,0,0,0.05)', color: P.secondary,
  border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
}

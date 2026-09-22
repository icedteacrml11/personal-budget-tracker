import { useState, useMemo } from 'react'
import { useBudget, P, fmt } from '../store'

/* ── Component ────────────────────────────────────────────── */

export function PeopleView() {
  const { debtors, addDebtor, recordRepayment, settleDebtor, removeDebtor } = useBudget()
  const [tab, setTab] = useState<'outstanding' | 'settled'>('outstanding')
  const [showAdd, setShowAdd] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Add form
  const [addName, setAddName] = useState('')
  const [addAmount, setAddAmount] = useState('')
  const [addReason, setAddReason] = useState('')

  // Payment input per debtor
  const [payInputId, setPayInputId] = useState<string | null>(null)
  const [payValue, setPayValue] = useState('')

  const outstanding = useMemo(() => debtors.filter(d => !d.settled), [debtors])
  const settled = useMemo(() => debtors.filter(d => d.settled), [debtors])

  const totalOwed = outstanding.reduce((s, d) => s + d.totalAmount - d.amountPaid, 0)
  const totalCollected = debtors.reduce((s, d) => s + d.amountPaid, 0)

  function handleAddPerson() {
    const amt = parseFloat(addAmount)
    if (!addName.trim() || !amt || amt <= 0) return
    addDebtor({
      name: addName.trim(),
      totalAmount: Math.round(amt * 100) / 100,
      amountPaid: 0,
      reason: addReason.trim() || 'No reason',
      date: new Date().toISOString().slice(0, 10),
      settled: false,
    })
    setAddName(''); setAddAmount(''); setAddReason(''); setShowAdd(false)
  }

  function recordPayment(debtorId: string) {
    const n = parseFloat(payValue)
    if (!n || n <= 0) return
    recordRepayment(debtorId, n)
    setPayInputId(null); setPayValue('')
  }

  const visibleList = tab === 'outstanding' ? outstanding : settled

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Hero ──────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #EAF1FE, #DCE9FF)',
          borderRadius: 20, padding: '28px 24px',
          boxShadow: P.shadowSm,
        }}
      >
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: P.blue.text, fontWeight: 500, marginBottom: 8 }}>
          STILL OWED TO YOU
        </div>
        <div className="mono" style={{ fontSize: 36, fontWeight: 500, color: P.blue.text, lineHeight: 1.1, marginBottom: 12 }}>
          {fmt(totalOwed)}
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
          <span style={{ color: P.green.text }}>
            Collected so far <span className="mono" style={{ fontWeight: 600 }}>+{fmt(totalCollected)}</span>
          </span>
          <span style={{ color: P.secondary }}>
            {outstanding.length} people outstanding
          </span>
        </div>
      </div>

      {/* ── Tabs + add button ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Segmented control */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.04)', borderRadius: 10, padding: 3, flex: 1,
        }}>
          {(['outstanding', 'settled'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                background: tab === t ? P.card : 'transparent',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t ? 600 : 400,
                color: tab === t ? P.ink : P.secondary,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {t === 'outstanding' ? `Outstanding (${outstanding.length})` : `Settled (${settled.length})`}
            </button>
          ))}
        </div>
        {/* Add button */}
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{
            width: 38, height: 38, borderRadius: 19,
            background: P.blue.solid, border: 'none', cursor: 'pointer',
            color: '#fff', fontSize: 22, fontWeight: 300,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(10,108,255,0.25)',
            transition: 'transform 0.2s',
            transform: showAdd ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </button>
      </div>

      {/* ── Add person form ───────────────────────────────── */}
      {showAdd && (
        <div style={{ background: P.card, borderRadius: 24, padding: 24, boxShadow: P.shadowMd }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input type="text" placeholder="Name" value={addName} onChange={e => setAddName(e.target.value)} style={inputStyle} autoFocus />
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: P.secondary }}>$</span>
              <input
                type="number" placeholder="Amount owed"
                value={addAmount} onChange={e => setAddAmount(e.target.value)}
                className="mono"
                style={{ ...inputStyle, paddingLeft: 32 }}
              />
            </div>
            <input type="text" placeholder="Reason" value={addReason} onChange={e => setAddReason(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAddPerson} style={blueBtnStyle}>Add person</button>
              <button onClick={() => setShowAdd(false)} style={grayBtnStyle}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Debtor list ───────────────────────────────────── */}
      {visibleList.length === 0 ? (
        <div style={{ background: P.card, borderRadius: 16, boxShadow: P.shadowSm, padding: 32, textAlign: 'center', color: P.tertiary, fontSize: 14 }}>
          {tab === 'outstanding' ? 'No one owes you right now' : 'No settled debts'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visibleList.map(d => {
            const remaining = d.totalAmount - d.amountPaid
            const pct = d.totalAmount > 0 ? (d.amountPaid / d.totalAmount) * 100 : 0
            const isPayOpen = payInputId === d.id
            const isHovered = hoveredId === d.id
            const dateObj = new Date(d.date + 'T00:00:00')
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            return (
              <div
                key={d.id}
                style={{ background: P.card, borderRadius: 16, boxShadow: P.shadowSm, padding: '18px 20px' }}
                onMouseEnter={() => setHoveredId(d.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 21,
                    background: d.settled ? P.green.soft : d.avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: d.settled ? P.green.text : '#fff',
                    fontWeight: 600, fontSize: 15, flexShrink: 0,
                  }}>
                    {d.settled ? '✓' : d.initials}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: P.ink }}>{d.name}</div>
                    <div style={{ fontSize: 12, color: P.tertiary }}>{d.reason} · {dateStr}</div>
                  </div>
                  {/* Amounts */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {d.settled ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: P.green.text, fontSize: 13, fontWeight: 600 }}>Settled</span>
                        {isHovered && (
                          <button onClick={() => removeDebtor(d.id)} style={removeBtnStyle}>
                            Remove
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: P.ink }}>
                          {fmt(remaining)}
                        </div>
                        <div style={{ fontSize: 12, color: P.tertiary }}>
                          of {fmt(d.totalAmount)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress + actions (outstanding only) */}
                {!d.settled && (
                  <div style={{ marginTop: 14 }}>
                    {/* Progress bar */}
                    <div style={{ height: 6, borderRadius: 3, background: P.blue.soft, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        background: P.blue.solid,
                        width: `${pct}%`,
                        transition: 'width 0.3s',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span className="mono" style={{ fontSize: 12, color: P.tertiary }}>
                        {fmt(d.amountPaid)} paid · {Math.round(pct)}%
                      </span>
                    </div>

                    {/* Actions */}
                    {isPayOpen ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ color: P.secondary, fontSize: 14 }}>$</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={payValue}
                          onChange={e => setPayValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') recordPayment(d.id)
                            if (e.key === 'Escape') setPayInputId(null)
                          }}
                          className="mono"
                          style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 14 }}
                          autoFocus
                        />
                        <button onClick={() => recordPayment(d.id)} style={softBlueBtnStyle}>Record</button>
                        <button onClick={() => setPayInputId(null)} style={softGrayBtnStyle}>Cancel</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => { setPayInputId(d.id); setPayValue('') }}
                          style={softBlueBtnStyle}
                        >
                          Record payment
                        </button>
                        <button
                          onClick={() => settleDebtor(d.id)}
                          style={softGreenBtnStyle}
                          onMouseEnter={e => (e.currentTarget.style.background = P.green.solid, e.currentTarget.style.color = '#fff')}
                          onMouseLeave={e => (e.currentTarget.style.background = P.green.soft, e.currentTarget.style.color = P.green.text)}
                        >
                          Settle
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Shared styles ─────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  background: 'rgba(0,0,0,0.035)', borderRadius: 12,
  border: '1.5px solid transparent', outline: 'none',
  color: P.ink, fontFamily: 'inherit',
}

const blueBtnStyle: React.CSSProperties = {
  flex: 1, padding: '12px 0', borderRadius: 12,
  background: P.blue.solid, color: '#fff',
  border: 'none', cursor: 'pointer',
  fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
}

const grayBtnStyle: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 12,
  background: 'rgba(0,0,0,0.05)', color: P.secondary,
  border: 'none', cursor: 'pointer',
  fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
}

const softBlueBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10,
  background: P.blue.soft, color: P.blue.text,
  border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  transition: 'background 0.15s',
}

const softGreenBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10,
  background: P.green.soft, color: P.green.text,
  border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  transition: 'background 0.15s, color 0.15s',
}

const softGrayBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 10,
  background: 'rgba(0,0,0,0.05)', color: P.secondary,
  border: 'none', cursor: 'pointer',
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
}

const removeBtnStyle: React.CSSProperties = {
  padding: '4px 10px', borderRadius: 8,
  background: 'rgba(0,0,0,0.04)', color: P.tertiary,
  border: 'none', cursor: 'pointer',
  fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
}

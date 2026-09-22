import { useState, useMemo } from 'react'
import { useBudget, P, fmt, fmtShort, catMeta, INCOME_CATEGORIES } from '../store'

/* ── helpers ──────────────────────────────────────────────── */

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/* ── component ────────────────────────────────────────────── */

export function HomeView() {
  const { transactions, balance, addTransaction } = useBudget()
  const now = new Date()
  const [selYear] = useState(2026)
  const [selMonth, setSelMonth] = useState(now.getMonth()) // 0-indexed
  const [showAdd, setShowAdd] = useState(false)

  // Form
  const [addAmt, setAddAmt] = useState('')
  const [addSource, setAddSource] = useState(Object.keys(INCOME_CATEGORIES)[0]!)
  const [addNote, setAddNote] = useState('')

  const mk = monthKey(selYear, selMonth)

  // Filter transactions for selected month
  const monthTxs = useMemo(() =>
    transactions.filter(tx => tx.date.startsWith(mk)),
    [transactions, mk]
  )

  const income = useMemo(() => monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxs])
  const spent  = useMemo(() => monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxs])
  const net = income - spent

  // Category breakdown
  const breakdown = useMemo(() => {
    const map = new Map<string, number>()
    let total = 0
    for (const tx of monthTxs) {
      if (tx.type === 'expense') {
        map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount)
        total += tx.amount
      }
    }
    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount, percent: total > 0 ? (amount / total) * 100 : 0 }))
      .sort((a, b) => b.amount - a.amount)
  }, [monthTxs])

  const totalSpent = breakdown.reduce((s, b) => s + b.amount, 0)

  function handleAdd() {
    const n = parseFloat(addAmt)
    if (!n || n <= 0) return
    addTransaction({
      type: 'income',
      amount: Math.round(n * 100) / 100,
      label: addNote.trim() || addSource,
      category: addSource,
      date: new Date().toISOString().slice(0, 10),
    })
    setAddAmt(''); setAddNote(''); setShowAdd(false)
    // Jump to current month
    setSelMonth(new Date().getMonth())
  }

  const saveRate = income > 0 ? Math.round((net / income) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Month picker ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <button
          onClick={() => setSelMonth(m => m === 0 ? 11 : m - 1)}
          style={ghostBtn}
        >
          ‹
        </button>
        <span style={{ fontSize: 16, fontWeight: 500, color: P.ink, minWidth: 180, textAlign: 'center' }}>
          {MONTHS[selMonth]} {selYear}
        </span>
        <button
          onClick={() => setSelMonth(m => m === 11 ? 0 : m + 1)}
          style={ghostBtn}
        >
          ›
        </button>
      </div>

      {/* ── Balance headline ──────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
        <div style={sectionLabel}>AVAILABLE BALANCE</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <span
            className="mono"
            style={{
              fontSize: 52, fontWeight: 500,
              color: balance < 0 ? P.red.text : P.ink,
              lineHeight: 1.1,
            }}
          >
            {fmt(balance)}
          </span>
          <button
            onClick={() => setShowAdd(v => !v)}
            style={{
              width: 44, height: 44, borderRadius: 22,
              background: P.blue.solid, border: 'none', cursor: 'pointer',
              color: '#fff', fontSize: 24, fontWeight: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(10,108,255,0.25)',
              transition: 'transform 0.2s, background 0.15s',
              transform: showAdd ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = P.blue.hover)}
            onMouseLeave={e => (e.currentTarget.style.background = P.blue.solid)}
          >
            +
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 14, color: net >= 0 ? P.green.text : P.red.text, fontWeight: 500 }}>
          {net >= 0 ? '+' : '\u2212'}
          {fmt(Math.abs(net)).replace('$', '$')} net in {MONTHS[selMonth]}
        </div>
      </div>

      {/* ── Add money form ────────────────────────────────── */}
      {showAdd && (
        <div style={{ ...cardStyle, borderRadius: 24, padding: 24, boxShadow: P.shadowMd }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Amount */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: P.secondary, fontSize: 16 }}>$</span>
              <input
                type="number"
                placeholder="0.00"
                value={addAmt}
                onChange={e => setAddAmt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="mono"
                style={{ ...inputStyle, paddingLeft: 32 }}
                autoFocus
              />
            </div>
            {/* Source */}
            <select
              value={addSource}
              onChange={e => setAddSource(e.target.value)}
              style={inputStyle}
            >
              {Object.keys(INCOME_CATEGORIES).map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
            {/* Note */}
            <input
              type="text"
              placeholder="Note (optional)"
              value={addNote}
              onChange={e => setAddNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={inputStyle}
            />
            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAdd} style={greenBtnStyle}>
                Add to balance
              </button>
              <button
                onClick={() => setShowAdd(false)}
                style={{ ...grayBtnStyle }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats strip ───────────────────────────────────── */}
      <div style={{ ...cardStyle, borderRadius: 16, display: 'flex', padding: 0 }}>
        <StatCell label="Income" value={fmtShort(income)} color={P.green.text} />
        <div style={{ width: 1, background: P.hair, alignSelf: 'stretch' }} />
        <StatCell label="Spent" value={fmtShort(spent)} color={P.red.text} />
        <div style={{ width: 1, background: P.hair, alignSelf: 'stretch' }} />
        <StatCell label="Net" value={fmtShort(net)} color={net < 0 ? P.red.text : P.ink} />
      </div>

      {/* ── Spending breakdown ────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
          <span style={sectionLabel}>WHERE IT WENT</span>
          <span className="mono" style={{ fontSize: 13, color: P.secondary, fontWeight: 500 }}>{fmt(totalSpent)}</span>
        </div>

        {breakdown.length === 0 ? (
          <div style={{ ...cardStyle, borderRadius: 16, padding: 32, textAlign: 'center', color: P.tertiary, fontSize: 14 }}>
            No spending this month
          </div>
        ) : (
          <>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
              {breakdown.map(b => (
                <div
                  key={b.category}
                  style={{
                    width: `${b.percent}%`,
                    background: catMeta('expense', b.category).color,
                    transition: 'width 0.3s',
                  }}
                />
              ))}
            </div>

            {/* Category rows */}
            <div style={{ ...cardStyle, borderRadius: 16, padding: 0, overflow: 'hidden' }}>
              {breakdown.map((b, i) => {
                const meta = catMeta('expense', b.category)
                return (
                  <div
                    key={b.category}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 18px',
                      borderTop: i > 0 ? `1px solid ${P.hair}` : 'none',
                      position: 'relative',
                    }}
                  >
                    {/* Tinted fill bar */}
                    <div
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        width: `${b.percent}%`,
                        background: meta.color,
                        opacity: 0.07,
                        transition: 'width 0.3s',
                      }}
                    />
                    {/* Dot */}
                    <div style={{ width: 10, height: 10, borderRadius: 5, background: meta.color, flexShrink: 0, zIndex: 1 }} />
                    {/* Name */}
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: P.ink, zIndex: 1 }}>{b.category}</span>
                    {/* Percent */}
                    <span className="mono" style={{ fontSize: 13, color: P.tertiary, width: 48, textAlign: 'right', zIndex: 1 }}>
                      {Math.round(b.percent)}%
                    </span>
                    {/* Amount */}
                    <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: P.ink, width: 90, textAlign: 'right', zIndex: 1 }}>
                      {fmt(b.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Save rate */}
        {income > 0 && (
          <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: P.tertiary }}>
            Save rate this month: <span style={{ fontWeight: 600, color: saveRate >= 0 ? P.green.text : P.red.text }}>{saveRate}%</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ────────────────────────────────────────── */

function StatCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ flex: 1, padding: '18px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 12, color: P.tertiary, marginBottom: 4, fontWeight: 500 }}>{label}</div>
      <div className="mono" style={{ fontSize: 20, fontWeight: 500, color }}>{value}</div>
    </div>
  )
}

/* ── Shared styles ─────────────────────────────────────────── */

const sectionLabel: React.CSSProperties = {
  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
  color: P.tertiary, fontWeight: 500,
}

const cardStyle: React.CSSProperties = {
  background: P.card,
  borderRadius: 16,
  boxShadow: P.shadowSm,
  padding: 20,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  background: 'rgba(0,0,0,0.035)', borderRadius: 12,
  border: '1.5px solid transparent', outline: 'none',
  color: P.ink, fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

const ghostBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 18,
  border: 'none', background: 'transparent', cursor: 'pointer',
  fontSize: 20, color: P.secondary, display: 'flex',
  alignItems: 'center', justifyContent: 'center',
  fontFamily: 'inherit',
  transition: 'background 0.15s',
}

const greenBtnStyle: React.CSSProperties = {
  flex: 1, padding: '12px 0', borderRadius: 12,
  background: P.green.solid, color: '#fff',
  border: 'none', cursor: 'pointer',
  fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
  transition: 'background 0.15s',
}

const grayBtnStyle: React.CSSProperties = {
  padding: '12px 20px', borderRadius: 12,
  background: 'rgba(0,0,0,0.05)', color: P.secondary,
  border: 'none', cursor: 'pointer',
  fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
  transition: 'background 0.15s',
}

// Focus style for inputs via CSS — applied globally in index.css

import { useState, useMemo } from 'react'
import { useBudget, P, fmt, catMeta, EXPENSE_CATEGORIES, type BillDef } from '../store'

/* ── Component ────────────────────────────────────────────── */

export function ExpensesView() {
  const { transactions, balance, bills, billPayments, addTransaction, removeTransaction, toggleBillPaid } = useBudget()

  // Expense form
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState(Object.keys(EXPENSE_CATEGORIES)[0]!)
  const [amount, setAmount] = useState('')

  const currentMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])

  // Hover
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const expenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  )

  function handleAdd() {
    const n = parseFloat(amount)
    if (!n || n <= 0 || !label.trim()) return
    addTransaction({
      type: 'expense',
      amount: Math.round(n * 100) / 100,
      label: label.trim(),
      category,
      date: new Date().toISOString().slice(0, 10),
    })
    setLabel(''); setAmount('')
  }

  function toggleBill(bill: BillDef) {
    toggleBillPaid(bill.id, currentMonth)
  }

  const isBillPaid = (billId: string) => billPayments.some(bp => bp.billId === billId && bp.month === currentMonth)
  const paidTotal = bills.filter(b => isBillPaid(b.id)).reduce((s, b) => s + b.amount, 0)
  const dueTotal = bills.filter(b => !isBillPaid(b.id)).reduce((s, b) => s + b.amount, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Balance banner ────────────────────────────────── */}
      <div style={{ textAlign: 'center' }}>
        <div style={sectionLabel}>BALANCE AFTER SPENDING</div>
        <div className="mono" style={{
          fontSize: 32, fontWeight: 500,
          color: balance < 0 ? P.red.text : P.ink,
          lineHeight: 1.2,
        }}>
          {fmt(balance)}
        </div>
      </div>

      {/* ── Log an expense ────────────────────────────────── */}
      <div style={{ background: P.card, borderRadius: 24, padding: 24, boxShadow: P.shadowMd }}>
        <div style={{ ...sectionLabel, marginBottom: 14 }}>LOG AN EXPENSE</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="text"
            placeholder="What was it?"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={inputStyle}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={inputStyle}
          >
            {Object.keys(EXPENSE_CATEGORIES).map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: P.secondary }}>$</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="mono"
              style={{ ...inputStyle, paddingLeft: 32 }}
            />
          </div>
          <button onClick={handleAdd} style={blueBtnStyle}>Add</button>
        </div>
      </div>

      {/* ── Spending history ──────────────────────────────── */}
      <div>
        <div style={{ ...sectionLabel, marginBottom: 12, padding: '0 4px' }}>SPENDING HISTORY</div>
        {expenses.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: P.tertiary, fontSize: 14, padding: 32 }}>
            No expenses yet
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            {expenses.map((tx, i) => {
              const meta = catMeta('expense', tx.category)
              const isHovered = hoveredRow === tx.id
              const dateObj = new Date(tx.date + 'T00:00:00')
              const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 18px',
                    borderTop: i > 0 ? `1px solid ${P.hair}` : 'none',
                    position: 'relative',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={() => setHoveredRow(tx.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {/* Emoji swatch */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${meta.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {meta.emoji}
                  </div>

                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: P.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tx.label}
                    </div>
                    <div style={{ fontSize: 12, color: P.tertiary }}>{dateStr}</div>
                  </div>

                  {/* Category tag (hidden on small) */}
                  <span
                    className="hidden md:inline-block"
                    style={{
                      fontSize: 11, fontWeight: 600,
                      color: meta.color,
                      background: `${meta.color}12`,
                      padding: '3px 8px', borderRadius: 6,
                    }}
                  >
                    {tx.category}
                  </span>

                  {/* Amount */}
                  <span className="mono" style={{ fontSize: 14, fontWeight: 500, color: P.red.text, width: 90, textAlign: 'right', flexShrink: 0 }}>
                    {'\u2212'}{fmt(tx.amount)}
                  </span>

                  {/* Delete (hover) */}
                  {isHovered && (
                    <button
                      onClick={() => removeTransaction(tx.id)}
                      style={{
                        position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                        width: 28, height: 28, borderRadius: 14,
                        background: P.red.soft, border: 'none', cursor: 'pointer',
                        color: P.red.text, fontSize: 14, fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bills & subscriptions ─────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
          <span style={sectionLabel}>BILLS & SUBSCRIPTIONS</span>
          <span className="mono" style={{ fontSize: 12, color: P.secondary }}>
            {fmt(paidTotal)} paid · {fmt(dueTotal)} due
          </span>
        </div>
        <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          {bills.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: P.tertiary, fontSize: 14 }}>
              No bills scheduled
            </div>
          )}
          {bills.map((bill, i) => {
            const isPaid = isBillPaid(bill.id)
            return (
              <div
                key={bill.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px',
                  borderTop: i > 0 ? `1px solid ${P.hair}` : 'none',
                  opacity: isPaid ? 0.55 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                {/* Circular checkbox */}
                <button
                  onClick={() => toggleBill(bill)}
                  style={{
                    width: 24, height: 24, borderRadius: 12,
                    border: isPaid ? 'none' : `2px solid ${P.hair}`,
                    background: isPaid ? P.green.solid : 'transparent',
                    cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontSize: 14,
                    transition: 'background 0.15s, border-color 0.15s',
                  }}
                >
                  {isPaid && '✓'}
                </button>
                {/* Name */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 500, color: P.ink,
                    textDecoration: isPaid ? 'line-through' : 'none',
                  }}>
                    {bill.name}
                  </div>
                  <div style={{ fontSize: 12, color: P.tertiary }}>
                    {isPaid ? 'Paid this month' : `Due on the ${bill.dueDay}${bill.dueDay === 1 ? 'st' : bill.dueDay === 2 ? 'nd' : bill.dueDay === 3 ? 'rd' : 'th'} / monthly`}
                  </div>
                </div>
                {/* Amount — muted gray when paid (money out, never green) */}
                <span className="mono" style={{
                  fontSize: 14, fontWeight: 500,
                  color: isPaid ? P.tertiary : P.ink,
                  width: 80, textAlign: 'right',
                }}>
                  {fmt(bill.amount)}
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

const sectionLabel: React.CSSProperties = {
  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
  color: P.tertiary, fontWeight: 500,
}

const cardStyle: React.CSSProperties = {
  background: P.card, borderRadius: 16,
  boxShadow: P.shadowSm, padding: 20,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', fontSize: 15,
  background: 'rgba(0,0,0,0.035)', borderRadius: 12,
  border: '1.5px solid transparent', outline: 'none',
  color: P.ink, fontFamily: 'inherit',
}

const blueBtnStyle: React.CSSProperties = {
  padding: '12px 0', borderRadius: 12,
  background: P.blue.solid, color: '#fff',
  border: 'none', cursor: 'pointer',
  fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
}

/**
 * DateChip — compact "Today ▾" button that reveals a native date input.
 * max = today (no future dates).
 */

import { useRef } from 'react'
import { todayStr, shortDate } from '../lib/dates'

interface DateChipProps {
  value: string
  onChange: (date: string) => void
}

export function DateChip({ value, onChange }: DateChipProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const today = todayStr()
  const isToday = value === today
  const displayText = isToday ? 'Today' : shortDate(value)

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => {
          inputRef.current?.showPicker?.()
          inputRef.current?.focus()
        }}
        className="flex items-center gap-1 px-3 h-9 rounded-lg text-sm font-medium cursor-pointer transition-colors"
        style={{
          backgroundColor: 'rgba(0,0,0,0.04)',
          color: '#007AFF',
        }}
      >
        {displayText}
        <span className="text-[10px]" style={{ color: '#007AFF' }}>▾</span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={value}
        max={today}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        tabIndex={-1}
        aria-label="Select date"
      />
    </div>
  )
}

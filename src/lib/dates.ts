/**
 * Date helpers — dates are date-only strings (YYYY-MM-DD).
 * NEVER call new Date('YYYY-MM-DD') — it parses as UTC and can shift the day.
 * All helpers construct local dates from components.
 */

/** Today as YYYY-MM-DD in the user's local calendar. */
export function todayStr(): string {
  const d = new Date()
  return toDateStr(d)
}

/** Convert a Date object to YYYY-MM-DD in local time. */
export function toDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parse a YYYY-MM-DD string into a local Date.
 * Splits and constructs from components — never new Date(string).
 */
export function parseDateStr(s: string): Date {
  const [yStr, mStr, dStr] = s.split('-')
  const y = parseInt(yStr!, 10)
  const m = parseInt(mStr!, 10) - 1 // 0-indexed
  const d = parseInt(dStr!, 10)
  return new Date(y, m, d)
}

/** Extract YYYY-MM month key from a YYYY-MM-DD date string. */
export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7)
}

/**
 * Add n months to a YYYY-MM month key. Handles year crossings.
 * n can be negative.
 */
export function addMonths(mk: string, n: number): string {
  const [yStr, mStr] = mk.split('-')
  let y = parseInt(yStr!, 10)
  let m = parseInt(mStr!, 10) - 1 // 0-indexed

  m += n
  // Normalize month and year
  y += Math.floor(m / 12)
  m = ((m % 12) + 12) % 12

  return `${y}-${String(m + 1).padStart(2, '0')}`
}

/** Number of days in a given YYYY-MM month. */
export function daysInMonth(mk: string): number {
  const [yStr, mStr] = mk.split('-')
  const y = parseInt(yStr!, 10)
  const m = parseInt(mStr!, 10) // 1-indexed
  // Day 0 of the next month = last day of this month
  return new Date(y, m, 0).getDate()
}

/** Full month label, e.g. "September 2026". */
export function monthLabel(mk: string): string {
  const [yStr, mStr] = mk.split('-')
  const y = parseInt(yStr!, 10)
  const m = parseInt(mStr!, 10) - 1
  const d = new Date(y, m, 1)
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Short date, e.g. "Sep 9". */
export function shortDate(dateStr: string): string {
  const d = parseDateStr(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** English ordinal for a number, e.g. 1→"1st", 2→"2nd", 11→"11th", 21→"21st". */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  // 11, 12, 13 are special — always 'th'
  const suffix = (v >= 11 && v <= 13) ? 'th' : (s[v % 10] ?? 'th')
  return `${n}${suffix}`
}

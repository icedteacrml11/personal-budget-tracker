/**
 * Money utilities — all amounts are integer cents.
 * Never do arithmetic on floats.
 */

const MAX_CENTS = 100_000_000_000 // $1,000,000,000.00

/**
 * Convert a user-entered string to integer cents.
 * Uses string splitting — never parseFloat * 100.
 * Returns null for empty, non-numeric, zero, negative, or absurdly large input.
 */
export function toCents(input: string): number | null {
  // Trim and strip currency symbols, spaces, and thousands commas
  let s = input.trim()
  if (s === '') return null

  // Strip leading currency symbols and spaces
  s = s.replace(/^[£$€₱¥\s]+/, '')
  // Strip thousands separators (commas)
  s = s.replace(/,/g, '')
  // Trim again after stripping
  s = s.trim()

  if (s === '') return null

  // Must be a valid number pattern: optional digits, optional dot with up to 2 decimals
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null

  const parts = s.split('.')
  const wholePart = parts[0]!
  let decimalPart = parts[1] ?? ''

  // Pad decimal to 2 digits
  decimalPart = decimalPart.padEnd(2, '0')

  // Parse whole and decimal as integers
  const whole = parseInt(wholePart, 10)
  const decimal = parseInt(decimalPart, 10)

  if (isNaN(whole) || isNaN(decimal)) return null

  const cents = whole * 100 + decimal

  if (cents <= 0) return null
  if (cents > MAX_CENTS) return null

  return cents
}

/**
 * Format cents as a currency string using Intl.NumberFormat.
 * Replaces hyphen-minus with true minus glyph (U+2212).
 */
export function formatMoney(cents: number, currency: string): string {
  const value = cents / 100
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

  // Replace hyphen-minus with true minus
  return formatted.replace(/-/, '\u2212')
}

/**
 * Compact money format — at most one decimal (e.g. $1.2K).
 * Below 1,000, falls back to normal format without cents when whole.
 */
export function formatMoneyShort(cents: number, currency: string): string {
  const absCents = Math.abs(cents)

  if (absCents < 100_000) {
    // Below $1,000 — use normal format
    const value = cents / 100
    if (cents % 100 === 0) {
      // Whole dollar amount
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
      return formatted.replace(/-/, '\u2212')
    }
    return formatMoney(cents, currency)
  }

  // $1,000+ — use compact notation
  const value = cents / 100
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)

  return formatted.replace(/-/, '\u2212')
}

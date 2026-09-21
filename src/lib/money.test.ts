import { describe, it, expect } from 'vitest'
import { toCents, formatMoney, formatMoneyShort } from './money'

describe('toCents', () => {
  it('accepts whole numbers', () => {
    expect(toCents('12')).toBe(1200)
    expect(toCents('1')).toBe(100)
    expect(toCents('100')).toBe(10000)
  })

  it('accepts decimals', () => {
    expect(toCents('12.5')).toBe(1250)
    expect(toCents('12.50')).toBe(1250)
    expect(toCents('0.01')).toBe(1)
    expect(toCents('0.99')).toBe(99)
  })

  it('accepts amounts with currency symbols', () => {
    expect(toCents('$1,234.56')).toBe(123456)
    expect(toCents('$100')).toBe(10000)
    expect(toCents('£50.25')).toBe(5025)
    expect(toCents('€ 10.00')).toBe(1000)
  })

  it('rejects empty and whitespace', () => {
    expect(toCents('')).toBeNull()
    expect(toCents('   ')).toBeNull()
  })

  it('rejects zero', () => {
    expect(toCents('0')).toBeNull()
    expect(toCents('0.00')).toBeNull()
  })

  it('rejects negative numbers', () => {
    expect(toCents('-5')).toBeNull()
    expect(toCents('-1.50')).toBeNull()
  })

  it('rejects more than 2 decimals', () => {
    expect(toCents('1.234')).toBeNull()
    expect(toCents('10.999')).toBeNull()
  })

  it('rejects non-numeric input', () => {
    expect(toCents('abc')).toBeNull()
    expect(toCents('12abc')).toBeNull()
    expect(toCents('hello')).toBeNull()
  })

  it('rejects absurdly large amounts', () => {
    expect(toCents('1000000001')).toBeNull()
    expect(toCents('9999999999')).toBeNull()
  })

  it('handles the 0.1 + 0.2 scenario exactly in cents', () => {
    // The key insight: we never do float math.
    // 0.1 + 0.2 in cents should be 10 + 20 = 30
    const a = toCents('0.10')!
    const b = toCents('0.20')!
    expect(a + b).toBe(30)
    expect(a).toBe(10)
    expect(b).toBe(20)
  })

  it('handles 19.99 + 20.01 exactly in cents', () => {
    const a = toCents('19.99')!
    const b = toCents('20.01')!
    expect(a + b).toBe(4000)
  })
})

describe('formatMoney', () => {
  it('formats positive amounts', () => {
    expect(formatMoney(1250, 'USD')).toBe('$12.50')
    expect(formatMoney(100, 'USD')).toBe('$1.00')
    expect(formatMoney(999, 'USD')).toBe('$9.99')
  })

  it('uses true minus glyph for negatives', () => {
    const result = formatMoney(-1250, 'USD')
    expect(result).toContain('\u2212') // True minus
    expect(result).not.toContain('-')  // No hyphen-minus
    expect(result).toContain('12.50')
  })

  it('formats zero', () => {
    expect(formatMoney(0, 'USD')).toBe('$0.00')
  })

  it('formats with different currencies', () => {
    expect(formatMoney(1000, 'EUR')).toContain('10.00')
    expect(formatMoney(1000, 'GBP')).toContain('10.00')
  })
})

describe('formatMoneyShort', () => {
  it('formats small whole amounts without cents', () => {
    expect(formatMoneyShort(1000, 'USD')).toBe('$10')
    expect(formatMoneyShort(500, 'USD')).toBe('$5')
  })

  it('formats small amounts with cents normally', () => {
    expect(formatMoneyShort(999, 'USD')).toBe('$9.99')
    expect(formatMoneyShort(1250, 'USD')).toBe('$12.50')
  })

  it('formats large amounts in compact notation', () => {
    const result = formatMoneyShort(150000, 'USD')
    expect(result).toContain('K')
  })
})

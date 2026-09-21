import { describe, it, expect } from 'vitest'
import { todayStr, parseDateStr, monthKey, addMonths, daysInMonth, monthLabel, shortDate, ordinal, toDateStr } from './dates'

describe('parseDateStr', () => {
  it('parses a date string without shifting the day', () => {
    const d = parseDateStr('2026-01-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(0) // January
    expect(d.getDate()).toBe(15)
  })

  it('handles end of month', () => {
    const d = parseDateStr('2026-02-28')
    expect(d.getDate()).toBe(28)
    expect(d.getMonth()).toBe(1) // February
  })

  it('roundtrips through toDateStr', () => {
    const original = '2026-09-22'
    const d = parseDateStr(original)
    expect(toDateStr(d)).toBe(original)
  })
})

describe('monthKey', () => {
  it('extracts YYYY-MM from a date string', () => {
    expect(monthKey('2026-09-22')).toBe('2026-09')
    expect(monthKey('2025-01-01')).toBe('2025-01')
  })
})

describe('addMonths', () => {
  it('adds months within the same year', () => {
    expect(addMonths('2026-03', 2)).toBe('2026-05')
    expect(addMonths('2026-01', 5)).toBe('2026-06')
  })

  it('crosses year boundary forward', () => {
    expect(addMonths('2026-11', 2)).toBe('2027-01')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2025-10', 15)).toBe('2027-01')
  })

  it('crosses year boundary backward', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-03', -5)).toBe('2025-10')
  })

  it('handles multiple year crossings', () => {
    expect(addMonths('2024-06', 24)).toBe('2026-06')
    expect(addMonths('2026-06', -24)).toBe('2024-06')
  })
})

describe('daysInMonth', () => {
  it('returns correct days for regular months', () => {
    expect(daysInMonth('2026-01')).toBe(31) // January
    expect(daysInMonth('2026-04')).toBe(30) // April
    expect(daysInMonth('2026-06')).toBe(30) // June
    expect(daysInMonth('2026-09')).toBe(30) // September
  })

  it('handles February in a non-leap year', () => {
    expect(daysInMonth('2026-02')).toBe(28)
  })

  it('handles February in a leap year', () => {
    expect(daysInMonth('2024-02')).toBe(29)
    expect(daysInMonth('2028-02')).toBe(29)
  })
})

describe('monthLabel', () => {
  it('returns a readable month label', () => {
    expect(monthLabel('2026-09')).toBe('September 2026')
    expect(monthLabel('2025-01')).toBe('January 2025')
    expect(monthLabel('2026-12')).toBe('December 2026')
  })
})

describe('shortDate', () => {
  it('returns a short date', () => {
    const result = shortDate('2026-09-09')
    expect(result).toContain('Sep')
    expect(result).toContain('9')
  })
})

describe('ordinal', () => {
  it('handles basic cases', () => {
    expect(ordinal(1)).toBe('1st')
    expect(ordinal(2)).toBe('2nd')
    expect(ordinal(3)).toBe('3rd')
    expect(ordinal(4)).toBe('4th')
    expect(ordinal(5)).toBe('5th')
  })

  it('handles teen cases (11th, 12th, 13th)', () => {
    expect(ordinal(11)).toBe('11th')
    expect(ordinal(12)).toBe('12th')
    expect(ordinal(13)).toBe('13th')
  })

  it('handles 21st, 22nd, 23rd', () => {
    expect(ordinal(21)).toBe('21st')
    expect(ordinal(22)).toBe('22nd')
    expect(ordinal(23)).toBe('23rd')
  })

  it('handles higher numbers', () => {
    expect(ordinal(31)).toBe('31st')
    expect(ordinal(100)).toBe('100th')
    expect(ordinal(111)).toBe('111th')
    expect(ordinal(112)).toBe('112th')
    expect(ordinal(113)).toBe('113th')
    expect(ordinal(121)).toBe('121st')
  })
})

describe('todayStr', () => {
  it('returns a valid YYYY-MM-DD string', () => {
    const today = todayStr()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

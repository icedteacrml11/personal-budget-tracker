/**
 * Category metadata: color + emoji icon.
 * Two maps for expense and income categories.
 */

import type { TxType } from './types'

export interface CategoryMeta {
  emoji: string
  color: string
}

export const EXPENSE_CATEGORIES: Record<string, CategoryMeta> = {
  'Groceries':      { emoji: '🛒', color: '#34C759' },
  'Food & Dining':  { emoji: '🍔', color: '#FF9500' },
  'Shopping':       { emoji: '🛍️', color: '#FF3B30' },
  'Transport':      { emoji: '🚌', color: '#007AFF' },
  'Entertainment':  { emoji: '🎬', color: '#AF52DE' },
  'Health':         { emoji: '💊', color: '#30B0C7' },
  'Bills':          { emoji: '🧾', color: '#5856D6' },
  'Other':          { emoji: '📋', color: '#8E8E93' },
}

export const INCOME_CATEGORIES: Record<string, CategoryMeta> = {
  'Allowance':  { emoji: '💵', color: '#34C759' },
  'Job':        { emoji: '💼', color: '#007AFF' },
  'Gift':       { emoji: '🎁', color: '#AF52DE' },
  'Refund':     { emoji: '↩️', color: '#FF9500' },
  'Other':      { emoji: '➕', color: '#8E8E93' },
}

/**
 * Look up category metadata. Falls back to the "Other" entry for unknown categories
 * (imported data can contain anything).
 */
export function catMeta(type: TxType, category: string): CategoryMeta {
  const map = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  return map[category] ?? map['Other']!
}

/** Get the list of category names for a transaction type. */
export function categoryNames(type: TxType): string[] {
  return Object.keys(type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
}

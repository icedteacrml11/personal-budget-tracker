import { describe, it, expect } from 'vitest'
import { BudgetStateSchema } from './schema'
import { migrateV1 } from './migrate'
import { DEFAULT_STATE } from '../store/reducer'

describe('schema validation', () => {
  it('validates a correct default state', () => {
    const result = BudgetStateSchema.safeParse(DEFAULT_STATE)
    expect(result.success).toBe(true)
  })

  it('rejects invalid version', () => {
    const bad = { ...DEFAULT_STATE, version: 1 }
    const result = BudgetStateSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it('rejects float amountCents', () => {
    const bad = {
      ...DEFAULT_STATE,
      transactions: [{
        id: 'x', type: 'expense', amountCents: 12.5, label: 'test', category: 'Other',
        date: '2026-01-01', createdAt: new Date().toISOString(),
      }],
    }
    const result = BudgetStateSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })

  it('rejects invalid date format', () => {
    const bad = {
      ...DEFAULT_STATE,
      transactions: [{
        id: 'x', type: 'expense', amountCents: 100, label: 'test', category: 'Other',
        date: '2026/01/01', createdAt: new Date().toISOString(),
      }],
    }
    const result = BudgetStateSchema.safeParse(bad)
    expect(result.success).toBe(false)
  })
})

describe('v1 migration', () => {
  it('converts dollar floats to cents', () => {
    const v1 = {
      transactions: [
        { id: 1, type: 'income', amount: 150.50, label: 'Allowance', category: 'Allowance', date: '2026-09-01', createdAt: new Date().toISOString() },
      ],
      openingBalance: 100,
    }

    const result = migrateV1(v1)
    expect(result.settings.openingBalanceCents).toBe(10000)
    expect(result.transactions[0]!.amountCents).toBe(15050)
    expect(typeof result.transactions[0]!.id).toBe('string')
  })

  it('drops future-dated entries', () => {
    const v1 = {
      transactions: [
        { id: 1, type: 'income', amount: 100, label: 'Future', category: 'Other', date: '2099-12-31', createdAt: new Date().toISOString() },
        { id: 2, type: 'income', amount: 50, label: 'Past', category: 'Other', date: '2020-01-01', createdAt: new Date().toISOString() },
      ],
    }

    const result = migrateV1(v1)
    expect(result.transactions).toHaveLength(1)
    expect(result.transactions[0]!.label).toBe('Past')
  })

  it('starts with default wallets', () => {
    const result = migrateV1({})
    expect(result.wallets).toHaveLength(1)
    expect(result.wallets[0]!.linked).toBe(true)
  })
})

describe('round-trip save/load', () => {
  // We test the schema validation as the key serialization contract
  it('default state round-trips through JSON and validates', () => {
    const json = JSON.stringify(DEFAULT_STATE)
    const parsed = JSON.parse(json)
    const result = BudgetStateSchema.safeParse(parsed)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.version).toBe(2)
    }
  })
})

describe('import validation', () => {
  it('rejects invalid files without changing state', () => {
    const badData = { version: 2, settings: 'invalid' }
    const result = BudgetStateSchema.safeParse(badData)
    expect(result.success).toBe(false)
  })
})

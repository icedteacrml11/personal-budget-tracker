/**
 * Zod schema for validating BudgetState.
 */

import { z } from 'zod'

const TxSourceSchema = z.union([
  z.object({ kind: z.literal('bill'), billPaymentId: z.string() }),
  z.object({ kind: z.literal('repayment'), repaymentId: z.string() }),
])

const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  amountCents: z.number().int(),
  label: z.string(),
  category: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.string(),
  source: TxSourceSchema.optional(),
})

const BillSchema = z.object({
  id: z.string(),
  name: z.string(),
  amountCents: z.number().int().positive(),
  dueDay: z.number().int().min(1).max(31),
  category: z.string(),
})

const BillPaymentSchema = z.object({
  id: z.string(),
  billId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  transactionId: z.string(),
})

const DebtorSchema = z.object({
  id: z.string(),
  name: z.string(),
  amountCents: z.number().int().positive(),
  reason: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  settled: z.boolean(),
})

const RepaymentSchema = z.object({
  id: z.string(),
  debtorId: z.string(),
  amountCents: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transactionId: z.string(),
})

const WalletKindSchema = z.enum(['checking', 'savings', 'cash', 'investment', 'credit'])

const WalletSchema = z.object({
  id: z.string(),
  kind: WalletKindSchema,
  name: z.string(),
  institution: z.string(),
  last4: z.string().optional(),
  balanceCents: z.number().int(),
  linked: z.boolean().optional(),
})

const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'PHP', 'AUD', 'CAD', 'SGD'])

const SettingsSchema = z.object({
  displayName: z.string(),
  currency: CurrencyCodeSchema,
  openingBalanceCents: z.number().int(),
})

export const BudgetStateSchema = z.object({
  version: z.literal(2),
  settings: SettingsSchema,
  transactions: z.array(TransactionSchema),
  bills: z.array(BillSchema),
  billPayments: z.array(BillPaymentSchema),
  debtors: z.array(DebtorSchema),
  repayments: z.array(RepaymentSchema),
  wallets: z.array(WalletSchema),
})

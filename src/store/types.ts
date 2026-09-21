/** All data model types for the budget store. */

export type TxType = 'income' | 'expense'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'PHP' | 'AUD' | 'CAD' | 'SGD'

export type TxSource =
  | { kind: 'bill'; billPaymentId: string }
  | { kind: 'repayment'; repaymentId: string }

export interface Transaction {
  id: string
  type: TxType
  amountCents: number        // positive integer
  label: string
  category: string
  date: string               // 'YYYY-MM-DD', local calendar date, never in the future
  createdAt: string          // ISO timestamp, only for stable ordering within a day
  source?: TxSource          // absent = entered manually
}

export interface Bill {
  id: string
  name: string
  amountCents: number
  dueDay: number             // 1–31
  category: string
}

export interface BillPayment {
  id: string
  billId: string
  month: string              // 'YYYY-MM'
  transactionId: string
}

export interface Debtor {
  id: string
  name: string
  amountCents: number        // total owed
  reason: string
  date: string
  settled: boolean
}

export interface Repayment {
  id: string
  debtorId: string
  amountCents: number
  date: string
  transactionId: string
}

export type WalletKind = 'checking' | 'savings' | 'cash' | 'investment' | 'credit'

export interface Wallet {
  id: string
  kind: WalletKind
  name: string
  institution: string
  last4?: string
  balanceCents: number       // signed; credit balances are negative
  linked?: boolean           // true = balance mirrors Available Balance (exactly one wallet)
}

export interface Settings {
  displayName: string
  currency: CurrencyCode
  openingBalanceCents: number
}

export interface BudgetState {
  version: 2
  settings: Settings
  transactions: Transaction[]
  bills: Bill[]
  billPayments: BillPayment[]
  debtors: Debtor[]
  repayments: Repayment[]
  wallets: Wallet[]
}

/** All possible actions for the budget reducer. */
export type BudgetAction =
  | { type: 'ADD_TRANSACTION'; payload: { id: string; type: TxType; amountCents: number; label: string; category: string; date: string; createdAt: string; source?: TxSource } }
  | { type: 'REMOVE_TRANSACTION'; payload: { id: string } }
  | { type: 'ADD_BILL'; payload: { id: string; name: string; amountCents: number; dueDay: number; category: string } }
  | { type: 'REMOVE_BILL'; payload: { id: string } }
  | { type: 'TOGGLE_BILL_PAID'; payload: { billId: string; month: string; paymentId: string; transactionId: string; date: string; createdAt: string } }
  | { type: 'ADD_DEBTOR'; payload: { id: string; name: string; amountCents: number; reason: string; date: string } }
  | { type: 'RECORD_REPAYMENT'; payload: { repaymentId: string; debtorId: string; amountCents: number; date: string; transactionId: string; createdAt: string; label: string } }
  | { type: 'SETTLE_DEBTOR'; payload: { debtorId: string; repaymentId: string; transactionId: string; date: string; createdAt: string; label: string; amountCents: number } }
  | { type: 'REMOVE_DEBTOR'; payload: { id: string } }
  | { type: 'ADD_WALLET'; payload: Wallet }
  | { type: 'UPDATE_WALLET'; payload: { id: string; patch: Partial<Omit<Wallet, 'id' | 'linked'>> } }
  | { type: 'REMOVE_WALLET'; payload: { id: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'REPLACE_STATE'; payload: BudgetState }

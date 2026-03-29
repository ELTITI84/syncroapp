import type { Transaction } from "@/lib/data"
import type { MovementTab } from "@/lib/syncro"

export type TransactionModel = Transaction
export type TransactionStatusTab = MovementTab

export type TransactionsListResult = {
  transactions: TransactionModel[]
}

import { TransactionNotFoundException } from "@/exceptions/movements/movements-exceptions"
import type { Transaction } from "@/lib/data"
import { isImportedTransaction, matchesMovementTab } from "@/lib/syncro"
import { TransactionsRepository } from "@/repositories/movements/movements.repository"
import type { CreateTransactionDto } from "@/types/movements/dto/create-movement.dto"
import type { TransactionsQueryDto } from "@/types/movements/dto/movements-query.dto"
import type { UpdateTransactionDto } from "@/types/movements/dto/update-movement.dto"

export class TransactionsService {
  constructor(private readonly transactionsRepository = new TransactionsRepository()) {}

  async getTransactions(query: TransactionsQueryDto) {
    const transactions = await this.transactionsRepository.getTransactions()
    const search = query.search?.trim().toLowerCase()

    return {
      transactions: transactions.filter((tx) => {
        const matchesTab = query.tab ? matchesMovementTab(tx.status, query.tab) : true
        const matchesCategory = query.category ? tx.category === query.category : true
        const matchesType = query.type ? tx.type === query.type : true
        const matchesSource = query.source ? tx.source === query.source : true
        const matchesQuickFilter =
          !query.quickFilter ||
          query.quickFilter === "all" ||
          (query.quickFilter === "uncategorized" && (!tx.categoryId || tx.category === "Otros")) ||
          (query.quickFilter === "imported" && isImportedTransaction(tx)) ||
          (query.quickFilter === "detected" && tx.status === "detected") ||
          (query.quickFilter === "linked_invoice" && Boolean(tx.invoiceId))
        const matchesSearch =
          !search ||
          tx.description.toLowerCase().includes(search) ||
          tx.category.toLowerCase().includes(search) ||
          tx.notes?.toLowerCase().includes(search)

        return matchesTab && matchesCategory && matchesType && matchesSource && matchesQuickFilter && matchesSearch
      }),
    }
  }

  async getTransactionById(transactionId: string) {
    const transaction = await this.transactionsRepository.getTransactionById(transactionId)

    if (!transaction) {
      throw new TransactionNotFoundException(transactionId)
    }

    return transaction
  }

  async createTransaction(payload: CreateTransactionDto) {
    const transaction: Transaction = {
      id: `T${String(Date.now()).slice(-6)}`,
      date: payload.date,
      description: payload.description,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      source: payload.source,
      status: "confirmed",
      notes: payload.notes,
      suggestedCategory: payload.category,
      invoiceId: payload.invoiceId,
      sourceData: payload.sourceData ?? null,
    }
    return this.transactionsRepository.createTransaction(transaction)
  }

  async updateTransaction(transactionId: string, updates: UpdateTransactionDto) {
    await this.getTransactionById(transactionId)
    const updated = await this.transactionsRepository.updateTransaction(transactionId, {
      ...updates,
      amount: updates.amount !== undefined ? updates.amount : undefined,
    })

    if (!updated) {
      throw new TransactionNotFoundException(transactionId)
    }

    return updated
  }

  async deleteTransaction(transactionId: string) {
    await this.getTransactionById(transactionId)
    await this.transactionsRepository.deleteTransaction(transactionId)
    return { success: true, transactionId }
  }
}

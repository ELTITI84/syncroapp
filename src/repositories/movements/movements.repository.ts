import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import type { Transaction } from "@/lib/data"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { dbRowToTransaction } from "@/repositories/base/row-mappers"

export class TransactionsRepository extends AuthenticatedRepository {
  private async getOptionalUserId() {
    const supabase = await this.getClient()
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  }

  async getTransactions() {
    const data = await this.fetchAllRows("transactions", "*, categories(name)", {
      orderBy: "date",
      ascending: false,
    })
    return data.map(dbRowToTransaction)
  }

  async getTransactionById(transactionId: string) {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*, categories(name)")
      .eq("id", transactionId)
      .single()
    if (error) return null
    return dbRowToTransaction(data)
  }

  async createTransaction(transaction: Transaction) {
    const userId = await this.getOptionalUserId()
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: userId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        counterparty: transaction.clientId,
        date: transaction.date,
        source: transaction.source,
        status: transaction.status,
        category_id: transaction.categoryId,
        invoice_id: transaction.invoiceId,
        notes: transaction.notes,
        suggested_category: transaction.suggestedCategory,
        recurring: transaction.recurring ?? false,
        source_data: (transaction.sourceData ?? null) as any,
      })
      .select("*, categories(name)")
      .single()
    if (error) throw new Error(error.message)
    return dbRowToTransaction(data)
  }

  async updateTransaction(transactionId: string, updates: Partial<Transaction>) {
    const dbUpdates: Record<string, unknown> = {}
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.category !== undefined) {
      dbUpdates.suggested_category = updates.category
      if (updates.categoryId === undefined) dbUpdates.category_id = null
    }
    if (updates.clientId !== undefined) dbUpdates.counterparty = updates.clientId
    if (updates.date !== undefined) dbUpdates.date = updates.date
    if (updates.source !== undefined) dbUpdates.source = updates.source
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId
    if (updates.invoiceId !== undefined) dbUpdates.invoice_id = updates.invoiceId
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.suggestedCategory !== undefined) dbUpdates.suggested_category = updates.suggestedCategory
    if (updates.recurring !== undefined) dbUpdates.recurring = updates.recurring
    if (updates.sourceData !== undefined) dbUpdates.source_data = updates.sourceData as any
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .update(dbUpdates)
      .eq("id", transactionId)
      .select("*, categories(name)")
      .single()
    if (error) throw new Error(error.message)
    return dbRowToTransaction(data)
  }

  async deleteTransaction(transactionId: string) {
    const { error } = await supabaseAdmin
      .from("transactions")
      .delete()
      .eq("id", transactionId)
    if (error) throw new Error(error.message)
  }
}

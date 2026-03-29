import type { Client, Invoice } from "@/lib/data"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import { dbRowToInvoice } from "@/repositories/base/row-mappers"

function mergeInvoiceSourceData(sourceData: Invoice["sourceData"], owner: string) {
  const base =
    sourceData && typeof sourceData === "object" && !Array.isArray(sourceData)
      ? sourceData as Record<string, unknown>
      : {}

  return {
    ...base,
    owner,
  }
}

function dbRowsToClients(rows: any[]): Client[] {
  const seen = new Set<string>()
  const clients: Client[] = []

  for (const row of rows) {
    const name: string = row.counterparty
    if (!name || seen.has(name)) continue
    seen.add(name)
    clients.push({
      id: name,
      name,
      industry: "General",
      riskScore: "medium",
      avgPaymentDays: 30,
      paymentTerms: "30 días",
    })
  }

  return clients
}

export class InvoicesRepository extends AuthenticatedRepository {
  private async getOptionalUserId() {
    const supabase = await this.getClient()
    const { data } = await supabase.auth.getUser()
    return data.user?.id ?? null
  }

  async getInvoices() {
    const data = await this.fetchAllRows("invoices", "*", {
      orderBy: "created_at",
      ascending: false,
    })
    return data.map(dbRowToInvoice)
  }

  async getInvoiceById(invoiceId: string) {
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single()
    if (error) return null
    return dbRowToInvoice(data)
  }

  async getClients() {
    const data = await this.fetchAllRows<{ counterparty: string }>("invoices", "counterparty", {
      orderBy: "created_at",
      ascending: false,
    })
    return dbRowsToClients(data)
  }

  async createInvoice(invoice: Invoice) {
    const userId = await this.getOptionalUserId()
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .insert({
        user_id: userId,
        counterparty: invoice.client,
        total_amount: invoice.totalAmount ?? invoice.amount,
        paid_amount: invoice.paidAmount ?? 0,
        issue_date: invoice.issueDate,
        due_date: invoice.dueDate,
        status: invoice.status,
        description: invoice.description,
        priority: invoice.priority,
        notes: invoice.notes ?? null,
        source_data: mergeInvoiceSourceData(invoice.sourceData, invoice.owner) as any,
        type: invoice.type ?? "receivable",
      })
      .select("*")
      .single()
    if (error) throw new Error(error.message)
    return dbRowToInvoice(data)
  }

  async updateInvoice(invoiceId: string, updates: Partial<Invoice>) {
    const dbUpdates: Record<string, unknown> = {}
    const currentInvoice =
      updates.owner !== undefined || updates.sourceData !== undefined
        ? await this.getInvoiceById(invoiceId)
        : null
    if (updates.client !== undefined) dbUpdates.counterparty = updates.client
    if (updates.amount !== undefined) dbUpdates.total_amount = updates.amount
    if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount
    if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount
    if (updates.issueDate !== undefined) dbUpdates.issue_date = updates.issueDate
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes
    if (updates.owner !== undefined || updates.sourceData !== undefined) {
      dbUpdates.source_data = mergeInvoiceSourceData(
        updates.sourceData ?? currentInvoice?.sourceData ?? null,
        updates.owner ?? currentInvoice?.owner ?? "",
      ) as any
    }
    const { data, error } = await supabaseAdmin
      .from("invoices")
      .update(dbUpdates)
      .eq("id", invoiceId)
      .select("*")
      .single()
    if (error) throw new Error(error.message)
    return dbRowToInvoice(data)
  }

  async deleteInvoice(invoiceId: string) {
    const { error } = await supabaseAdmin
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
    if (error) throw new Error(error.message)
  }
}

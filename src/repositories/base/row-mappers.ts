import type { Invoice, ScheduledCashEvent, Transaction } from "@/lib/data"

export function dbRowToInvoice(row: any): Invoice {
  const totalAmount = Number(row.total_amount ?? 0)
  const paidAmount = Number(row.paid_amount ?? 0)
  const outstandingAmount = Math.max(totalAmount - paidAmount, 0)
  const type = row.type === "payable" ? "payable" : "receivable"
  const sourceData =
    row.source_data && typeof row.source_data === "object" && !Array.isArray(row.source_data)
      ? row.source_data
      : null
  const status = outstandingAmount <= 0 || row.status === "paid"
    ? "paid"
    : row.status === "overdue"
      ? "overdue"
      : "pending"

  return {
    id: row.id,
    client: row.counterparty,
    clientId: row.counterparty,
    amount: totalAmount,
    totalAmount,
    paidAmount,
    type,
    issueDate: row.issue_date,
    dueDate: row.due_date ?? "",
    status,
    description: row.description ?? "",
    owner: typeof sourceData?.owner === "string" ? sourceData.owner : "",
    priority: row.priority as "high" | "medium" | "low",
    notes: row.notes ?? undefined,
    sourceData: row.source_data ?? null,
    paymentHistory: paidAmount > 0
      ? [{
          date: row.updated_at ?? row.issue_date ?? row.created_at ?? new Date().toISOString().slice(0, 10),
          amount: paidAmount,
          note: outstandingAmount > 0 ? "Pago parcial registrado" : "Pago total registrado",
        }]
      : [],
    expectedPayments: outstandingAmount > 0 && row.due_date
      ? [{
          date: row.due_date,
          amount: outstandingAmount,
          note: type === "payable" ? "Pago pendiente segun vencimiento." : "Cobro pendiente segun vencimiento.",
        }]
      : [],
  }
}

export function dbRowToTransaction(row: any): Transaction {
  const rawStatus = row.status === "cancelled" ? "pending_review" : row.status

  return {
    id: row.id,
    date: row.date,
    description: row.description,
    amount: Number(row.amount),
    type: row.type,
    category: row.categories?.name ?? row.suggested_category ?? "Otros",
    categoryId: row.category_id ?? undefined,
    source: row.source as Transaction["source"],
    status: rawStatus as Transaction["status"],
    clientId: row.counterparty ?? undefined,
    suggestedCategory: row.suggested_category ?? undefined,
    notes: row.notes ?? undefined,
    recurring: row.recurring,
    invoiceId: row.invoice_id ?? undefined,
    sourceData: row.source_data ?? null,
  }
}

export function dbRowToScheduledCashEvent(row: any): ScheduledCashEvent {
  return {
    id: row.id,
    date: row.event_date,
    label: row.title,
    amount: Number(row.amount),
    type: row.movement_type,
    description: row.notes ?? "",
  }
}

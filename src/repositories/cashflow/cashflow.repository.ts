import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import {
  dbRowToInvoice,
  dbRowToScheduledCashEvent,
  dbRowToTransaction,
} from "@/repositories/base/row-mappers"

export class CashflowRepository extends AuthenticatedRepository {
  async getInvoices() {
    const data = await this.fetchAllRows("invoices", "*", {
      orderBy: "created_at",
      ascending: false,
    })
    return data.map(dbRowToInvoice)
  }

  async getTransactions() {
    const data = await this.fetchAllRows("transactions", "*, categories(name)", {
      orderBy: "date",
      ascending: false,
    })
    return data.map(dbRowToTransaction)
  }

  async getScheduledCashEvents() {
    const [supabase, userId] = await this.getClientAndUserId()
    const { data, error } = await supabase
      .from("forecast_events")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("event_date", { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []).map(dbRowToScheduledCashEvent)
  }
}

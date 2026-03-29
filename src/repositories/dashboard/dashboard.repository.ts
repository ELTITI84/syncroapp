import type { NotificationItem } from "@/lib/data"
import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import { dbRowToInvoice, dbRowToTransaction } from "@/repositories/base/row-mappers"

export class DashboardRepository extends AuthenticatedRepository {
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

  async getNotifications(): Promise<NotificationItem[]> {
    const [supabase, userId] = await this.getClientAndUserId()
    const { data, error } = await supabase
      .from("insights")
      .select("id, title, severity, summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
    if (error) throw new Error(error.message)

    const notifications = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.summary,
      severity: row.severity === "low" ? "medium" : row.severity as "critical" | "high" | "medium",
      target: { pathname: "/insights" },
    }))

    if (notifications.length > 0) {
      return notifications
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from("insights")
      .select("id, title, severity, summary, created_at")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(10)

    if (legacyError) throw new Error(legacyError.message)

    return (legacyData ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      body: row.summary,
      severity: row.severity === "low" ? "medium" : row.severity as "critical" | "high" | "medium",
      target: { pathname: "/insights" },
    }))
  }
}

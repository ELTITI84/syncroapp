import type { Insight } from "@/lib/data"
import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import { dbRowToInvoice, dbRowToTransaction } from "@/repositories/base/row-mappers"

function dbRowToInsight(row: any): Insight {
  return {
    id: row.id,
    title: row.title,
    severity: row.severity as "high" | "medium" | "low",
    summary: row.summary,
    what: (row.context_data as any)?.what ?? "",
    why: row.why_it_matters ?? "",
    action: row.recommendation ?? "",
    benefit: (row.context_data as any)?.benefit ?? "",
    moneyImpact: Number(row.monetary_impact ?? 0),
    daysImpact: Number(row.time_impact_days ?? 0),
    ctaLabel: (row.context_data as any)?.ctaLabel ?? "View",
    target: (row.context_data as any)?.target ?? { pathname: "/insights" },
  }
}

export class InsightsRepository extends AuthenticatedRepository {
  async getInsights() {
    const [supabase, userId] = await this.getClientAndUserId()
    const { data, error } = await supabase
      .from("insights")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (error) throw new Error(error.message)

    if ((data?.length ?? 0) > 0) {
      return data.map(dbRowToInsight)
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from("insights")
      .select("*")
      .is("user_id", null)
      .order("created_at", { ascending: false })

    if (legacyError) throw new Error(legacyError.message)

    return (legacyData ?? []).map(dbRowToInsight)
  }

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
}

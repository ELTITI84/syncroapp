import { DatabaseException, NotFoundException } from "@/exceptions/base/base-exceptions"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"
import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"

type IntakeLogInsert = Database["public"]["Tables"]["intake_logs"]["Insert"]
type IntakeLogUpdate = Database["public"]["Tables"]["intake_logs"]["Update"]
type IntakeLogRow = Database["public"]["Tables"]["intake_logs"]["Row"]

export class IntakeRepository extends AuthenticatedRepository {
  async getCurrentUserId() {
    return this.getUserId()
  }

  async createLog(payload: IntakeLogInsert) {
    const userId = await this.getUserId()
    const { data, error } = await supabaseAdmin
      .from("intake_logs")
      .insert({
        ...payload,
        user_id: userId,
      })
      .select("*")
      .single()

    if (error) throw new DatabaseException(error.message, "No se pudo guardar el preview de importación.")
    return data
  }

  async getLogById(logId: string): Promise<IntakeLogRow> {
    const userId = await this.getUserId()
    const { data, error } = await supabaseAdmin
      .from("intake_logs")
      .select("*")
      .eq("id", logId)
      .eq("user_id", userId)
      .single()

    if (error || !data) {
      throw new NotFoundException(`Intake log ${logId} not found`, "No encontramos el preview que querés confirmar.")
    }

    return data
  }

  async updateLog(logId: string, updates: IntakeLogUpdate) {
    const userId = await this.getUserId()
    const { data, error } = await supabaseAdmin
      .from("intake_logs")
      .update(updates)
      .eq("id", logId)
      .eq("user_id", userId)
      .select("*")
      .single()

    if (error) throw new DatabaseException(error.message, "No se pudo actualizar el estado de la importación.")
    return data
  }
}

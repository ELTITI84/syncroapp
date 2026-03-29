import "server-only"

import { decrypt, encrypt } from "@/lib/crypto/encrypt"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"
import { AuthenticatedRepository } from "@/repositories/base/authenticated.repository"
import type { MpMovement } from "@/types/mercadopago/types/mp.types"

type MpConnectionRow = Database["public"]["Tables"]["mp_connections"]["Row"]
type MpMovementRow = Database["public"]["Tables"]["mp_movements"]["Row"]
type MovementStatusFilter = "all" | MpMovementRow["status"]

function mapMovement(row: MpMovementRow): MpMovement {
  return {
    id: row.id,
    mpPaymentId: row.mp_payment_id,
    dateCreated: row.date_created,
    dateApproved: row.date_approved,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    description: row.description,
    payerEmail: row.payer_email,
    payerName: row.payer_name,
    paymentMethodId: row.payment_method_id,
    paymentTypeId: row.payment_type_id,
    operationType: row.operation_type,
  }
}

export class MercadoPagoRepository extends AuthenticatedRepository {
  async saveConnection(input: {
    accessToken: string
    refreshToken: string
    tokenExpiresAt: string
    mpUserId: number
    mpEmail: string | null
  }) {
    const [client, userId] = await this.getClientAndUserId()
    const now = new Date().toISOString()

    const { data, error } = await client
      .from("mp_connections")
      .upsert(
        {
          user_id: userId,
          encrypted_access_token: encrypt(input.accessToken),
          encrypted_refresh_token: encrypt(input.refreshToken),
          token_expires_at: input.tokenExpiresAt,
          mp_user_id: input.mpUserId,
          mp_email: input.mpEmail,
          is_active: true,
          updated_at: now,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single()

    if (error || !data) {
      throw new Error(`Error guardando conexión MP: ${error?.message ?? "sin datos"}`)
    }

    return data
  }

  async getConnection() {
    const [client, userId] = await this.getClientAndUserId()

    const { data, error } = await client
      .from("mp_connections")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  async getConnectionById(connectionId: string) {
    const { data, error } = await supabaseAdmin
      .from("mp_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  async updateTokensByConnectionId(
    connectionId: string,
    input: {
      accessToken: string
      refreshToken: string
      tokenExpiresAt: string
    },
  ) {
    const { error } = await supabaseAdmin
      .from("mp_connections")
      .update({
        encrypted_access_token: encrypt(input.accessToken),
        encrypted_refresh_token: encrypt(input.refreshToken),
        token_expires_at: input.tokenExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    if (error) {
      throw new Error(`Error actualizando tokens MP: ${error.message}`)
    }
  }

  async deactivateConnection() {
    const [client, userId] = await this.getClientAndUserId()

    const { error } = await client
      .from("mp_connections")
      .update({
        encrypted_access_token: null,
        encrypted_refresh_token: null,
        token_expires_at: null,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      throw new Error(`Error desconectando MP: ${error.message}`)
    }
  }

  async updateLastSync(connectionId: string) {
    const { error } = await supabaseAdmin
      .from("mp_connections")
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)

    if (error) {
      throw new Error(`Error actualizando último sync MP: ${error.message}`)
    }
  }

  async getDecryptedTokens(connection: Pick<MpConnectionRow, "encrypted_access_token" | "encrypted_refresh_token">) {
    return {
      accessToken: connection.encrypted_access_token ? decrypt(connection.encrypted_access_token) : null,
      refreshToken: connection.encrypted_refresh_token ? decrypt(connection.encrypted_refresh_token) : null,
    }
  }

  async upsertMovements(
    connection: Pick<MpConnectionRow, "id" | "user_id">,
    movements: Array<Omit<MpMovement, "id"> & { rawData: unknown }>,
  ) {
    if (movements.length === 0) {
      return
    }

    const rows: Database["public"]["Tables"]["mp_movements"]["Insert"][] = movements.map((movement) => ({
      user_id: connection.user_id,
      mp_connection_id: connection.id,
      mp_payment_id: movement.mpPaymentId,
      date_created: movement.dateCreated,
      date_approved: movement.dateApproved,
      status: movement.status,
      amount: movement.amount,
      currency: movement.currency,
      description: movement.description,
      payer_email: movement.payerEmail,
      payer_name: movement.payerName,
      payment_method_id: movement.paymentMethodId,
      payment_type_id: movement.paymentTypeId,
      operation_type: movement.operationType,
      raw_data: movement.rawData as Database["public"]["Tables"]["mp_movements"]["Insert"]["raw_data"],
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabaseAdmin
      .from("mp_movements")
      .upsert(rows, { onConflict: "user_id,mp_payment_id" })

    if (error) {
      throw new Error(`Error guardando movimientos MP: ${error.message}`)
    }
  }

  async getMovements(options: {
    connectionId: string
    beginDate: string
    endDate: string
    status: MovementStatusFilter
    limit?: number
  }) {
    const [client, userId] = await this.getClientAndUserId()

    let query = client
      .from("mp_movements")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("mp_connection_id", options.connectionId)
      .gte("date_created", options.beginDate)
      .lte("date_created", options.endDate)
      .order("date_created", { ascending: false })

    if (options.status !== "all") {
      query = query.eq("status", options.status)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Error obteniendo movimientos MP: ${error.message}`)
    }

    return {
      movements: (data ?? []).map(mapMovement),
      total: count ?? 0,
    }
  }
}

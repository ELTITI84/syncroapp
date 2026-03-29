import "server-only"

import { endOfMonth, startOfMonth, subMonths } from "date-fns"

import {
  MpConfigurationException,
  MpInvalidTokenException,
  MpNotConnectedException,
  MpSyncException,
} from "@/exceptions/mercadopago/mercadopago-exceptions"
import type { Database } from "@/lib/supabase/database.types"
import { MercadoPagoRepository } from "@/repositories/mercadopago/mercadopago.repository"
import type {
  MpConnectionInfo,
  MpOauthTokenResponse,
  MpPayment,
  MpSearchResponse,
} from "@/types/mercadopago/types/mp.types"

const MP_API_BASE = "https://api.mercadopago.com"
const MP_AUTH_BASE = "https://auth.mercadopago.com/authorization"
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000
const SYNC_LOOKBACK_BUFFER_MS = 5 * 60 * 1000

type Period = "current_month" | "last_month" | "3_months" | "6_months" | "last_12_months"
type StatusFilter = "all" | "approved" | "pending" | "rejected"
type MpConnectionRow = Database["public"]["Tables"]["mp_connections"]["Row"]

export class MercadoPagoService {
  constructor(private readonly mpRepo = new MercadoPagoRepository()) {}

  getAuthorizationUrl(state: string) {
    const clientId = process.env.MP_CLIENT_ID
    const redirectUri = process.env.MP_REDIRECT_URI

    if (!clientId || !redirectUri) {
      throw new MpConfigurationException()
    }

    const url = new URL(MP_AUTH_BASE)
    url.searchParams.set("client_id", clientId)
    url.searchParams.set("response_type", "code")
    url.searchParams.set("platform_id", "mp")
    url.searchParams.set("redirect_uri", redirectUri)
    url.searchParams.set("state", state)

    return url.toString()
  }

  async completeOAuthConnection(code: string) {
    const tokens = await this.exchangeToken({
      grantType: "authorization_code",
      code,
    })

    const me = await this.fetchMe(tokens.access_token)
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await this.mpRepo.saveConnection({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt,
      mpUserId: me.id,
      mpEmail: me.email ?? null,
    })

    try {
      await this.syncMovements("current_month")
    } catch (error) {
      console.error("Initial Mercado Pago sync failed after OAuth connect:", error)
    }

    return {
      mpEmail: me.email ?? null,
      mpUserId: me.id,
    }
  }

  async disconnectAccount() {
    await this.mpRepo.deactivateConnection()
  }

  async getConnectionStatus(): Promise<MpConnectionInfo> {
    const connection = await this.mpRepo.getConnection()

    if (!connection) {
      return {
        connectionId: null,
        isConnected: false,
        mpEmail: null,
        mpUserId: null,
        lastSyncAt: null,
      }
    }

    return {
      connectionId: connection.id,
      isConnected: true,
      mpEmail: connection.mp_email,
      mpUserId: connection.mp_user_id,
      lastSyncAt: connection.last_sync_at,
    }
  }

  async syncMovements(period: Period = "current_month") {
    const connection = await this.getCurrentConnectionOrThrow()
    const accessToken = await this.getValidAccessToken(connection)
    const { beginDate, endDate } = this.getPeriodDates(period)
    const syncBeginDate = connection.last_sync_at
      ? new Date(
          Math.max(
            new Date(beginDate).getTime(),
            new Date(connection.last_sync_at).getTime() - SYNC_LOOKBACK_BUFFER_MS,
          ),
        ).toISOString()
      : beginDate

    const allPayments: MpPayment[] = []
    let offset = 0
    const pageSize = 50

    while (true) {
      const url = new URL(`${MP_API_BASE}/v1/payments/search`)
      url.searchParams.set("sort", "date_created")
      url.searchParams.set("criteria", "desc")
      url.searchParams.set("range", "date_created")
      url.searchParams.set("begin_date", syncBeginDate)
      url.searchParams.set("end_date", endDate)
      url.searchParams.set("limit", String(pageSize))
      url.searchParams.set("offset", String(offset))

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new MpSyncException(error?.message ?? response.statusText)
      }

      const data: MpSearchResponse = await response.json()
      allPayments.push(...data.results)

      if (offset + pageSize >= data.paging.total || data.results.length === 0) {
        break
      }

      offset += pageSize
    }

    await this.mpRepo.upsertMovements(
      { id: connection.id, user_id: connection.user_id },
      allPayments.map((payment) => this.mapPayment(payment)),
    )
    await this.mpRepo.updateLastSync(connection.id)

    return { synced: allPayments.length }
  }

  async getMovements(options: {
    period: Period
    status: StatusFilter
  }) {
    const connection = await this.getCurrentConnectionOrThrow()
    const { beginDate, endDate } = this.getPeriodDates(options.period)

    return this.mpRepo.getMovements({
      connectionId: connection.id,
      beginDate,
      endDate,
      status: options.status,
      limit: 200,
    })
  }

  async processWebhookPayment(connectionId: string, paymentId: string) {
    const connection = await this.mpRepo.getConnectionById(connectionId)

    if (!connection) {
      return
    }

    const accessToken = await this.getValidAccessToken(connection)
    const response = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    if (!response.ok) {
      return
    }

    const payment: MpPayment = await response.json()

    await this.mpRepo.upsertMovements(
      { id: connection.id, user_id: connection.user_id },
      [this.mapPayment(payment)],
    )
    await this.mpRepo.updateLastSync(connection.id)
  }

  private async getCurrentConnectionOrThrow() {
    const connection = await this.mpRepo.getConnection()

    if (!connection) {
      throw new MpNotConnectedException()
    }

    return connection
  }

  private async getValidAccessToken(connection: MpConnectionRow) {
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at).getTime() : 0
    const { accessToken, refreshToken } = await this.mpRepo.getDecryptedTokens(connection)

    if (!accessToken || !refreshToken) {
      throw new MpNotConnectedException()
    }

    if (tokenExpiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
      return accessToken
    }

    const refreshed = await this.exchangeToken({
      grantType: "refresh_token",
      refreshToken,
    })
    const nextAccessToken = refreshed.access_token
    const nextRefreshToken = refreshed.refresh_token || refreshToken
    const nextExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()

    await this.mpRepo.updateTokensByConnectionId(connection.id, {
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      tokenExpiresAt: nextExpiresAt,
    })

    return nextAccessToken
  }

  private async fetchMe(accessToken: string) {
    const response = await fetch(`${MP_API_BASE}/v1/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new MpInvalidTokenException()
    }

    return response.json() as Promise<{ id: number; email?: string | null }>
  }

  private async exchangeToken(input:
    | { grantType: "authorization_code"; code: string }
    | { grantType: "refresh_token"; refreshToken: string },
  ) {
    const clientId = process.env.MP_CLIENT_ID
    const clientSecret = process.env.MP_CLIENT_SECRET
    const redirectUri = process.env.MP_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      throw new MpConfigurationException()
    }

    const response = await fetch(`${MP_API_BASE}/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        input.grantType === "authorization_code"
          ? {
              client_id: clientId,
              client_secret: clientSecret,
              code: input.code,
              grant_type: input.grantType,
              redirect_uri: redirectUri,
            }
          : {
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: input.grantType,
              refresh_token: input.refreshToken,
            },
      ),
      cache: "no-store",
    })

    if (!response.ok) {
      throw new MpInvalidTokenException()
    }

    return response.json() as Promise<MpOauthTokenResponse>
  }

  private mapPayment(payment: MpPayment) {
    return {
      mpPaymentId: payment.id,
      dateCreated: payment.date_created,
      dateApproved: payment.date_approved,
      status: payment.status,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      description: payment.description ?? null,
      payerEmail: payment.payer?.email ?? null,
      payerName: null,
      paymentMethodId: payment.payment_method_id ?? null,
      paymentTypeId: payment.payment_type_id ?? null,
      operationType: payment.operation_type ?? null,
      rawData: payment,
    }
  }

  private getPeriodDates(period: Period): { beginDate: string; endDate: string } {
    const now = new Date()
    const fmt = (date: Date) => date.toISOString()

    switch (period) {
      case "current_month":
        return { beginDate: fmt(startOfMonth(now)), endDate: fmt(now) }
      case "last_month":
        return {
          beginDate: fmt(startOfMonth(subMonths(now, 1))),
          endDate: fmt(endOfMonth(subMonths(now, 1))),
        }
      case "3_months":
        return { beginDate: fmt(subMonths(now, 3)), endDate: fmt(now) }
      case "6_months":
        return { beginDate: fmt(subMonths(now, 6)), endDate: fmt(now) }
      case "last_12_months":
        return { beginDate: fmt(subMonths(now, 12)), endDate: fmt(now) }
      default:
        return { beginDate: fmt(startOfMonth(now)), endDate: fmt(now) }
    }
  }
}

export type MpPaymentStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "cancelled"
  | "in_process"
  | "refunded"

export type MpPayment = {
  id: number
  date_created: string
  date_approved: string | null
  date_last_updated: string
  status: MpPaymentStatus
  status_detail: string
  transaction_amount: number
  currency_id: string
  description: string | null
  payment_method_id: string
  payment_type_id: string
  operation_type: string
  payer: {
    id: number
    email: string
    identification?: {
      type: string
      number: string
    }
  } | null
  collector_id: number
}

export type MpSearchResponse = {
  paging: {
    total: number
    limit: number
    offset: number
  }
  results: MpPayment[]
}

export type MpOauthTokenResponse = {
  access_token: string
  refresh_token: string
  expires_in: number
  user_id?: number
}

export type MpConnectionInfo = {
  connectionId: string | null
  isConnected: boolean
  mpEmail: string | null
  mpUserId: number | null
  lastSyncAt: string | null
}

export type MpConnectionStatus = MpConnectionInfo

export type MpMovement = {
  id: string
  mpPaymentId: number
  dateCreated: string
  dateApproved: string | null
  status: MpPaymentStatus
  amount: number
  currency: string
  description: string | null
  payerEmail: string | null
  payerName: string | null
  paymentMethodId: string | null
  paymentTypeId: string | null
  operationType: string | null
}

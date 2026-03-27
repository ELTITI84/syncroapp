import type { Client } from "@/lib/data"
import type { ClientRecord } from "@/lib/syncro"

export type ClientModel = Client
export type ClientRecordModel = ClientRecord

export type ClientsListResult = {
  clients: ClientRecordModel[]
}

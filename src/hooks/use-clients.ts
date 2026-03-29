"use client"

import useSWR from "swr"
import { apiFetch } from "@/lib/api"
import type { ClientRecord } from "@/lib/syncro"

interface ClientsResponse {
  clients: ClientRecord[]
}

export function useClients() {
  const { data, error, isLoading } = useSWR<ClientsResponse>(
    "/api/clients",
    (url: string) => apiFetch<ClientsResponse>(url),
  )

  return {
    clients: data?.clients ?? [],
    isLoading,
    error,
  }
}

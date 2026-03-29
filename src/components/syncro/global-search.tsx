"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, FileText, Search, Users, X } from "lucide-react"

import { useInvoices } from "@/hooks/use-invoices"
import { useTransactions } from "@/hooks/use-transactions"
import { useClients } from "@/hooks/use-clients"
import {
  formatCurrency,
  formatSignedCurrency,
  getInvoiceBucket,
  getInvoiceBucketLabel,
  getMovementSourceLabel,
  getRiskLabel,
  getSignedTransactionAmount,
  type MovementTab,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

type SearchResult = {
  id: string
  label: string
  sublabel: string
  type: "invoice" | "transaction" | "client"
  href: string
}

type Props = { open: boolean; onClose: () => void }

const typeIcon = {
  invoice: FileText,
  transaction: ArrowLeftRight,
  client: Users,
}

const typeLabel = {
  invoice: "Factura",
  transaction: "Movimiento",
  client: "Cliente",
}

export function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter()
  const { invoices } = useInvoices()
  const { transactions } = useTransactions()
  const { clients } = useClients()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return []

    const nextResults: SearchResult[] = []

    invoices.forEach((invoice) => {
      if (
        invoice.id.toLowerCase().includes(value) ||
        invoice.client.toLowerCase().includes(value) ||
        invoice.description.toLowerCase().includes(value)
      ) {
        nextResults.push({
          id: invoice.id,
          label: `${invoice.id} - ${invoice.client}`,
          sublabel: `${formatCurrency(invoice.amount)} · ${getInvoiceBucketLabel(getInvoiceBucket(invoice))}`,
          type: "invoice",
          href: `/invoices?highlight=${invoice.id}`,
        })
      }
    })

    transactions.forEach((transaction) => {
      const tab: MovementTab = transaction.status === "duplicate" ? "duplicate" : transaction.status === "confirmed" ? "confirmed" : "pending_review"
      if (
        transaction.description.toLowerCase().includes(value) ||
        transaction.category.toLowerCase().includes(value) ||
        transaction.notes?.toLowerCase().includes(value) ||
        transaction.invoiceId?.toLowerCase().includes(value)
      ) {
        nextResults.push({
          id: transaction.id,
          label: transaction.description,
          sublabel: `${formatSignedCurrency(getSignedTransactionAmount(transaction))} · ${transaction.category} · ${transaction.invoiceId ? `Factura ${transaction.invoiceId}` : getMovementSourceLabel(transaction.source)}`,
          type: "transaction",
          href: `/movements?tab=${tab}&highlight=${transaction.id}`,
        })
      }
    })

    clients.forEach((client) => {
      if (client.name.toLowerCase().includes(value) || client.industry.toLowerCase().includes(value)) {
        nextResults.push({
          id: client.id,
          label: client.name,
          sublabel: `Te deben ${formatCurrency(client.totalOwed)} · Riesgo ${getRiskLabel(client.riskScore).toLowerCase()}`,
          type: "client",
          href: `/clients?highlight=${client.id}`,
        })
      }
    })

    return nextResults.slice(0, 8)
  }, [clients, invoices, query, transactions])

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelected(0)
      return
    }

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key === "ArrowDown") setSelected((current) => Math.min(current + 1, results.length - 1))
      if (event.key === "ArrowUp") setSelected((current) => Math.max(current - 1, 0))
      if (event.key === "Enter" && results[selected]) {
        router.push(results[selected].href)
        onClose()
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose, open, results, router, selected])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl overflow-hidden rounded-xl border bg-card shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="size-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar facturas, movimientos y clientes"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((result, index) => {
              const Icon = typeIcon[result.type]
              return (
                <li key={`${result.type}-${result.id}`}>
                  <button
                    onClick={() => {
                      router.push(result.href)
                      onClose()
                    }}
                    className={cn("flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-muted", selected === index && "bg-muted")}
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">{result.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{result.sublabel}</p>
                    </div>
                    <span className="rounded border bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">
                      {typeLabel[result.type]}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Sin resultados para &quot;{query}&quot;.
          </div>
        )}

        {!query && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Buscá facturas, movimientos y clientes.
          </div>
        )}
      </div>
    </div>
  )
}

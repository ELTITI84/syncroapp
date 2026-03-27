"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, FileText, Search, Users, X } from "lucide-react"

import { useStore } from "@/lib/store"
import { getClientRecords, getInvoiceBucket } from "@/lib/syncro"
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

export function GlobalSearch({ open, onClose }: Props) {
  const router = useRouter()
  const invoices = useStore((state) => state.invoices)
  const transactions = useStore((state) => state.transactions)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState(0)

  const clientRecords = useMemo(() => getClientRecords(invoices), [invoices])
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
          sublabel: `${invoice.amount.toLocaleString()} - ${getInvoiceBucket(invoice)}`,
          type: "invoice",
          href: `/invoices?highlight=${invoice.id}`,
        })
      }
    })

    transactions.forEach((transaction) => {
      if (
        transaction.description.toLowerCase().includes(value) ||
        transaction.category.toLowerCase().includes(value) ||
        transaction.notes?.toLowerCase().includes(value)
      ) {
        nextResults.push({
          id: transaction.id,
          label: transaction.description,
          sublabel: `${transaction.amount > 0 ? "+" : "-"}$${Math.abs(transaction.amount).toLocaleString()} - ${transaction.category}`,
          type: "transaction",
          href: `/movements?tab=${transaction.status}&highlight=${transaction.id}`,
        })
      }
    })

    clientRecords.forEach((client) => {
      if (client.name.toLowerCase().includes(value) || client.industry.toLowerCase().includes(value)) {
        nextResults.push({
          id: client.id,
          label: client.name,
          sublabel: `${client.totalOwed.toLocaleString()} open - ${client.riskScore} risk`,
          type: "client",
          href: `/clients?highlight=${client.id}`,
        })
      }
    })

    return nextResults.slice(0, 8)
  }, [clientRecords, invoices, query, transactions])

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
            placeholder="Search invoices, movements, and clients"
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
                      {result.type}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No results found for "{query}".
          </div>
        )}

        {!query && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Search live invoices, movements, and client records.
          </div>
        )}
      </div>
    </div>
  )
}

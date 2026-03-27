"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, ChevronRight, Clock3, DollarSign, FileText, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { formatCurrency, formatShortDate, getClientRecords, getInvoiceBucket } from "@/lib/syncro"
import { cn } from "@/lib/utils"

function riskTone(risk: "low" | "medium" | "high") {
  if (risk === "high") return "bg-danger/15 text-danger hover:bg-danger/15"
  if (risk === "medium") return "bg-warning/15 text-warning hover:bg-warning/15"
  return "bg-success/15 text-success hover:bg-success/15"
}

export function ClientsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoices = useStore((state) => state.invoices)

  const [search, setSearch] = useState("")
  const [riskFilter, setRiskFilter] = useState<"all" | "low" | "medium" | "high">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const highlight = searchParams.get("highlight")
    if (highlight) setSelectedId(highlight)
  }, [searchParams])

  const clients = useMemo(() => getClientRecords(invoices), [invoices])
  const selected = useMemo(() => clients.find((client) => client.id === selectedId) ?? null, [clients, selectedId])
  const filtered = useMemo(() => {
    return clients.filter((client) => {
      const query = search.trim().toLowerCase()
      return (
        (!query || client.name.toLowerCase().includes(query) || client.industry.toLowerCase().includes(query)) &&
        (riskFilter === "all" || client.riskScore === riskFilter)
      )
    })
  }, [clients, riskFilter, search])

  const totalOwed = clients.reduce((sum, client) => sum + client.totalOwed, 0)
  const averageDays = Math.round(clients.reduce((sum, client) => sum + client.avgPaymentDays, 0) / Math.max(clients.length, 1))
  const clientInvoices = selected ? invoices.filter((invoice) => invoice.clientId === selected.id) : []

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Collection risk, payment behavior, and concentration by account.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Outstanding</p><p className="mt-3 text-2xl font-bold text-foreground">{formatCurrency(totalOwed)}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">High risk clients</p><p className="mt-3 text-2xl font-bold text-danger">{clients.filter((client) => client.riskScore === "high").length}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Average payment days</p><p className="mt-3 text-2xl font-bold text-warning">{averageDays} days</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Client portfolio</CardTitle>
                <CardDescription>Open a client to review invoices, risk, and suggested next step.</CardDescription>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client or industry" className="min-w-[240px]" />
                <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
                  {(["all", "low", "medium", "high"] as const).map((value) => (
                    <button
                      key={value}
                      onClick={() => setRiskFilter(value)}
                      className={cn("rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-all", riskFilter === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                      {value === "all" ? "all" : `${value} risk`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedId(client.id)}
                className={cn("rounded-xl border p-5 text-left transition-all hover:border-primary/40 hover:bg-muted/20", searchParams.get("highlight") === client.id && "border-primary ring-1 ring-primary/30")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.industry}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Open balance</span>
                    <span className="font-semibold text-foreground">{formatCurrency(client.totalOwed)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg payment</span>
                    <span className={cn("font-medium", client.avgPaymentDays > 45 ? "text-danger" : "text-warning")}>{client.avgPaymentDays} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge className={riskTone(client.riskScore)}>{client.riskScore} risk</Badge>
                    {client.overdueCount > 0 && <span className="text-xs font-medium text-danger">{client.overdueCount} overdue</span>}
                  </div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b pb-4">
                <Badge className={riskTone(selected.riskScore)}>{selected.riskScore} risk</Badge>
                <SheetTitle className="mt-3 text-xl">{selected.name}</SheetTitle>
                <SheetDescription>{selected.industry} - {selected.paymentTerms}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-4">
                <Card>
                  <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Open balance</p><p className="mt-2 text-2xl font-bold text-foreground">{formatCurrency(selected.totalOwed)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Payment rate</p><p className="mt-2 text-2xl font-bold text-foreground">{selected.paymentRate}%</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4" />Average payment days</div><p className="mt-1 font-medium text-foreground">{selected.avgPaymentDays} days</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-4" />Overdue exposure</div><p className="mt-1 font-medium text-foreground">{formatCurrency(selected.overdueAmount)}</p></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Account view</CardTitle><CardDescription>Use this to understand why the client is risky and what to do next.</CardDescription></CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><div className="flex items-center gap-2 text-sm font-medium text-foreground"><ShieldAlert className="size-4" />Why it matters</div><p className="mt-1 text-sm text-muted-foreground">{selected.riskScore === "high" ? "This client already sits on overdue debt and pays slowly, so it amplifies forecast risk." : selected.riskScore === "medium" ? "The client is manageable, but timing should be watched before the next billing cycle closes." : "This client is relatively reliable and helps stabilize collections."}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><div className="flex items-center gap-2 text-sm font-medium text-foreground"><DollarSign className="size-4" />Recommended action</div><p className="mt-1 text-sm text-muted-foreground">{selected.riskScore === "high" ? "Push for tighter terms or partial upfront payment on the next engagement." : selected.riskScore === "medium" ? "Send early reminders and keep promise dates explicit." : "Standard terms are acceptable, but keep the next invoice visible."}</p></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Client invoices</CardTitle></CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {clientInvoices.map((invoice) => (
                      <div key={invoice.id} className="rounded-xl border border-border/80 bg-muted/10 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <FileText className="size-4 text-muted-foreground" />
                              <p className="text-sm font-medium text-foreground">{invoice.id}</p>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">Due {formatShortDate(invoice.dueDate)}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={riskTone(getInvoiceBucket(invoice) === "overdue" ? "high" : getInvoiceBucket(invoice) === "due-soon" ? "medium" : "low")}>
                              {getInvoiceBucket(invoice).replace("-", " ")}
                            </Badge>
                            <p className="mt-2 text-sm font-semibold text-foreground">{formatCurrency(invoice.amount)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <SheetFooter className="border-t pt-4">
                <Button onClick={() => router.push(`/invoices?client=${selected.id}`)}>Open invoices</Button>
                <Button variant="outline" onClick={() => router.push("/cashflow?focus=zero-day")}>Open cashflow</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

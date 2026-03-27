"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FilePlus2,
  Mail,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { clients } from "@/lib/data"
import { useStore } from "@/lib/store"
import {
  buildHref,
  formatCurrency,
  formatSignedCurrency,
  formatShortDate,
  getBurnRate,
  getClientRecords,
  getInvoiceBucket,
  getInvoiceSummary,
  matchesInvoiceFilter,
  type InvoiceFilter,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

const filterOptions: InvoiceFilter[] = ["all", "overdue", "due-soon", "expected", "pending", "paid"]

function toneForBucket(bucket: InvoiceFilter) {
  if (bucket === "overdue") return "bg-danger/15 text-danger hover:bg-danger/15"
  if (bucket === "due-soon") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (bucket === "paid") return "bg-success/15 text-success hover:bg-success/15"
  return "bg-primary/15 text-primary hover:bg-primary/15"
}

export function InvoicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invoices = useStore((state) => state.invoices)
  const transactions = useStore((state) => state.transactions)
  const addInvoice = useStore((state) => state.addInvoice)
  const markInvoicePaid = useStore((state) => state.markInvoicePaid)

  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    clientId: clients[0]?.id ?? "",
    amount: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    description: "",
    owner: "Revenue Ops",
    priority: "medium" as "high" | "medium" | "low",
  })

  useEffect(() => {
    const nextStatus = (searchParams.get("status") as InvoiceFilter | null) ?? "all"
    const nextClient = searchParams.get("client") ?? "all"
    const highlight = searchParams.get("highlight")

    setStatusFilter(filterOptions.includes(nextStatus) ? nextStatus : "all")
    setClientFilter(nextClient)

    if (highlight && invoices.some((invoice) => invoice.id === highlight)) {
      setSelectedInvoiceId(highlight)
    }
  }, [searchParams, invoices])

  const clientRecords = useMemo(() => getClientRecords(invoices), [invoices])
  const invoiceSummary = useMemo(() => getInvoiceSummary(invoices), [invoices])
  const burnRate = useMemo(() => getBurnRate(transactions), [transactions])
  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId],
  )

  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      const matchesStatus = matchesInvoiceFilter(invoice, statusFilter)
      const matchesClient = clientFilter === "all" || invoice.clientId === clientFilter
      const query = search.trim().toLowerCase()
      const matchesQuery =
        !query ||
        invoice.id.toLowerCase().includes(query) ||
        invoice.client.toLowerCase().includes(query) ||
        invoice.description.toLowerCase().includes(query)

      return matchesStatus && matchesClient && matchesQuery
    })
  }, [clientFilter, invoices, search, statusFilter])

  const focusCollections = searchParams.get("focus") === "collections"

  const summaryCards = [
    {
      label: "Outstanding",
      value: formatCurrency(invoiceSummary.outstandingAmount),
      detail: `${invoices.filter((invoice) => invoice.status !== "paid").length} open invoices`,
      icon: ArrowUpRight,
      tone: "text-foreground",
      href: "/invoices?status=pending",
    },
    {
      label: "Overdue",
      value: formatCurrency(invoiceSummary.overdueAmount),
      detail: `${invoiceSummary.overdueCount} invoices need collection`,
      icon: AlertTriangle,
      tone: "text-danger",
      href: "/invoices?status=overdue&focus=collections",
    },
    {
      label: "Due soon",
      value: formatCurrency(invoiceSummary.dueSoonAmount),
      detail: `${invoiceSummary.dueSoonCount} invoices due in 7 days`,
      icon: Clock3,
      tone: "text-warning",
      href: "/invoices?status=due-soon",
    },
    {
      label: "Collected",
      value: formatCurrency(invoiceSummary.paidAmount),
      detail: "Paid invoices already closed",
      icon: CheckCircle2,
      tone: "text-success",
      href: "/invoices?status=paid",
    },
  ]

  const exportCSV = () => {
    const rows = [
      ["ID", "Client", "Amount", "Issue Date", "Due Date", "Status", "Priority", "Owner"].join(","),
      ...filteredInvoices.map((invoice) =>
        [
          invoice.id,
          invoice.client,
          invoice.amount,
          invoice.issueDate,
          invoice.dueDate,
          invoice.status,
          invoice.priority,
          invoice.owner,
        ].join(","),
      ),
    ]

    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "syncro-invoices.csv"
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Invoices exported")
  }

  const handleCreateInvoice = () => {
    const client = clients.find((item) => item.id === form.clientId)
    if (!client) return

    const id = `INV-${String(Date.now()).slice(-3)}`

    addInvoice({
      id,
      client: client.name,
      clientId: client.id,
      amount: Number(form.amount),
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: "pending",
      description: form.description,
      owner: form.owner,
      priority: form.priority,
      paymentHistory: [],
      expectedPayments: form.dueDate
        ? [
            {
              date: form.dueDate,
              amount: Number(form.amount),
              note: "Expected on the invoice due date.",
            },
          ]
        : [],
    })

    toast.success("Invoice added to the workspace")
    setCreateOpen(false)
    setSelectedInvoiceId(id)
    setForm({
      clientId: clients[0]?.id ?? "",
      amount: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      description: "",
      owner: "Revenue Ops",
      priority: "medium",
    })
  }

  const handleSendReminder = (invoiceId: string, clientName: string) => {
    toast.success(`Reminder queued for ${clientName}`, {
      description: `The workflow is mocked, but the action is now wired for ${invoiceId}.`,
    })
  }

  const handleMarkPaid = (invoiceId: string) => {
    markInvoicePaid(invoiceId)
    toast.success("Invoice marked as collected")
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Collection management, due-date prioritization, and invoice-level cash impact.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="size-4" />
              New invoice
            </Button>
          </div>
        </div>

        {focusCollections && (
          <Card className="border-danger/30 bg-danger/5">
            <CardContent className="flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 text-danger" />
                <div>
                  <p className="text-sm font-semibold text-danger">
                    Overdue invoices are the fastest lever to protect cash.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Start with Acme and Delta. Those clients explain most of the short-term forecast pressure.
                  </p>
                </div>
              </div>
              <Button onClick={() => router.push("/cashflow?focus=zero-day")}>
                See cash impact
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <button
                key={card.label}
                onClick={() => router.push(card.href)}
                className="text-left"
              >
                <Card className="h-full transition-all hover:border-primary/40 hover:bg-muted/20">
                  <CardContent className="flex h-full flex-col gap-4 px-5 py-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {card.label}
                      </span>
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className={cn("text-2xl font-bold tracking-tight", card.tone)}>{card.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Invoice list</CardTitle>
                <CardDescription>
                  Filter by payment urgency, client, or search terms. Clicking a row opens a usable detail panel.
                </CardDescription>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                <div className="relative min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Search client, invoice, or description"
                  />
                </div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-full lg:w-[220px]">
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All clients</SelectItem>
                    {clientRecords.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as InvoiceFilter)}>
              <TabsList className="flex w-full flex-wrap justify-start">
                {filterOptions.map((option) => (
                  <TabsTrigger key={option} value={option} className="capitalize">
                    {option.replace("-", " ")}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      No invoices match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const bucket = getInvoiceBucket(invoice)
                    const highlighted = searchParams.get("highlight") === invoice.id
                    const runwayImpact = Math.max(1, Math.round(invoice.amount / Math.max(burnRate, 1)))

                    return (
                      <TableRow
                        key={invoice.id}
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className={cn(
                          "cursor-pointer",
                          highlighted && "bg-primary/10 ring-1 ring-primary/30",
                        )}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{invoice.id}</p>
                            <p className="text-xs text-muted-foreground">{invoice.owner}</p>
                          </div>
                        </TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="size-4 text-muted-foreground" />
                            {formatShortDate(invoice.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={toneForBucket(bucket)}>{bucket.replace("-", " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {invoice.status === "paid" ? "Already collected" : `+${runwayImpact} runway days`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {invoice.status === "paid"
                                ? "Closed and reflected in cash."
                                : `Collecting it adds ${formatCurrency(invoice.amount)} to cash.`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Open
                            <ChevronRight className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selectedInvoice)} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selectedInvoice && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-2">
                  <Badge className={toneForBucket(getInvoiceBucket(selectedInvoice))}>
                    {getInvoiceBucket(selectedInvoice).replace("-", " ")}
                  </Badge>
                  <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                    {selectedInvoice.priority} priority
                  </Badge>
                </div>
                <SheetTitle className="mt-3 text-xl">{selectedInvoice.id}</SheetTitle>
                <SheetDescription>
                  {selectedInvoice.client} - owned by {selectedInvoice.owner}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-4">
                <Card>
                  <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Amount</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {formatCurrency(selectedInvoice.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Cash impact</p>
                      <p className="mt-2 text-lg font-semibold text-success">
                        +{Math.max(1, Math.round(selectedInvoice.amount / Math.max(burnRate, 1)))} runway days
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground">Issue date</p>
                      <p className="mt-1 font-medium text-foreground">{formatShortDate(selectedInvoice.issueDate)}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground">Due date</p>
                      <p className="mt-1 font-medium text-foreground">{formatShortDate(selectedInvoice.dueDate)}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Why this matters</CardTitle>
                    <CardDescription>
                      This invoice directly influences the short-term forecast.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-medium text-primary">What happens</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedInvoice.status === "paid"
                          ? "Cash already landed, so the forecast no longer depends on this invoice."
                          : `If this invoice is collected, ${formatCurrency(selectedInvoice.amount)} lands in cash and relieves near-term pressure immediately.`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Why it matters</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedInvoice.status === "overdue"
                          ? "It is already late, so the business is effectively financing the client."
                          : "It is part of the next collection wave and should stay visible until it lands."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Recommended action</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedInvoice.status === "paid"
                          ? "No action needed other than keeping the payment history complete."
                          : "Trigger a reminder, keep the expected payment visible, and escalate if the promise date slips."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <p className="text-sm text-muted-foreground">{selectedInvoice.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Payment history</CardTitle>
                    <CardDescription>
                      Historic and expected payments connected to this invoice.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {selectedInvoice.paymentHistory.length === 0 && selectedInvoice.expectedPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No payment events recorded yet.</p>
                    ) : (
                      <>
                        {selectedInvoice.paymentHistory.map((payment) => (
                          <div
                            key={`${payment.date}-${payment.note}`}
                            className="rounded-xl border border-success/20 bg-success/5 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{payment.note}</p>
                                <p className="text-xs text-muted-foreground">{formatShortDate(payment.date)}</p>
                              </div>
                              <p className="text-sm font-semibold text-success">
                                {formatSignedCurrency(payment.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {selectedInvoice.expectedPayments.map((payment) => (
                          <div
                            key={`${payment.date}-${payment.note}`}
                            className="rounded-xl border border-primary/20 bg-primary/5 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-foreground">{payment.note}</p>
                                <p className="text-xs text-muted-foreground">{formatShortDate(payment.date)}</p>
                              </div>
                              <p className="text-sm font-semibold text-primary">
                                {formatSignedCurrency(payment.amount)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <SheetFooter className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => handleSendReminder(selectedInvoice.id, selectedInvoice.client)}
                >
                  <Mail className="size-4" />
                  Send reminder
                </Button>
                {selectedInvoice.status !== "paid" && (
                  <Button onClick={() => handleMarkPaid(selectedInvoice.id)}>
                    <CheckCircle2 className="size-4" />
                    Mark as collected
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push(buildHref({ pathname: "/clients", params: { highlight: selectedInvoice.clientId } }))
                    setSelectedInvoiceId(null)
                  }}
                >
                  Open client
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create invoice</DialogTitle>
            <DialogDescription>
              Add a new invoice to the mocked workspace so it can influence collections and forecast.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Client</label>
              <Select
                value={form.clientId}
                onValueChange={(value) => setForm((current) => ({ ...current, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Amount</label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="9800"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Owner</label>
                <Input
                  value={form.owner}
                  onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Revenue Ops"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Issue date</label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Due date</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Priority</label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, priority: value as "high" | "medium" | "low" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Describe the work and why this invoice matters."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={!form.clientId || !form.amount || !form.issueDate || !form.dueDate || !form.description}
            >
              Create invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

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
import { useClients } from "@/hooks/use-clients"
import { useInvoices } from "@/hooks/use-invoices"
import { useTransactions } from "@/hooks/use-transactions"
import {
  buildHref,
  formatCurrency,
  formatSignedCurrency,
  formatShortDate,
  getBurnRate,
  getInvoiceBucket,
  getInvoiceBucketLabel,
  getInvoiceType,
  getInvoiceSummary,
  getInvoiceOutstandingAmount,
  getPriorityLabel,
  matchesInvoiceFilter,
  type InvoiceFilter,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

const filterOptions: InvoiceFilter[] = ["all", "overdue", "due-soon", "expected", "pending", "paid"]
const invoiceTypeOptions = ["all", "receivable", "payable"] as const
type InvoiceTypeFilter = (typeof invoiceTypeOptions)[number]

function toneForBucket(bucket: InvoiceFilter) {
  if (bucket === "overdue") return "bg-danger/15 text-danger hover:bg-danger/15"
  if (bucket === "due-soon") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (bucket === "paid") return "bg-success/15 text-success hover:bg-success/15"
  return "bg-primary/15 text-primary hover:bg-primary/15"
}

export function InvoicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { invoices, isLoading, createInvoice, markInvoicePaid: markPaid } = useInvoices()
  const { transactions } = useTransactions()
  const { clients: clientRecords } = useClients()

  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("all")
  const [typeFilter, setTypeFilter] = useState<InvoiceTypeFilter>("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    clientId: "",
    amount: "",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    description: "",
    owner: "Cobros",
    priority: "medium" as "high" | "medium" | "low",
  })

  useEffect(() => {
    const nextStatus = (searchParams.get("status") as InvoiceFilter | null) ?? "all"
    const nextType = (searchParams.get("type") as InvoiceTypeFilter | null) ?? "all"
    const nextClient = searchParams.get("client") ?? "all"
    const highlight = searchParams.get("highlight")

    setStatusFilter(filterOptions.includes(nextStatus) ? nextStatus : "all")
    setTypeFilter(invoiceTypeOptions.includes(nextType) ? nextType : "all")
    setClientFilter(nextClient)

    if (highlight && invoices.some((invoice) => invoice.id === highlight)) {
      setSelectedInvoiceId(highlight)
    }
  }, [searchParams, invoices])

  const burnRate = useMemo(() => getBurnRate(transactions), [transactions])
  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId],
  )
  const scopedInvoices = useMemo(
    () =>
      typeFilter === "all"
        ? invoices
        : invoices.filter((invoice) => getInvoiceType(invoice) === typeFilter),
    [invoices, typeFilter],
  )
  const scopedSummary = useMemo(() => getInvoiceSummary(scopedInvoices), [scopedInvoices])

  const filteredInvoices = useMemo(() => {
    return scopedInvoices.filter((invoice) => {
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
  }, [clientFilter, scopedInvoices, search, statusFilter])

  const dueSoonInvoices = useMemo(
    () => scopedInvoices.filter((invoice) => getInvoiceBucket(invoice) === "due-soon"),
    [scopedInvoices],
  )
  const openInvoices = useMemo(() => scopedInvoices.filter((invoice) => getInvoiceOutstandingAmount(invoice) > 0), [scopedInvoices])
  const paidInvoices = useMemo(() => scopedInvoices.filter((invoice) => getInvoiceOutstandingAmount(invoice) <= 0), [scopedInvoices])

  const runwayImpactMap = useMemo(
    () =>
      new Map(
        filteredInvoices.map((invoice) => [
          invoice.id,
          Math.max(1, Math.round(invoice.amount / Math.max(burnRate, 1))),
        ]),
      ),
    [filteredInvoices, burnRate],
  )

  const focusCollections = searchParams.get("focus") === "collections"

  const summaryCards = [
    {
      label: "Abiertas",
      value: formatCurrency(scopedSummary.outstandingAmount),
      detail: `${openInvoices.length} facturas siguen abiertas`,
      icon: ArrowUpRight,
      tone: "text-foreground",
      href: buildHref({
        pathname: "/invoices",
        params: {
          status: "pending",
          ...(typeFilter !== "all" ? { type: typeFilter } : {}),
        },
      }),
    },
    {
      label: "Vencidas",
      value: formatCurrency(scopedSummary.overdueAmount),
      detail: `${scopedSummary.overdueCount} necesitan acción ahora`,
      icon: AlertTriangle,
      tone: "text-danger",
      href: buildHref({
        pathname: "/invoices",
        params: {
          status: "overdue",
          focus: "collections",
          ...(typeFilter !== "all" ? { type: typeFilter } : {}),
        },
      }),
    },
    {
      label: "Por vencer",
      value: formatCurrency(dueSoonInvoices.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0)),
      detail: `${dueSoonInvoices.length} vencen en los próximos 7 días`,
      icon: Clock3,
      tone: "text-warning",
      href: buildHref({
        pathname: "/invoices",
        params: {
          status: "due-soon",
          ...(typeFilter !== "all" ? { type: typeFilter } : {}),
        },
      }),
    },
    {
      label: "Cerradas",
      value: formatCurrency(scopedSummary.paidAmount),
      detail: `${paidInvoices.length} ya no necesitan seguimiento`,
      icon: CheckCircle2,
      tone: "text-success",
      href: buildHref({
        pathname: "/invoices",
        params: {
          status: "paid",
          ...(typeFilter !== "all" ? { type: typeFilter } : {}),
        },
      }),
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
    toast.success("Facturas exportadas")
  }

  const handleCreateInvoice = async () => {
    if (!form.clientId || !form.amount) return

    await createInvoice({
      clientId: form.clientId,
      amount: Number(form.amount),
      type: "receivable",
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      description: form.description,
      owner: form.owner,
      priority: form.priority,
    })

    toast.success("Factura agregada", {
      description: "Ya quedó disponible en cobros y en el flujo proyectado.",
    })
    setCreateOpen(false)
    setForm({
      clientId: "",
      amount: "",
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: "",
      description: "",
      owner: "Cobros",
      priority: "medium",
    })
  }

  const handleSendReminder = (invoiceId: string, clientName: string) => {
    toast.success(`Recordatorio listo para ${clientName}`, {
      description: `La acción quedó conectada para la factura ${invoiceId}.`,
    })
  }

  const handleMarkPaid = async (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (!invoice) return
    await markPaid(invoice)
    toast.success(getInvoiceType(invoice) === "payable" ? "Factura marcada como pagada" : "Factura marcada como cobrada")
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="animate-pulse rounded-xl border bg-card p-6">
          <div className="h-6 w-56 rounded bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Cobros y pagos</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Acá ves qué facturas siguen abiertas, cuáles ya deberían haber entrado y qué conviene mover hoy.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="size-4" />
              Exportar CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="size-4" />
              Nueva factura
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
                    Las facturas vencidas son la forma más rápida de cuidar la caja.
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Empezá por Acme y Delta. Son los clientes que más explican la presión de corto plazo.
                  </p>
                </div>
              </div>
              <Button onClick={() => router.push("/cashflow?focus=zero-day")}>
                Ver impacto en caja
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
                <CardTitle>Lista de facturas</CardTitle>
                <CardDescription>
                  Filtrá por urgencia, cliente o texto. Abrí una fila para entender qué significa y qué conviene hacer.
                </CardDescription>
              </div>
              <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                <div className="relative min-w-[260px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar cliente, factura o detalle"
                  />
                </div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-full lg:w-[220px]">
                    <SelectValue placeholder="Todos los clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los clientes</SelectItem>
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
                  <TabsTrigger key={option} value={option}>
                    {getInvoiceBucketLabel(option)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={typeFilter === "all" ? "default" : "outline"}
                onClick={() => setTypeFilter("all")}
              >
                Todas
              </Button>
              <Button
                type="button"
                size="sm"
                variant={typeFilter === "receivable" ? "default" : "outline"}
                onClick={() => setTypeFilter("receivable")}
              >
                Esto te deben
              </Button>
              <Button
                type="button"
                size="sm"
                variant={typeFilter === "payable" ? "default" : "outline"}
                onClick={() => setTypeFilter("payable")}
              >
                Esto tenés que pagar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Factura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Vence</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Qué cambia</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">
                      No hay facturas que coincidan con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const bucket = getInvoiceBucket(invoice)
                    const highlighted = searchParams.get("highlight") === invoice.id
                    const runwayImpact = runwayImpactMap.get(invoice.id) ?? 1

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
                            <p className="text-xs text-muted-foreground">Responsable: {invoice.owner}</p>
                          </div>
                        </TableCell>
                        <TableCell>{invoice.client}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="size-4 text-muted-foreground" />
                            {formatShortDate(invoice.dueDate, "Sin vencimiento")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={toneForBucket(bucket)}>{getInvoiceBucketLabel(bucket)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {getInvoiceOutstandingAmount(invoice) <= 0 ? "Ya impactó en caja" : `+${runwayImpact} días de aire`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {getInvoiceOutstandingAmount(invoice) <= 0
                                ? "Esta factura ya quedó cerrada."
                                : `Si entra, suma ${formatCurrency(getInvoiceOutstandingAmount(invoice))} a la caja.`}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            Abrir
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
                    {getInvoiceBucketLabel(getInvoiceBucket(selectedInvoice))}
                  </Badge>
                  <Badge className="bg-muted text-muted-foreground hover:bg-muted">
                    Prioridad {getPriorityLabel(selectedInvoice.priority).toLowerCase()}
                  </Badge>
                </div>
                <SheetTitle className="mt-3 text-xl">{selectedInvoice.id}</SheetTitle>
                <SheetDescription>
                  {selectedInvoice.client} · Responsable: {selectedInvoice.owner}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-4">
                <Card>
                  <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Monto</p>
                      <p className="mt-2 text-2xl font-bold text-foreground">
                        {formatCurrency(selectedInvoice.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Impacto en caja</p>
                      <p className="mt-2 text-lg font-semibold text-success">
                        +{Math.max(1, Math.round(selectedInvoice.amount / Math.max(burnRate, 1)))} días de aire
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground">Emitida</p>
                      <p className="mt-1 font-medium text-foreground">{formatShortDate(selectedInvoice.issueDate)}</p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-xs text-muted-foreground">Vence</p>
                      <p className="mt-1 font-medium text-foreground">{formatShortDate(selectedInvoice.dueDate, "Sin vencimiento")}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Qué significa</CardTitle>
                    <CardDescription>
                      Este panel te dice por qué importa esta factura y qué conviene hacer ahora.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-medium text-primary">Qué pasa si entra</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getInvoiceOutstandingAmount(selectedInvoice) <= 0
                          ? "La plata ya entró, así que el flujo ya no depende de esta factura."
                          : `Si se cobra, entran ${formatCurrency(getInvoiceOutstandingAmount(selectedInvoice))} y se afloja la presión de corto plazo.`}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Por qué mirarla</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getInvoiceBucket(selectedInvoice) === "overdue"
                          ? "Ya está vencida, así que hoy tu negocio está financiando al cliente."
                          : "Forma parte del próximo bloque de cobros y conviene tenerla visible hasta que entre."}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Siguiente paso</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getInvoiceOutstandingAmount(selectedInvoice) <= 0
                          ? "No hace falta hacer nada más que dejar completo el historial de pagos."
                          : "Mandá un recordatorio, dejá visible la promesa de pago y escalá si la fecha se corre."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Detalle</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6">
                    <p className="text-sm text-muted-foreground">{selectedInvoice.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Historial y próximos pagos</CardTitle>
                    <CardDescription>
                      Acá ves lo que ya entró y lo que todavía está prometido.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {selectedInvoice.paymentHistory.length === 0 && selectedInvoice.expectedPayments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados para esta factura.</p>
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
                  Enviar recordatorio
                </Button>
                {getInvoiceOutstandingAmount(selectedInvoice) > 0 && (
                  <Button onClick={() => handleMarkPaid(selectedInvoice.id)}>
                    <CheckCircle2 className="size-4" />
                    {getInvoiceType(selectedInvoice) === "payable" ? "Marcar como pagada" : "Marcar como cobrada"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => {
                    router.push(buildHref({ pathname: "/clients", params: { highlight: selectedInvoice.clientId } }))
                    setSelectedInvoiceId(null)
                  }}
                >
                  Abrir cliente
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva factura</DialogTitle>
            <DialogDescription>
              Sumala para que aparezca en cobros y también en el flujo proyectado.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Cliente</label>
              <Select
                value={form.clientId}
                onValueChange={(value) => setForm((current) => ({ ...current, clientId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elegí un cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientRecords.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Monto</label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  placeholder="9800"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Responsable</label>
                <Input
                  value={form.owner}
                  onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))}
                  placeholder="Cobros"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Fecha de emisión</label>
                <Input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground">Fecha de vencimiento</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Prioridad</label>
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
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground">Descripción</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Explicá qué se cobró y cualquier contexto útil para el equipo."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInvoice}
              disabled={!form.clientId || !form.amount || !form.issueDate || !form.dueDate || !form.description}
            >
              Crear factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

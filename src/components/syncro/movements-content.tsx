"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { differenceInCalendarDays, parseISO } from "date-fns"
import { AlertTriangle, ArrowUpDown, CheckCircle2, ChevronRight, Copy, Download, Plus, Search, Tags, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { CsvImportDialog } from "@/components/syncro/csv-import-dialog"
import { useTransactions } from "@/hooks/use-transactions"
import {
  formatCurrency,
  formatShortDate,
  formatSignedCurrency,
  getCurrentBalance,
  getMovementCounts,
  getMovementSourceLabel,
  getMovementTypeLabel,
  getSignedTransactionAmount,
  getUncategorizedTransactions,
  isImportedTransaction,
  matchesMovementTab,
  type MovementStatus,
  type MovementTab,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

type DateWindow = "all" | "last-7" | "last-30"
type OperationalFilter = "all" | "uncategorized" | "imported" | "detected" | "linked_invoice"
const movementTypeOptions = ["all", "income", "expense"] as const
const movementSourceOptions = ["all", "manual", "email", "bank", "invoice", "import", "telegram", "gmail"] as const
const operationalFilterOptions = ["all", "uncategorized", "imported", "detected", "linked_invoice"] as const

const statusTabs: MovementTab[] = ["confirmed", "pending_review", "duplicate"]

function categoryTone(category: string) {
  if (category === "SaaS") return "bg-primary/15 text-primary hover:bg-primary/15"
  if (category === "Sueldos") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (category === "Cobro de factura") return "bg-success/15 text-success hover:bg-success/15"
  if (category === "Otros") return "bg-muted text-muted-foreground hover:bg-muted"
  return "bg-muted/60 text-foreground hover:bg-muted/60"
}

function statusTone(status: MovementStatus) {
  if (status === "pending_review") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (status === "detected") return "bg-primary/15 text-primary hover:bg-primary/15"
  if (status === "duplicate") return "bg-danger/15 text-danger hover:bg-danger/15"
  return "bg-success/15 text-success hover:bg-success/15"
}

function statusLabel(status: MovementStatus) {
  if (status === "confirmed") return "Confirmado"
  if (status === "pending_review") return "Pendiente de revisión"
  if (status === "detected") return "Detectado"
  return "Duplicado"
}

export function MovementsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { transactions, isLoading, mutate, createTransaction, updateTransaction, deleteTransaction } = useTransactions()

  const [activeTab, setActiveTab] = useState<MovementTab>("confirmed")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [operationalFilter, setOperationalFilter] = useState<OperationalFilter>("all")
  const [dateWindow, setDateWindow] = useState<DateWindow>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    type: "expense" as "expense" | "income",
    category: "Otros",
    source: "manual" as "manual" | "email" | "bank",
    notes: "",
  })

  useEffect(() => {
    const tab = searchParams.get("tab") as MovementTab | null
    const category = searchParams.get("category") ?? "all"
    const type = searchParams.get("type") ?? "all"
    const source = searchParams.get("source") ?? "all"
    const quickFilter = searchParams.get("quickFilter") ?? "all"
    const highlight = searchParams.get("highlight")

    setActiveTab(tab && statusTabs.includes(tab) ? tab : "confirmed")
    setCategoryFilter(category)
    setTypeFilter(
      movementTypeOptions.includes(type as (typeof movementTypeOptions)[number])
        ? type
        : "all",
    )
    setSourceFilter(
      movementSourceOptions.includes(source as (typeof movementSourceOptions)[number])
        ? source
        : "all",
    )
    setOperationalFilter(
      operationalFilterOptions.includes(quickFilter as OperationalFilter)
        ? (quickFilter as OperationalFilter)
        : "all",
    )
    if (highlight && transactions.some((transaction) => transaction.id === highlight)) setSelectedId(highlight)
  }, [searchParams, transactions])

  const categories = useMemo(() => {
    const items = new Set(
      transactions.flatMap((transaction) =>
        transaction.suggestedCategory ? [transaction.category, transaction.suggestedCategory] : [transaction.category],
      ),
    )
    return ["all", ...Array.from(items).sort()]
  }, [transactions])

  const counts = useMemo(() => getMovementCounts(transactions), [transactions])
  const uncategorized = useMemo(() => getUncategorizedTransactions(transactions), [transactions])
  const selected = useMemo(
    () => transactions.find((transaction) => transaction.id === selectedId) ?? null,
    [selectedId, transactions],
  )

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const query = search.trim().toLowerCase()
      const age = differenceInCalendarDays(new Date(), parseISO(transaction.date))
      const matchesOperational =
        operationalFilter === "all" ||
        (operationalFilter === "uncategorized" &&
          (transaction.category === "Otros" || transaction.category.trim().length === 0 || Boolean(transaction.suggestedCategory))) ||
        (operationalFilter === "imported" && isImportedTransaction(transaction)) ||
        (operationalFilter === "detected" && transaction.status === "detected") ||
        (operationalFilter === "linked_invoice" && Boolean(transaction.invoiceId))

      return (
        matchesMovementTab(transaction.status, activeTab) &&
        (categoryFilter === "all" || transaction.category === categoryFilter) &&
        (typeFilter === "all" || transaction.type === typeFilter) &&
        (sourceFilter === "all" || transaction.source === sourceFilter) &&
        matchesOperational &&
        (dateWindow === "all" ||
          (dateWindow === "last-7" && age <= 7) ||
          (dateWindow === "last-30" && age <= 30)) &&
        (!query ||
          transaction.description.toLowerCase().includes(query) ||
          transaction.category.toLowerCase().includes(query) ||
          transaction.notes?.toLowerCase().includes(query) ||
          transaction.invoiceId?.toLowerCase().includes(query) ||
          JSON.stringify(transaction.sourceData ?? "").toLowerCase().includes(query))
      )
    })
  }, [activeTab, categoryFilter, dateWindow, operationalFilter, search, sourceFilter, transactions, typeFilter])

  const totals = useMemo(() => {
    const income = filtered.filter((transaction) => transaction.type === "income").reduce((sum, transaction) => sum + transaction.amount, 0)
    const expenses = filtered.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [filtered])
  const currentCashBalance = useMemo(() => getCurrentBalance(transactions), [transactions])

  const exportCSV = () => {
    const rows = [
      ["Fecha", "Descripción", "Monto", "Tipo", "Categoría", "Origen", "Estado", "FacturaRelacionada", "CategoriaSugerida"].join(","),
      ...filtered.map((transaction) =>
        [transaction.date, transaction.description, transaction.amount, transaction.type, transaction.category, transaction.source, transaction.status, transaction.invoiceId ?? "", transaction.suggestedCategory ?? ""].join(","),
      ),
    ]
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "syncro-movements.csv"
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Movimientos exportados")
  }

  const addManualMovement = async () => {
    try {
      await createTransaction({
        date: draft.date,
        description: draft.description,
        amount: Number(draft.amount),
        type: draft.type,
        category: draft.category,
        source: draft.source,
        notes: draft.notes || undefined,
      })
      toast.success("Movimiento agregado")
      setCreateOpen(false)
      setDraft({ date: new Date().toISOString().slice(0, 10), description: "", amount: "", type: "expense", category: "Otros", source: "manual", notes: "" })
    } catch {
      toast.error("Error al agregar el movimiento")
    }
  }

  const focus = searchParams.get("focus")

  if (isLoading) {
    return <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6"><div className="animate-pulse rounded-xl border bg-card p-6"><div className="h-6 w-56 rounded bg-muted" /></div></div>
  }

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Movimientos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acá ves qué ya está bien cargado, qué todavía hay que revisar y cómo eso impacta tu caja real.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CsvImportDialog entityType="transactions" onImported={() => mutate().then(() => undefined)} />
            <Button variant="outline" onClick={exportCSV}><Download className="size-4" />Exportar CSV</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="size-4" />Agregar movimiento</Button>
          </div>
        </div>

        {(focus === "saas" || focus === "supplier") && (
          <Card className={cn(focus === "saas" ? "border-primary/30 bg-primary/5" : "border-warning/30 bg-warning/5")}>
            <CardContent className="flex items-start gap-3 px-6 py-5">
              <AlertTriangle className={cn("mt-0.5 size-5", focus === "saas" ? "text-primary" : "text-warning")} />
              <div>
                <p className={cn("text-sm font-semibold", focus === "saas" ? "text-primary" : "text-warning")}>
                  {focus === "saas" ? "Revisá herramientas recurrentes, cargos detectados y categorías sugeridas." : "El pago a proveedor sigue presionando la caja de corto plazo."}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Esta vista sirve para limpiar la base operativa y hacer que el flujo diga la verdad.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Caja actual</p><p className={cn("mt-3 text-2xl font-bold", currentCashBalance < 0 ? "text-danger" : "text-foreground")}>{formatSignedCurrency(currentCashBalance)}</p><p className="mt-1 text-xs text-muted-foreground">Sale de movimientos confirmados</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ingresos de esta vista</p><p className="mt-3 text-2xl font-bold text-success">{formatCurrency(totals.income)}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Egresos de esta vista</p><p className="mt-3 text-2xl font-bold text-danger">{formatCurrency(totals.expenses)}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Resultado de esta vista</p><p className={cn("mt-3 text-2xl font-bold", totals.net < 0 ? "text-danger" : "text-success")}>{formatSignedCurrency(totals.net)}</p><p className="mt-1 text-xs text-muted-foreground">Puede cambiar si filtrás la tabla</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Sin categoría clara</p><p className="mt-3 text-2xl font-bold text-warning">{uncategorized.length}</p></CardContent></Card>
        </div>
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de movimientos</CardTitle>
                <CardDescription>Filtrá para ver qué ya quedó bien, qué necesita revisión y qué datos todavía están poco claros.</CardDescription>
              </div>
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Buscar por concepto, nota o factura relacionada" />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MovementTab)}>
              <TabsList className="flex w-full flex-wrap justify-start">
                <TabsTrigger value="confirmed">Ya está bien ({counts.confirmed})</TabsTrigger>
                <TabsTrigger value="pending_review">Revisar ({counts.pending_review})</TabsTrigger>
                <TabsTrigger value="duplicate">Duplicados ({counts.duplicate})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex flex-wrap gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "uncategorized", label: `Sin categoría clara (${uncategorized.length})` },
                { value: "imported", label: "Importados" },
                { value: "detected", label: `Detectados (${counts.detected})` },
                { value: "linked_invoice", label: "Con factura asociada" },
              ].map((filter) => (
                <Button key={filter.value} type="button" variant={operationalFilter === filter.value ? "default" : "outline"} size="sm" onClick={() => setOperationalFilter(filter.value as OperationalFilter)}>
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Todas las categorías" /></SelectTrigger>
                <SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category === "all" ? "Todas las categorías" : category}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="Todos los tipos" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todos los tipos</SelectItem><SelectItem value="income">Ingreso</SelectItem><SelectItem value="expense">Gasto</SelectItem></SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger><SelectValue placeholder="Todos los orígenes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los orígenes</SelectItem>
                  {movementSourceOptions
                    .filter((source) => source !== "all")
                    .map((source) => (
                      <SelectItem key={source} value={source}>
                        {getMovementSourceLabel(source)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Select value={dateWindow} onValueChange={(value) => setDateWindow(value as DateWindow)}>
                <SelectTrigger><SelectValue placeholder="Todas las fechas" /></SelectTrigger>
                <SelectContent><SelectItem value="all">Todas las fechas</SelectItem><SelectItem value="last-7">Últimos 7 días</SelectItem><SelectItem value="last-30">Últimos 30 días</SelectItem></SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {uncategorized.length > 0 && (
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <Tags className="mt-0.5 size-4 text-warning" />
                  <div>
                    <p className="text-sm font-semibold text-warning">Prioridad de limpieza</p>
                    <p className="mt-1 text-sm text-muted-foreground">{uncategorized[0].description} podría moverse a {uncategorized[0].suggestedCategory ?? "una categoría más clara"}.</p>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Origen / estado</TableHead>
                  <TableHead>Factura relacionada</TableHead>
                  <TableHead>Categoría sugerida</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">No hay movimientos que coincidan con los filtros.</TableCell></TableRow>
                ) : (
                  filtered.map((transaction) => {
                    const highlighted = searchParams.get("highlight") === transaction.id
                    return (
                      <TableRow key={transaction.id} onClick={() => setSelectedId(transaction.id)} className={cn("cursor-pointer", highlighted && "bg-primary/10 ring-1 ring-primary/30")}>
                        <TableCell>{formatShortDate(transaction.date)}</TableCell>
                        <TableCell><div><p className="font-medium text-foreground">{transaction.description}</p><p className="text-xs text-muted-foreground">{transaction.notes ?? "Sin notas adicionales"}</p></div></TableCell>
                        <TableCell className={cn("font-semibold", transaction.type === "income" ? "text-success" : "text-danger")}>{formatSignedCurrency(getSignedTransactionAmount(transaction))}</TableCell>
                        <TableCell><Badge className={categoryTone(transaction.category)}>{transaction.category}</Badge></TableCell>
                        <TableCell><div className="space-y-1"><p>{getMovementSourceLabel(transaction.source)}</p><Badge className={statusTone(transaction.status)}>{statusLabel(transaction.status)}</Badge></div></TableCell>
                        <TableCell>{transaction.invoiceId ? <span className="font-mono text-xs">{transaction.invoiceId}</span> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                        <TableCell>{transaction.suggestedCategory ? <Badge className="bg-warning/15 text-warning hover:bg-warning/15">{transaction.suggestedCategory}</Badge> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm">Abrir<ChevronRight className="size-4" /></Button></TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader className="border-b pb-4">
                <div className="flex items-center gap-2">
                  <Badge className={statusTone(selected.status)}>{statusLabel(selected.status)}</Badge>
                  <Badge className={categoryTone(selected.category)}>{selected.category}</Badge>
                </div>
                <SheetTitle className="mt-3 text-xl">{selected.description}</SheetTitle>
                <SheetDescription>{selected.id} · {formatShortDate(selected.date)} · {getMovementSourceLabel(selected.source)}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-4">
                <Card>
                  <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Monto</p><p className={cn("mt-2 text-2xl font-bold", selected.type === "income" ? "text-success" : "text-danger")}>{formatSignedCurrency(getSignedTransactionAmount(selected))}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Tipo</p><p className="mt-2 text-lg font-semibold text-foreground">{getMovementTypeLabel(selected.type)}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><p className="text-xs text-muted-foreground">Origen</p><p className="mt-1 font-medium text-foreground">{getMovementSourceLabel(selected.source)}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><p className="text-xs text-muted-foreground">Estado</p><p className="mt-1 font-medium text-foreground">{statusLabel(selected.status)}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><p className="text-xs text-muted-foreground">Factura relacionada</p><p className="mt-1 font-medium text-foreground">{selected.invoiceId ?? "-"}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><p className="text-xs text-muted-foreground">Categoría sugerida</p><p className="mt-1 font-medium text-foreground">{selected.suggestedCategory ?? "-"}</p></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Qué revisar</CardTitle><CardDescription>Este panel te ayuda a decidir si lo dejás así, lo corregís o lo descartás.</CardDescription></CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Detalle importado</p>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 text-xs text-muted-foreground">{JSON.stringify(selected.sourceData ?? null, null, 2)}</pre>
                    </div>
                    {selected.notes && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-medium text-primary">Nota</p><p className="mt-1 text-sm text-muted-foreground">{selected.notes}</p></div>}
                    {selected.suggestedCategory && <div className="rounded-xl border border-warning/20 bg-warning/5 p-4"><p className="text-sm font-medium text-warning">Sugerencia de categoría</p><p className="mt-1 text-sm text-muted-foreground">{selected.suggestedCategory}</p></div>}
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Cambiar categoría</p>
                      <Select value={selected.category} onValueChange={async (value) => { try { await updateTransaction(selected.id, { category: value }) } catch { toast.error("Error al actualizar la categoría") } }}>
                        <SelectTrigger className="mt-3"><SelectValue /></SelectTrigger>
                        <SelectContent>{categories.filter((category) => category !== "all").map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SheetFooter className="border-t pt-4">
                {(selected.status === "pending_review" || selected.status === "detected") && <Button onClick={async () => { try { await updateTransaction(selected.id, { status: "confirmed" }); toast.success("Movimiento confirmado") } catch { toast.error("Error al confirmar") } }}><CheckCircle2 className="size-4" />Confirmar</Button>}
                {selected.status === "detected" && <Button variant="outline" onClick={async () => { try { await updateTransaction(selected.id, { status: "pending_review" }); toast.success("Pasó a pendiente de revisión") } catch { toast.error("Error al actualizar") } }}><AlertTriangle className="size-4" />Mandar a revisar</Button>}
                {selected.status === "duplicate" && <Button onClick={async () => { try { await updateTransaction(selected.id, { status: "confirmed" }); toast.success("Duplicado conservado") } catch { toast.error("Error al conservar") } }}><Copy className="size-4" />Conservar</Button>}
                {selected.invoiceId && <Button variant="outline" onClick={() => router.push(`/invoices?highlight=${selected.invoiceId}`)}><ArrowUpDown className="size-4" />Ver factura</Button>}
                <Button variant="destructive" onClick={async () => { try { await deleteTransaction(selected.id); setSelectedId(null); toast.success("Movimiento eliminado") } catch { toast.error("Error al eliminar") } }}><Trash2 className="size-4" />Eliminar</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar movimiento</DialogTitle>
            <DialogDescription>Las cargas manuales impactan la caja apenas se agregan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Fecha</label><Input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Tipo</label><Select value={draft.type} onValueChange={(value) => setDraft((current) => ({ ...current, type: value as "expense" | "income" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Gasto</SelectItem><SelectItem value="income">Ingreso</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Descripción</label><Input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="Ej. devolución de AWS o cobro de cliente" /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Monto</label><Input type="number" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="1200" /></div>
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Categoría</label><Select value={draft.category} onValueChange={(value) => setDraft((current) => ({ ...current, category: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.filter((category) => category !== "all").map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Origen</label><Select value={draft.source} onValueChange={(value) => setDraft((current) => ({ ...current, source: value as "manual" | "email" | "bank" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="bank">Banco</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Notas</label><Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Contexto opcional para entender mejor este movimiento." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={addManualMovement} disabled={!draft.date || !draft.description || !draft.amount || !draft.category}>Agregar movimiento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

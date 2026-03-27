"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { differenceInCalendarDays, parseISO } from "date-fns"
import {
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useStore } from "@/lib/store"
import {
  formatCurrency,
  formatShortDate,
  formatSignedCurrency,
  getMovementCounts,
  getUncategorizedTransactions,
  type MovementTab,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

type DateWindow = "all" | "last-7" | "last-30"

const statusTabs: MovementTab[] = ["confirmed", "pending", "duplicate"]

function categoryTone(category: string) {
  if (category === "SaaS") return "bg-primary/15 text-primary hover:bg-primary/15"
  if (category === "Payroll") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (category === "Invoice payment") return "bg-success/15 text-success hover:bg-success/15"
  if (category === "Other") return "bg-muted text-muted-foreground hover:bg-muted"
  return "bg-muted/60 text-foreground hover:bg-muted/60"
}

function statusTone(status: MovementTab) {
  if (status === "pending") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (status === "duplicate") return "bg-danger/15 text-danger hover:bg-danger/15"
  return "bg-success/15 text-success hover:bg-success/15"
}

export function MovementsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const transactions = useStore((state) => state.transactions)
  const addTransaction = useStore((state) => state.addTransaction)
  const updateTransaction = useStore((state) => state.updateTransaction)
  const deleteTransaction = useStore((state) => state.deleteTransaction)

  const [activeTab, setActiveTab] = useState<MovementTab>("confirmed")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [dateWindow, setDateWindow] = useState<DateWindow>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    type: "expense" as "expense" | "income",
    category: "Other",
    source: "manual" as "manual" | "email" | "bank",
    notes: "",
  })

  useEffect(() => {
    const tab = searchParams.get("tab") as MovementTab | null
    const category = searchParams.get("category")
    const highlight = searchParams.get("highlight")

    if (tab && statusTabs.includes(tab)) setActiveTab(tab)
    if (category) setCategoryFilter(category)
    if (highlight && transactions.some((transaction) => transaction.id === highlight)) setSelectedId(highlight)
  }, [searchParams, transactions])

  const categories = useMemo(() => {
    const items = new Set(
      transactions.flatMap((transaction) =>
        transaction.suggestedCategory
          ? [transaction.category, transaction.suggestedCategory]
          : [transaction.category],
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

      return (
        transaction.status === activeTab &&
        (categoryFilter === "all" || transaction.category === categoryFilter) &&
        (typeFilter === "all" || transaction.type === typeFilter) &&
        (sourceFilter === "all" || transaction.source === sourceFilter) &&
        (dateWindow === "all" ||
          (dateWindow === "last-7" && age <= 7) ||
          (dateWindow === "last-30" && age <= 30)) &&
        (!query ||
          transaction.description.toLowerCase().includes(query) ||
          transaction.category.toLowerCase().includes(query) ||
          transaction.notes?.toLowerCase().includes(query))
      )
    })
  }, [activeTab, categoryFilter, dateWindow, search, sourceFilter, transactions, typeFilter])

  const totals = useMemo(() => {
    const income = filtered.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0)
    const expenses = filtered.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
    return { income, expenses, net: income - expenses }
  }, [filtered])

  const exportCSV = () => {
    const rows = [
      ["Date", "Description", "Amount", "Type", "Category", "Source", "Status"].join(","),
      ...filtered.map((transaction) =>
        [transaction.date, transaction.description, transaction.amount, transaction.type, transaction.category, transaction.source, transaction.status].join(","),
      ),
    ]
    const blob = new Blob([rows.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "syncro-movements.csv"
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success("Movements exported")
  }

  const addManualMovement = () => {
    addTransaction({
      id: `T${String(Date.now()).slice(-6)}`,
      date: draft.date,
      description: draft.description,
      amount: draft.type === "expense" ? -Math.abs(Number(draft.amount)) : Math.abs(Number(draft.amount)),
      type: draft.type,
      category: draft.category,
      source: draft.source,
      status: "confirmed",
      notes: draft.notes,
    })
    toast.success("Movement added")
    setCreateOpen(false)
    setDraft({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: "",
      type: "expense",
      category: "Other",
      source: "manual",
      notes: "",
    })
  }

  const focus = searchParams.get("focus")

  return (
    <>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Movements</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirmed entries, auto-detected movements, duplicates, and category cleanup.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={exportCSV}>
              <Download className="size-4" />
              Export CSV
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add movement
            </Button>
          </div>
        </div>

        {(focus === "saas" || focus === "supplier") && (
          <Card className={cn(focus === "saas" ? "border-primary/30 bg-primary/5" : "border-warning/30 bg-warning/5")}>
            <CardContent className="flex items-start gap-3 px-6 py-5">
              <AlertTriangle className={cn("mt-0.5 size-5", focus === "saas" ? "text-primary" : "text-warning")} />
              <div>
                <p className={cn("text-sm font-semibold", focus === "saas" ? "text-primary" : "text-warning")}>
                  {focus === "saas"
                    ? "Review recurring tools and pending SaaS detections."
                    : "The supplier payment is one of the main forecast pressure points."}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use the filters below to inspect the relevant movements and then jump back to cashflow if needed.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Money in</p><p className="mt-3 text-2xl font-bold text-success">{formatCurrency(totals.income)}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Money out</p><p className="mt-3 text-2xl font-bold text-danger">{formatCurrency(totals.expenses)}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Net</p><p className={cn("mt-3 text-2xl font-bold", totals.net < 0 ? "text-danger" : "text-success")}>{formatSignedCurrency(totals.net)}</p></CardContent></Card>
          <Card><CardContent className="px-5 py-5"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Needs category</p><p className="mt-3 text-2xl font-bold text-warning">{uncategorized.length}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Movement workspace</CardTitle>
                <CardDescription>Filter by stage, category, type, source, or recency.</CardDescription>
              </div>
              <div className="relative min-w-[260px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search description or notes" />
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MovementTab)}>
              <TabsList className="flex w-full flex-wrap justify-start">
                <TabsTrigger value="confirmed">Confirmed ({counts.confirmed})</TabsTrigger>
                <TabsTrigger value="pending">Auto-detected ({counts.pending})</TabsTrigger>
                <TabsTrigger value="duplicate">Duplicates ({counts.duplicate})</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>{categories.map((category) => <SelectItem key={category} value={category}>{category === "all" ? "All categories" : category}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger><SelectValue placeholder="All sources" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="manual">Manual</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent>
              </Select>
              <Select value={dateWindow} onValueChange={(value) => setDateWindow(value as DateWindow)}>
                <SelectTrigger><SelectValue placeholder="All dates" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All dates</SelectItem><SelectItem value="last-7">Last 7 days</SelectItem><SelectItem value="last-30">Last 30 days</SelectItem></SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {uncategorized.length > 0 && (
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <Tags className="mt-0.5 size-4 text-warning" />
                  <div>
                    <p className="text-sm font-semibold text-warning">Suggested category available</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {uncategorized[0].description} can likely move to {uncategorized[0].suggestedCategory ?? "a clearer category"}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Suggested</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">No movements match the current filters.</TableCell></TableRow>
                ) : (
                  filtered.map((transaction) => {
                    const highlighted = searchParams.get("highlight") === transaction.id
                    return (
                      <TableRow key={transaction.id} onClick={() => setSelectedId(transaction.id)} className={cn("cursor-pointer", highlighted && "bg-primary/10 ring-1 ring-primary/30")}>
                        <TableCell>{formatShortDate(transaction.date)}</TableCell>
                        <TableCell><div><p className="font-medium text-foreground">{transaction.description}</p><p className="text-xs text-muted-foreground">{transaction.notes ?? "No additional notes"}</p></div></TableCell>
                        <TableCell className={cn("font-semibold", transaction.amount > 0 ? "text-success" : "text-danger")}>{formatSignedCurrency(transaction.amount)}</TableCell>
                        <TableCell><Badge className={categoryTone(transaction.category)}>{transaction.category}</Badge></TableCell>
                        <TableCell className="capitalize">{transaction.source}</TableCell>
                        <TableCell>{transaction.suggestedCategory ? <Badge className="bg-warning/15 text-warning hover:bg-warning/15">{transaction.suggestedCategory}</Badge> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm">Open<ChevronRight className="size-4" /></Button></TableCell>
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
                  <Badge className={statusTone(selected.status)}>{selected.status}</Badge>
                  <Badge className={categoryTone(selected.category)}>{selected.category}</Badge>
                </div>
                <SheetTitle className="mt-3 text-xl">{selected.description}</SheetTitle>
                <SheetDescription>{selected.id} - {formatShortDate(selected.date)} - {selected.source}</SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-4">
                <Card>
                  <CardContent className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                    <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Amount</p><p className={cn("mt-2 text-2xl font-bold", selected.amount > 0 ? "text-success" : "text-danger")}>{formatSignedCurrency(selected.amount)}</p></div>
                    <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Type</p><p className="mt-2 text-lg font-semibold capitalize text-foreground">{selected.type}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><p className="text-xs text-muted-foreground">Source</p><p className="mt-1 font-medium capitalize text-foreground">{selected.source}</p></div>
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4"><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 font-medium capitalize text-foreground">{selected.status}</p></div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Review</CardTitle><CardDescription>Resolve duplicates, confirm detections, and clean categories.</CardDescription></CardHeader>
                  <CardContent className="space-y-3 px-6 pb-6">
                    {selected.notes && <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-medium text-primary">Note</p><p className="mt-1 text-sm text-muted-foreground">{selected.notes}</p></div>}
                    {selected.suggestedCategory && <div className="rounded-xl border border-warning/20 bg-warning/5 p-4"><p className="text-sm font-medium text-warning">Suggested category</p><p className="mt-1 text-sm text-muted-foreground">{selected.suggestedCategory}</p></div>}
                    <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                      <p className="text-sm font-medium text-foreground">Update category</p>
                      <Select value={selected.category} onValueChange={(value) => updateTransaction(selected.id, { category: value })}>
                        <SelectTrigger className="mt-3"><SelectValue /></SelectTrigger>
                        <SelectContent>{categories.filter((category) => category !== "all").map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <SheetFooter className="border-t pt-4">
                {selected.status === "pending" && <Button onClick={() => { updateTransaction(selected.id, { status: "confirmed" }); toast.success("Movement confirmed") }}><CheckCircle2 className="size-4" />Confirm</Button>}
                {selected.status === "duplicate" && <Button onClick={() => { updateTransaction(selected.id, { status: "confirmed" }); toast.success("Duplicate kept as valid") }}><Copy className="size-4" />Keep</Button>}
                {selected.relatedInvoiceId && <Button variant="outline" onClick={() => router.push(`/invoices?highlight=${selected.relatedInvoiceId}`)}><ArrowUpDown className="size-4" />Open invoice</Button>}
                <Button variant="destructive" onClick={() => { deleteTransaction(selected.id); setSelectedId(null); toast.success("Movement deleted") }}><Trash2 className="size-4" />Delete</Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add movement</DialogTitle>
            <DialogDescription>Manual entries go directly into the mocked dataset.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Date</label><Input type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></div>
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Type</label><Select value={draft.type} onValueChange={(value) => setDraft((current) => ({ ...current, type: value as "expense" | "income" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Description</label><Input value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="AWS credit refund" /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Amount</label><Input type="number" value={draft.amount} onChange={(event) => setDraft((current) => ({ ...current, amount: event.target.value }))} placeholder="1200" /></div>
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Category</label><Select value={draft.category} onValueChange={(value) => setDraft((current) => ({ ...current, category: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.filter((category) => category !== "all").map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div>
              <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Source</label><Select value={draft.source} onValueChange={(value) => setDraft((current) => ({ ...current, source: value as "manual" | "email" | "bank" }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="manual">Manual</SelectItem><SelectItem value="bank">Bank</SelectItem><SelectItem value="email">Email</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><label className="text-sm font-medium text-foreground">Notes</label><Textarea value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} placeholder="Optional context." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={addManualMovement} disabled={!draft.date || !draft.description || !draft.amount || !draft.category}>Add movement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

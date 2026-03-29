"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { AlertTriangle, ArrowRight, ChevronRight, CircleDollarSign, Clock, Loader2, RefreshCw, TrendingUp, Zap } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCashflow } from "@/hooks/use-cashflow"
import { useInsights } from "@/hooks/use-insights"
import { useInvoices } from "@/hooks/use-invoices"
import { useTransactions } from "@/hooks/use-transactions"
import { apiFetch } from "@/lib/api"
import type { Insight, Invoice } from "@/lib/data"
import type { TodayAction } from "@/lib/syncro"
import { getInvoiceBucket, getInvoiceOutstandingAmount } from "@/lib/syncro"
import { cn, formatearMoneda } from "@/lib/utils"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const CHART_COLORS = [
  "oklch(0.50 0.23 255)",
  "oklch(0.52 0.18 160)",
  "oklch(0.55 0.18 75)",
  "oklch(0.50 0.22 25)",
  "oklch(0.65 0.17 85)",
  "oklch(0.55 0.18 310)",
]

function severidadLabel(s: string) {
  if (s === "critical") return "Crítico"
  if (s === "high") return "Alto"
  if (s === "medium") return "Medio"
  return "Bajo"
}

function severidadClases(s: string) {
  if (s === "critical") return "bg-danger/15 text-danger hover:bg-danger/15"
  if (s === "high") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (s === "medium") return "bg-primary/15 text-primary hover:bg-primary/15"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

function priorityIcon(priority: TodayAction["priority"]) {
  if (priority === "critical") return <AlertTriangle className="size-4 text-danger shrink-0 mt-0.5" />
  if (priority === "high") return <Clock className="size-4 text-warning shrink-0 mt-0.5" />
  return <Zap className="size-4 text-primary shrink-0 mt-0.5" />
}

function estadoScore(score: number) {
  if (score < 40) return { texto: "Hoy necesitás mirar la caja de cerca", claseBg: "bg-danger/10 border-danger/30", claseNum: "text-danger" }
  if (score < 65) return { texto: "Hay algunos puntos para ordenar", claseBg: "bg-warning/10 border-warning/30", claseNum: "text-warning" }
  return { texto: "La operación está bastante ordenada", claseBg: "bg-success/10 border-success/30", claseNum: "text-success" }
}

/** Cobros pendientes agrupados por cliente */
function calcularCobros(invoices: Invoice[]) {
  const porCobrar = invoices.filter((i) => getInvoiceOutstandingAmount(i) > 0)
  const vencidas = porCobrar.filter((i) => getInvoiceBucket(i) === "overdue")

  const hoy = new Date()
  const en7Dias = new Date(hoy)
  en7Dias.setDate(hoy.getDate() + 7)

  const porVencer7d = porCobrar.filter((i) => {
    if (getInvoiceBucket(i) !== "due-soon" || !i.dueDate) return false
    const vence = new Date(i.dueDate)
    return vence >= hoy && vence <= en7Dias
  })

  // Agrupar por cliente
  const porCliente: Record<string, { monto: number; tieneVencida: boolean }> = {}
  for (const inv of porCobrar) {
    const nombre = inv.client || "Sin nombre"
    if (!porCliente[nombre]) porCliente[nombre] = { monto: 0, tieneVencida: false }
    porCliente[nombre].monto += getInvoiceOutstandingAmount(inv)
    if (getInvoiceBucket(inv) === "overdue") porCliente[nombre].tieneVencida = true
  }

  const clientes = Object.entries(porCliente)
    .sort((a, b) => b[1].monto - a[1].monto)
    .slice(0, 5)
    .map(([nombre, data]) => ({ nombre, ...data }))

  return {
    total: porCobrar.reduce((s, i) => s + getInvoiceOutstandingAmount(i), 0),
    montoVencidas: vencidas.reduce((s, i) => s + getInvoiceOutstandingAmount(i), 0),
    cantVencidas: vencidas.length,
    montoPorVencer7d: porVencer7d.reduce((s, i) => s + getInvoiceOutstandingAmount(i), 0),
    clientes,
  }
}

/** Factores de riesgo en lenguaje llano para el dueño */
function factoresDeRiesgo(insights: Insight[], pendientes: number, daysUntilZero: number | null): string[] {
  const factores: string[] = []

  const criticos = insights.filter((i) => i.severity === "critical" || i.severity === "high").slice(0, 3)
  for (const ins of criticos) {
    factores.push(ins.summary)
  }

  if (pendientes > 0 && factores.length < 3) {
    factores.push(`${pendientes} movimiento${pendientes > 1 ? "s" : ""} sin revisar`)
  }

  if (daysUntilZero != null && daysUntilZero <= 30 && factores.length < 3) {
    factores.push(`Te quedás sin caja en ${daysUntilZero} días`)
  }

  return factores.slice(0, 3)
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function TooltipGasto({ active, payload }: {
  active?: boolean
  payload?: { name: string; value: number; payload: { percentage: number } }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">
        {formatearMoneda(payload[0].value)} · {payload[0].payload.percentage}%
      </p>
    </div>
  )
}

function CardAccion({ action, onNavigate }: { action: TodayAction; onNavigate: (target: TodayAction["target"]) => void }) {
  const borderClass =
    action.priority === "critical"
      ? "border-danger/30 bg-danger/5"
      : action.priority === "high"
        ? "border-warning/30 bg-warning/5"
        : "border-primary/20 bg-primary/5"

  return (
    <div className={cn("rounded-xl border p-4 flex items-start gap-3", borderClass)}>
      {priorityIcon(action.priority)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{action.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{action.description}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {action.moneyImpact !== 0 && (
            <span className={cn("text-xs font-medium", action.moneyImpact > 0 ? "text-success" : "text-danger")}>
              {action.moneyImpact > 0 ? "+" : ""}{formatearMoneda(action.moneyImpact)}
            </span>
          )}
          {action.daysImpact !== 0 && (
            <span className="text-xs text-muted-foreground">
              {action.daysImpact > 0 ? `+${action.daysImpact}` : action.daysImpact} días de caja
            </span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0 text-xs"
        onClick={() => onNavigate(action.target)}
      >
        {action.owner}
        <ArrowRight className="size-3 ml-1" />
      </Button>
    </div>
  )
}

function CardInsight({ insight, onNavigate }: {
  insight: Insight
  onNavigate: (target: Insight["target"]) => void
}) {
  return (
    <Card className={cn(
      "transition-all",
      insight.severity === "critical" && "border-danger/30",
      insight.severity === "high" && "border-warning/20",
    )}>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Badge className={cn("shrink-0 mt-0.5", severidadClases(insight.severity))}>
            {severidadLabel(insight.severity)}
          </Badge>
          <p className="text-sm font-semibold text-foreground leading-snug">{insight.title}</p>
        </div>

        {/* Resumen */}
        <p className="text-sm text-muted-foreground">{insight.summary}</p>

        <div className="space-y-2">
          <div className="rounded-lg border bg-muted/10 px-3 py-2">
            <p className="text-xs font-medium text-foreground mb-0.5">Qué pasa</p>
            <p className="text-xs text-muted-foreground">{insight.what || insight.summary}</p>
          </div>
          <div className="rounded-lg border bg-muted/10 px-3 py-2">
            <p className="text-xs font-medium text-foreground mb-0.5">Por qué importa</p>
            <p className="text-xs text-muted-foreground">{insight.why}</p>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <p className="text-xs font-medium text-primary mb-0.5">Qué hacer</p>
            <p className="text-xs text-muted-foreground">{insight.action}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground">
              Dónde hacer clic: <span className="font-medium text-foreground">{insight.ctaLabel}</span>
            </p>
            <div className="flex items-center gap-4 text-xs">
              {insight.moneyImpact !== 0 && (
              <span className={cn("font-medium", insight.moneyImpact > 0 ? "text-success" : "text-danger")}>
                {insight.moneyImpact > 0 ? "+" : ""}{formatearMoneda(insight.moneyImpact)}
              </span>
              )}
              {insight.daysImpact !== 0 && (
              <span className="text-muted-foreground">
                {insight.daysImpact > 0 ? `+${insight.daysImpact}` : insight.daysImpact} días de caja
              </span>
              )}
            </div>
          </div>
          {insight.ctaLabel && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7"
              onClick={() => onNavigate(insight.target)}
            >
              {insight.ctaLabel}
              <ChevronRight className="size-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function SkeletonInsights() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function InsightsContent() {
  const router = useRouter()
  const [generando, setGenerando] = useState(false)
  const [filtroSeveridad, setFiltroSeveridad] = useState<"all" | "critical" | "high" | "medium" | "low">("all")

  const { healthScore, insights, expenseBreakdown: rawBreakdown, todayActions, isLoading, mutate } = useInsights()
  const { invoices } = useInvoices()
  const { metrics } = useCashflow()
  const { transactions } = useTransactions()

  const cobros = useMemo(() => calcularCobros(invoices), [invoices])
  const gastos = useMemo(() => rawBreakdown.slice(0, 6), [rawBreakdown])
  const totalGastos = useMemo(() => gastos.reduce((s, g) => s + g.amount, 0), [gastos])

  const pendientes = useMemo(
    () =>
      transactions.filter(
        (t) => t.status === "pending_review" || t.status === "detected" || t.status === "duplicate",
      ).length,
    [transactions],
  )

  const insightsOrdenados = useMemo(
    () => [...insights].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4)),
    [insights],
  )

  const insightsFiltrados = useMemo(
    () => filtroSeveridad === "all" ? insightsOrdenados : insightsOrdenados.filter((i) => i.severity === filtroSeveridad),
    [insightsOrdenados, filtroSeveridad],
  )

  const severityCounts = useMemo(
    () => ({
      all: insights.length,
      critical: insights.filter((i) => i.severity === "critical").length,
      high: insights.filter((i) => i.severity === "high").length,
      medium: insights.filter((i) => i.severity === "medium").length,
      low: insights.filter((i) => i.severity === "low").length,
    }),
    [insights],
  )

  const factores = useMemo(
    () => factoresDeRiesgo(insights, pendientes, metrics?.daysUntilZero ?? null),
    [insights, pendientes, metrics],
  )

  const { texto: textoEstado, claseBg, claseNum } = estadoScore(healthScore)

  const handleNavegar = (target: { pathname: string; params?: Record<string, string> }) => {
    const query = target.params ? `?${new URLSearchParams(target.params)}` : ""
    router.push(`${target.pathname}${query}`)
  }

  const handleGenerarInsights = async () => {
    setGenerando(true)
    try {
      await apiFetch("/api/insights/generar", { method: "POST" })
      await mutate()
      toast.success("Análisis actualizado")
    } catch {
      toast.error("No se pudo actualizar el análisis")
    } finally {
      setGenerando(false)
    }
  }

  if (isLoading) return <SkeletonInsights />

  // Acciones de hoy: todayActions primero, luego insights críticos/altos si no hay suficientes
  const accionesDeHoy: TodayAction[] = todayActions.length > 0
    ? todayActions.slice(0, 3)
    : insightsOrdenados
      .filter((i) => i.severity === "critical" || i.severity === "high")
      .slice(0, 2)
      .map((i) => ({
        id: i.id,
        title: i.title,
        description: i.action || i.summary,
        priority: i.severity === "critical" ? "critical" : "high",
        moneyImpact: i.moneyImpact,
        daysImpact: i.daysImpact,
        owner: i.ctaLabel || "Ver",
        target: i.target,
      }))

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">

      {/* ── Banner de estado ───────────────────────────────────────── */}
      <div className={cn("rounded-xl border px-5 py-3 flex items-center justify-between gap-4", claseBg)}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={cn("size-5 shrink-0", healthScore < 40 ? "text-danger" : healthScore < 65 ? "text-warning" : "text-success")} />
          <div>
            <p className="text-sm font-semibold text-foreground">Señales para decidir mejor</p>
            <p className="text-xs text-muted-foreground">
              <span className={cn("font-semibold", claseNum)}>{textoEstado}</span>
              {metrics?.daysUntilZero != null && (
                <> · Si no cambia nada, la caja alcanza <span className={cn("font-bold", metrics.daysUntilZero < 15 ? "text-danger" : metrics.daysUntilZero < 30 ? "text-warning" : "text-success")}>{metrics.daysUntilZero} días</span></>
              )}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerarInsights}
          disabled={generando}
          className="shrink-0 text-xs"
        >
          {generando ? <Loader2 className="size-3 animate-spin mr-1" /> : <RefreshCw className="size-3 mr-1" />}
          {generando ? "Actualizando..." : "Actualizar señales"}
        </Button>
      </div>

      {/* ── ¿Qué mover hoy? ───────────────────────────────────────── */}
      {accionesDeHoy.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            ¿Qué mover hoy?
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accionesDeHoy.map((action) => (
              <CardAccion key={action.id} action={action} onNavigate={handleNavegar} />
            ))}
          </div>
        </section>
      )}

      {/* ── Estado general + Cobros pendientes ────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Estado general + factores */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-4 text-muted-foreground" />
              Qué mirar primero
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border bg-muted/10 px-4 py-4">
              <p className={cn("text-lg font-semibold", claseNum)}>{textoEstado}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Este resumen junta las señales más importantes para que sepas dónde mirar primero.
              </p>
            </div>

            {factores.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Lo que más pesa hoy</p>
                {factores.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-danger mt-0.5 shrink-0">•</span>
                    {f}
                  </div>
                ))}
              </div>
            )}

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-lg border bg-muted/10 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Facturas vencidas</p>
                <p className={cn("text-lg font-bold", cobros.cantVencidas > 0 ? "text-danger" : "text-success")}>
                  {cobros.cantVencidas}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/10 px-3 py-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sin revisar</p>
                <p className={cn("text-lg font-bold", pendientes > 0 ? "text-warning" : "text-success")}>
                  {pendientes}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cobros pendientes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CircleDollarSign className="size-4 text-muted-foreground" />
              Cobros pendientes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cobros.total > 0 ? (
              <>
                {/* Total + badges */}
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatearMoneda(cobros.total)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {cobros.montoVencidas > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-medium text-danger">
                        <AlertTriangle className="size-3" />
                        Vencidas: {formatearMoneda(cobros.montoVencidas)}
                      </span>
                    )}
                    {cobros.montoPorVencer7d > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
                        <Clock className="size-3" />
                        Próx. 7 días: {formatearMoneda(cobros.montoPorVencer7d)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Lista de clientes */}
                <div className="space-y-1.5 pt-1">
                  {cobros.clientes.map((c) => (
                    <button
                      key={c.nombre}
                      onClick={() => router.push("/invoices")}
                      className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/30 group"
                    >
                      <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {c.nombre}
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {c.tieneVencida && (
                          <span className="text-[10px] font-medium text-danger bg-danger/10 rounded-full px-1.5 py-0.5">vencida</span>
                        )}
                        <span className={cn("font-semibold", c.tieneVencida ? "text-danger" : "text-foreground")}>
                          {formatearMoneda(c.monto)}
                        </span>
                        <ChevronRight className="size-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CircleDollarSign className="size-8 text-success mb-2" />
                <p className="text-sm font-medium text-success">No tenés cobros pendientes</p>
                <p className="text-xs text-muted-foreground mt-1">Todas las facturas están al día</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Señales ────────────────────────────────────────────────── */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Señales detectadas
            <span className="ml-2 text-xs font-normal text-muted-foreground">{insights.length} elementos para revisar</span>
          </h2>

          {/* Filtros de severidad */}
          <div className="flex flex-wrap gap-1.5">
            {(["all", "critical", "high", "medium", "low"] as const).map((v) => {
              const labels = { all: "Todos", critical: "Críticos", high: "Altos", medium: "Medios", low: "Bajos" }
              const count = severityCounts[v]
              return (
                <button
                  key={v}
                  onClick={() => setFiltroSeveridad(v)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-all",
                    filtroSeveridad === v
                      ? v === "all" ? "border-foreground bg-foreground text-background" : severidadClases(v)
                      : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
                  )}
                >
                  {labels[v]} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {insightsFiltrados.length > 0 ? (
          <div className="grid gap-3">
            {insightsFiltrados.map((insight) => (
              <CardInsight key={insight.id} insight={insight} onNavigate={handleNavegar} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed bg-muted/10 p-8 text-center">
            <p className="text-sm text-muted-foreground">No hay señales en esta categoría</p>
          </div>
        )}
      </section>

      {/* ── Composición de gastos ──────────────────────────────────── */}
      {gastos.length > 0 && (
        <section>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4 text-muted-foreground" />
                Composición de gastos
              </CardTitle>
              {totalGastos > 0 && (
                <p className="text-sm text-muted-foreground">
                  Este mes gastaste <span className="font-semibold text-foreground">{formatearMoneda(totalGastos)}</span> en total
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="shrink-0">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={gastos}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={54}
                        outerRadius={84}
                        paddingAngle={2}
                      >
                        {gastos.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipGasto />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-2">
                  {gastos.map((item, i) => {
                    const altaConcentracion = item.percentage >= 30
                    return (
                      <div key={item.category} className="flex items-center gap-3 text-sm">
                        <div
                          className="size-3 rounded-full shrink-0"
                          style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
                        <span className="flex-1 text-muted-foreground truncate">{item.category}</span>
                        {altaConcentracion && (
                          <span className="text-[10px] font-medium text-warning bg-warning/10 rounded-full px-1.5 py-0.5 shrink-0">
                            ⚠ Alta concentración
                          </span>
                        )}
                        <span className="font-medium text-foreground shrink-0">{formatearMoneda(item.amount)}</span>
                        <span className="w-9 text-right text-xs text-muted-foreground shrink-0">{item.percentage}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

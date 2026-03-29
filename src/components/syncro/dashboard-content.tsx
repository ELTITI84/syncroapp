"use client"

import { memo, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/hooks/use-dashboard"
import {
  buildHref,
  formatCurrency,
  formatSignedCurrency,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

function priorityLabel(priority: "critical" | "high" | "medium") {
  if (priority === "critical") return "Crítica"
  if (priority === "high") return "Alta"
  return "Media"
}

const ProjectionTooltip = memo(function ProjectionTooltip({
  active,
  payload,
  label,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className={cn("font-semibold", (entry.value ?? 0) < 0 ? "text-danger" : "text-foreground")}
        >
          {entry.name}: {formatSignedCurrency(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  )
})

export function DashboardContent() {
  const router = useRouter()
  const {
    cashCollected,
    amountToCollect,
    amountToPay,
    monthlyNetResult,
    criticalWarning,
    metrics,
    points: projection,
    todayActions,
    whyReasons,
    insights,
    isLoading,
  } = useDashboard()

  const currentDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    [],
  )

  const severityRank = useMemo(() => ({ high: 0, medium: 1, low: 2, critical: -1 } as const), [])

  const previewInsights = useMemo(
    () =>
      insights
        .slice()
        .sort((left, right) => severityRank[left.severity] - severityRank[right.severity])
        .slice(0, 4),
    [insights, severityRank],
  )
  const featuredInsight = previewInsights[0] ?? null
  const secondaryInsights = previewInsights.slice(1)

  const highCount = useMemo(() => insights.filter((insight) => insight.severity === "high").length, [insights])
  const mediumCount = useMemo(() => insights.filter((insight) => insight.severity === "medium").length, [insights])

  const chartData = useMemo(
    () => projection.slice(0, 15).map((point) => ({ date: point.label, balance: point.balance })),
    [projection],
  )

  const metricCards = [
    {
      label: "Caja actual",
      value: formatSignedCurrency(metrics?.currentBalance ?? 0),
      detail: "Basada en movimientos confirmados",
      icon: Wallet,
      tone: (metrics?.currentBalance ?? 0) < 0 ? "text-danger" : "text-foreground",
      href: "/cashflow",
    },
    {
      label: "Por cobrar",
      value: formatCurrency(amountToCollect),
      detail: "Facturas pendientes de cobro",
      icon: ArrowUpRight,
      tone: "text-success",
      href: "/invoices?status=pending",
    },
    {
      label: "Por pagar",
      value: formatCurrency(amountToPay),
      detail: "Facturas pendientes de pago",
      icon: ArrowDownRight,
      tone: "text-danger",
      href: "/invoices",
    },
    {
      label: "Resultado mensual",
      value: formatSignedCurrency(monthlyNetResult),
      detail: monthlyNetResult >= 0 ? "Mes positivo hasta ahora" : "Mes negativo hasta ahora",
      icon: TrendingUp,
      tone: monthlyNetResult >= 0 ? "text-success" : "text-danger",
      href: "/cashflow",
    },
  ]

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>

        <Skeleton className="h-28 w-full rounded-xl" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>

        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Inicio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentDateLabel} - Mirá cuánto tenés hoy, qué entra, qué sale y dónde hace falta actuar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Modo decisión</Badge>
          <Button variant="outline" onClick={() => router.push("/cashflow?focus=zero-day")}>
            Ver riesgo
          </Button>
        </div>
      </div>

      {metrics?.daysUntilZero !== null && metrics?.daysUntilZero !== undefined && (
        <Card className="border-danger/30 bg-danger/5">
          <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-danger/15 p-2.5">
                <AlertTriangle className="size-5 text-danger" />
              </div>
              <div>
                <p className="text-sm font-semibold text-danger">
                  {criticalWarning ?? `El saldo va a negativo en ${metrics.daysUntilZero} días si no se actúa.`}
                </p>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Sueldos, alquiler y el pago al proveedor caen antes de los cobros más grandes.
                  La solución más rápida es adelantar cobros o retrasar un pago.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => router.push("/cashflow?focus=zero-day")}>Ver camino crítico</Button>
              <Button variant="outline" onClick={() => router.push("/invoices?status=overdue&focus=collections")}>
                Cobrar facturas vencidas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <button key={card.label} onClick={() => router.push(card.href)} className="text-left">
              <Card className="h-full border-border/80 transition-all hover:border-primary/40 hover:bg-muted/20">
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
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Proyección de caja</CardTitle>
              <CardDescription>
                Las próximas dos semanas muestran cuándo se agota el saldo y cuándo los cobros lo recuperan.
              </CardDescription>
            </div>
            <Button variant="ghost" className="text-primary" onClick={() => router.push("/cashflow")}>
              Ver flujo completo
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboard-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.50 0.23 255)" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="oklch(0.50 0.23 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.90 0.006 250)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.48 0.012 250)" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tick={{ fontSize: 11, fill: "oklch(0.48 0.012 250)" }} tickLine={false} axisLine={false} />
              <Tooltip content={ProjectionTooltip} />
              <ReferenceLine y={0} stroke="oklch(0.55 0.22 25)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="oklch(0.50 0.23 255)" strokeWidth={2.5} fill="url(#dashboard-balance)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Saldo mínimo proyectado</p>
              <p className="mt-1 text-lg font-semibold text-danger">{formatSignedCurrency(metrics?.projectedLow ?? 0)}</p>
              <p className="text-xs text-muted-foreground">El {metrics?.zeroDayLabel ?? metrics?.projectedLowDate ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Ventana de riesgo</p>
              <p className={cn("mt-1 text-lg font-semibold", (metrics?.daysUntilZero ?? null) !== null ? "text-danger" : "text-success")}>
                {(metrics?.daysUntilZero ?? null) !== null ? `${metrics?.daysUntilZero} días` : "Estable"}
              </p>
              <p className="text-xs text-muted-foreground">
                {metrics?.zeroDayLabel ? `Día cero: ${metrics.zeroDayLabel}` : "Sin saldo negativo en el horizonte"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Saldo final proyectado</p>
              <p className={cn("mt-1 text-lg font-semibold", (metrics?.endingBalance ?? 0) < 0 ? "text-danger" : "text-success")}>{formatSignedCurrency(metrics?.endingBalance ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Al final del período planificado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {todayActions.length > 0 && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Qué hacer hoy</CardTitle>
            <CardDescription>
              Acciones priorizadas para mejorar tu posición de caja ahora mismo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-6 pb-6">
            {todayActions.map((action) => (
              <button
                key={action.id}
                onClick={() => router.push(buildHref(action.target))}
                className="rounded-xl border border-border/80 bg-muted/10 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "border-transparent",
                          action.priority === "critical" && "bg-danger/15 text-danger hover:bg-danger/15",
                          action.priority === "high" && "bg-warning/15 text-warning hover:bg-warning/15",
                          action.priority === "medium" && "bg-primary/10 text-primary hover:bg-primary/10",
                        )}
                      >
                        {priorityLabel(action.priority)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{action.owner}</span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-foreground">{action.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span className={cn("font-semibold", action.moneyImpact > 0 ? "text-success" : "text-danger")}>
                    {formatSignedCurrency(action.moneyImpact)}
                  </span>
                  <span className={cn("font-medium", action.daysImpact > 0 ? "text-success" : "text-danger")}>
                    {action.daysImpact > 0 ? `+${action.daysImpact}` : action.daysImpact} días
                  </span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {whyReasons.length > 0 && (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Por qué está pasando esto</CardTitle>
            <CardDescription>
              Las tres causas raíz detrás del riesgo de caja actual.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-6 pb-6">
            {whyReasons.map((reason) => (
              <button
                key={reason.id}
                onClick={() => router.push(buildHref(reason.target))}
                className="rounded-xl border border-border/80 bg-muted/10 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p
                      className={cn(
                        "text-xs font-medium uppercase tracking-[0.18em]",
                        reason.tone === "danger" && "text-danger",
                        reason.tone === "warning" && "text-warning",
                        reason.tone === "primary" && "text-primary",
                      )}
                    >
                      {reason.metric}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{reason.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{reason.description}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-warning" />
                <CardTitle>Señales para decidir</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Lo más importante para entender qué está pasando y qué conviene mover ahora.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-warning/15 text-warning hover:bg-warning/15">{highCount} altos</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{mediumCount} medios</Badge>
              <Button variant="ghost" className="text-primary" onClick={() => router.push("/insights")}>
                Ver todos
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 pb-6 xl:grid-cols-[1.15fr_0.85fr]">
          {featuredInsight && (
            <button
              onClick={() => router.push(buildHref(featuredInsight.target))}
              className="rounded-2xl border border-danger/30 bg-gradient-to-br from-danger/10 via-card to-card p-5 text-left transition-all hover:border-danger/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge className={cn(
                    featuredInsight.severity === "high" && "bg-warning/15 text-warning hover:bg-warning/15",
                    featuredInsight.severity === "medium" && "bg-primary/10 text-primary hover:bg-primary/10",
                    featuredInsight.severity === "low" && "bg-muted text-muted-foreground hover:bg-muted",
                  )}>{featuredInsight.severity}</Badge>
                  <p className="mt-4 text-lg font-semibold leading-tight text-foreground">{featuredInsight.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{featuredInsight.summary}</p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Qué cambió</p>
                  <p className="mt-2 text-sm text-foreground">{featuredInsight.what}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mejor próxima acción</p>
                  <p className="mt-2 text-sm text-foreground">{featuredInsight.action}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className={cn("font-semibold", featuredInsight.moneyImpact > 0 ? "text-success" : "text-danger")}>
                  {formatSignedCurrency(featuredInsight.moneyImpact)}
                </span>
                <span className={cn("font-medium", featuredInsight.daysImpact > 0 ? "text-success" : "text-danger")}>
                  {featuredInsight.daysImpact > 0 ? `+${featuredInsight.daysImpact}` : featuredInsight.daysImpact} días
                </span>
                <span className="text-muted-foreground">{featuredInsight.benefit}</span>
              </div>
            </button>
          )}

          <div className="grid gap-3">
            {secondaryInsights.map((insight) => (
              <button
                key={insight.id}
                onClick={() => router.push(buildHref(insight.target))}
                className="rounded-xl border border-border/80 bg-muted/10 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className={cn(
                      "border-transparent",
                      insight.severity === "high" && "bg-warning/15 text-warning hover:bg-warning/15",
                      insight.severity === "medium" && "bg-primary/10 text-primary hover:bg-primary/10",
                      insight.severity === "low" && "bg-muted text-muted-foreground hover:bg-muted",
                    )}>
                      {insight.severity}
                    </Badge>
                    <p className="mt-3 text-sm font-semibold text-foreground">{insight.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.what}</p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Acción recomendada</p>
                    <p className="mt-1 text-sm text-foreground">{insight.action}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <span className={cn("font-semibold", insight.moneyImpact > 0 ? "text-success" : "text-danger")}>
                    {formatSignedCurrency(insight.moneyImpact)}
                  </span>
                  <span className={cn("font-medium", insight.daysImpact > 0 ? "text-success" : "text-danger")}>
                    {insight.daysImpact > 0 ? `+${insight.daysImpact}` : insight.daysImpact} días
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

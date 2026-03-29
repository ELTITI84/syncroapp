"use client"

import { memo, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarClock,
  ChevronRight,
  Clock3,
  Flame,
  Layers3,
  Sparkles,
  TrendingDown,
  TrendingUp,
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
import { Separator } from "@/components/ui/separator"
import { useCashflow } from "@/hooks/use-cashflow"
import {
  buildHref,
  defaultScenarioState,
  formatCurrency,
  formatShortDate,
  formatSignedCurrency,
  getSignedEventAmount,
  scenarioOptions,
  type ScenarioKey,
  type ScenarioState,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

const CashflowTooltip = memo(function CashflowTooltip({
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
          className={cn(
            "font-semibold",
            (entry.value ?? 0) < 0 ? "text-danger" : entry.name === "Scenario" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {entry.name}: {formatSignedCurrency(Number(entry.value ?? 0))}
        </p>
      ))}
    </div>
  )
})

export function CashflowContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focus = searchParams.get("focus")
  const [scenario, setScenario] = useState<ScenarioState>(defaultScenarioState)
  const hasScenario = scenario.collect_overdue || scenario.delay_supplier || scenario.trim_saas

  const {
    metrics: scenarioMetrics,
    points: scenarioPoints,
    forecastEvents,
    baseline,
    isLoading,
  } = useCashflow({
    collectOverdue: scenario.collect_overdue,
    delaySupplier: scenario.delay_supplier,
    trimSaas: scenario.trim_saas,
    includeBaseline: hasScenario,
  })

  const baselineMetrics = baseline?.metrics ?? scenarioMetrics
  const baselinePoints = baseline?.points ?? scenarioPoints

  useEffect(() => {
    const focusMap: Record<string, string> = {
      "zero-day": "cashflow-chart",
      timeline: "cashflow-timeline",
      "scenario-supplier": "cashflow-simulator",
    }

    const targetId = focus ? focusMap[focus] ?? focus : null

    if (!targetId) return

    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [focus])

  const chartData = useMemo(
    () =>
      baselinePoints.map((point, index) => ({
        date: point.label,
        baseline: point.balance,
        scenario: scenarioPoints[index]?.balance ?? point.balance,
      })),
    [baselinePoints, scenarioPoints],
  )

  const eventBalanceMap = useMemo(
    () => new Map(scenarioPoints.map((point) => [point.date, point.balance])),
    [scenarioPoints],
  )

  const comparisonCards = useMemo(
    () => [
      {
        label: "Saldo actual",
        value: formatSignedCurrency(scenarioMetrics?.currentBalance ?? 0),
        detail: "Basado en movimientos confirmados",
        icon: TrendingUp,
        tone: (scenarioMetrics?.currentBalance ?? 0) < 0 ? "text-danger" : "text-foreground",
      },
      {
        label: "Saldo final proyectado",
        value: formatSignedCurrency(scenarioMetrics?.endingBalance ?? 0),
        detail: hasScenario
          ? `${formatSignedCurrency((scenarioMetrics?.endingBalance ?? 0) - (baselineMetrics?.endingBalance ?? 0))} vs. escenario base`
          : "Al final del período",
        icon: TrendingDown,
        tone: (scenarioMetrics?.endingBalance ?? 0) < 0 ? "text-danger" : "text-success",
      },
      {
        label: "Día cero",
        value: scenarioMetrics?.zeroDayLabel ?? "Sin día cero",
        detail:
          (scenarioMetrics?.daysUntilZero ?? null) !== null
            ? `${scenarioMetrics?.daysUntilZero} días desde hoy`
            : "El saldo se mantiene positivo en el horizonte",
        icon: Clock3,
        tone: (scenarioMetrics?.daysUntilZero ?? null) !== null ? "text-danger" : "text-success",
      },
      {
        label: "Gasto diario promedio",
        value: formatCurrency(scenarioMetrics?.dailyBurnRate ?? 0),
        detail: "Promedio de días de gasto confirmado",
        icon: Flame,
        tone: "text-warning",
      },
    ],
    [scenarioMetrics, baselineMetrics, hasScenario],
  )

  const scenarioDeltaLabel = useMemo(
    () =>
      (scenarioMetrics?.daysUntilZero ?? null) === null
        ? "El escenario elimina el día cero en este horizonte."
        : (baselineMetrics?.daysUntilZero ?? null) !== null
        ? `Desplazamiento de ${(scenarioMetrics?.daysUntilZero ?? 0) - (baselineMetrics?.daysUntilZero ?? 0)} días vs. la base.`
        : "El escenario mantiene el saldo protegido.",
    [scenarioMetrics, baselineMetrics],
  )

  const toggleScenario = (key: ScenarioKey) => {
    setScenario((current) => ({ ...current, [key]: !current[key] }))
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
        <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
          Cargando datos de caja…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Flujo de caja</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Acá ves si la plata alcanza, cuándo entra, cuándo sale y dónde se te puede apretar la caja.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {baselineMetrics?.daysUntilZero != null ? (
            <Badge className="bg-danger/10 text-danger hover:bg-danger/10">
              Riesgo en {baselineMetrics.daysUntilZero} días
            </Badge>
          ) : (
            <Badge className="bg-success/10 text-success hover:bg-success/10">
              Caja estable
            </Badge>
          )}
          <Button variant="outline" onClick={() => router.push("/invoices?status=overdue&focus=collections")}>
            Cobrar facturas vencidas
          </Button>
        </div>
      </div>

      {baselineMetrics?.daysUntilZero != null ? (
        <Card className={cn("border-danger/30 bg-danger/5", focus === "zero-day" && "border-danger/50 ring-1 ring-danger/30")}>
          <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-danger/15 p-2.5">
                <AlertTriangle className="size-5 text-danger" />
              </div>
              <div>
                <p className="text-sm font-semibold text-danger">
                  Si nada cambia, te quedás sin caja el {baselineMetrics.zeroDayLabel}.
                </p>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                  Eso pasa porque tenés pagos importantes antes de que entren los cobros más grandes.
                  Probá mover cobros o pagos para ver cómo cambia el resultado.
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mínimo proyectado</p>
              <p className="mt-1 font-semibold text-danger">
                {formatSignedCurrency(baselineMetrics.projectedLow ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {baselineMetrics.projectedLowDate ? `El ${formatShortDate(baselineMetrics.projectedLowDate)}` : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-success/20 bg-success/5">
          <CardContent className="flex items-center gap-3 px-6 py-4">
            <div className="rounded-xl bg-success/15 p-2.5">
              <TrendingUp className="size-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">La caja está en buen estado para el período proyectado.</p>
              <p className="mt-0.5 text-sm text-muted-foreground">No se detecta riesgo de saldo negativo en el horizonte actual.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {comparisonCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardContent className="flex flex-col gap-4 px-5 py-5">
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
          )
        })}
      </div>

      <Card
        id="cashflow-chart"
        className={cn(
          "border-border/80",
          focus === "zero-day" && "border-danger/40 ring-1 ring-danger/30",
        )}
      >
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>Antes y después</CardTitle>
              <CardDescription>
                La línea base muestra cómo seguís hoy. El escenario muestra qué cambia si tomás una decisión.
              </CardDescription>
            </div>
            {hasScenario && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                Escenario activo
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="scenario-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.50 0.23 255)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="oklch(0.50 0.23 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.90 0.006 250)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "oklch(0.48 0.012 250)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                tick={{ fontSize: 11, fill: "oklch(0.48 0.012 250)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={CashflowTooltip} />
              <ReferenceLine y={0} stroke="oklch(0.55 0.22 25)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="baseline"
                name="Base"
                stroke="oklch(0.50 0.03 240)"
                strokeWidth={2}
                fillOpacity={0}
              />
              <Area
                type="monotone"
                dataKey="scenario"
                name="Escenario"
                stroke="oklch(0.50 0.23 255)"
                strokeWidth={2.6}
                fill="url(#scenario-balance)"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base</p>
              <p className="mt-2 text-lg font-semibold text-danger">
                {baselineMetrics?.zeroDayLabel ?? "Sin día cero"}
              </p>
              <p className="text-sm text-muted-foreground">
                Saldo mínimo {formatSignedCurrency(baselineMetrics?.projectedLow ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Escenario</p>
              <p className={cn("mt-2 text-lg font-semibold", scenarioMetrics?.zeroDay ? "text-warning" : "text-success")}>
                {scenarioMetrics?.zeroDayLabel ?? "Protegido"}
              </p>
              <p className="text-sm text-muted-foreground">
                Saldo mínimo {formatSignedCurrency(scenarioMetrics?.projectedLow ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Impacto</p>
              <p className="mt-2 text-lg font-semibold text-primary">{scenarioDeltaLabel}</p>
              <p className="text-sm text-muted-foreground">
                Cambio en saldo final {formatSignedCurrency((scenarioMetrics?.endingBalance ?? 0) - (baselineMetrics?.endingBalance ?? 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        id="cashflow-simulator"
        className={cn(
          "border-border/80",
          focus === "scenario-supplier" && "border-primary/40 ring-1 ring-primary/30",
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers3 className="size-4 text-primary" />
            <CardTitle>Simulador de escenarios</CardTitle>
          </div>
          <CardDescription>
            Probá cambios simples para ver si ganás tiempo o mejorás el saldo final, sin mezclar caja con resultado.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 px-6 pb-6 md:grid-cols-3">
          {scenarioOptions.map((option) => {
            const active = scenario[option.key]

            return (
              <button
                key={option.key}
                onClick={() => toggleScenario(option.key)}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/80 bg-muted/10 hover:border-primary/30 hover:bg-muted/20",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{option.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                  </div>
                  <div
                    className={cn(
                      "mt-1 flex size-5 items-center justify-center rounded-full border",
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {active ? <Sparkles className="size-3" /> : null}
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {option.improvesCash ? (
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
                      mejora caja
                    </Badge>
                  ) : null}
                  {option.improvesResult ? (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
                      mejora resultado
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-xs font-medium text-primary">{option.impactLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.impactSummary}</p>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card
        id="cashflow-timeline"
        className={cn(
          "border-border/80",
          focus === "timeline" && "border-warning/40 ring-1 ring-warning/30",
        )}
      >
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-warning" />
            <CardTitle>Línea de tiempo de eventos</CardTitle>
          </div>
          <CardDescription>
            Cada movimiento futuro muestra cuánto te suma o te resta y adónde mirar después.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-6 pb-6">
          {forecastEvents.map((event) => {
            const balanceAfter = eventBalanceMap.get(event.date)

            return (
              <button
                key={event.id}
                onClick={() => router.push(buildHref(event.target))}
                className="rounded-xl border border-border/80 bg-muted/10 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "border-transparent",
                          event.type === "income"
                            ? "bg-success/15 text-success hover:bg-success/15"
                            : "bg-danger/15 text-danger hover:bg-danger/15",
                        )}
                      >
                        {event.type === "income" ? "Ingreso" : "Egreso"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatShortDate(event.date)}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{event.label}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", event.type === "income" ? "text-success" : "text-danger")}>
                        {formatSignedCurrency(getSignedEventAmount(event))}
                      </p>
                      <p className="text-xs text-muted-foreground">impacto en caja</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", balanceAfter !== undefined && balanceAfter < 0 ? "text-danger" : "text-foreground")}>
                        {balanceAfter !== undefined ? formatSignedCurrency(balanceAfter) : "--"}
                      </p>
                      <p className="text-xs text-muted-foreground">cómo te queda la caja</p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

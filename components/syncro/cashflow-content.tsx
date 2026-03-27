"use client"

import { useEffect, useMemo, useState } from "react"
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
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useStore } from "@/lib/store"
import {
  buildCashflowSeries,
  buildForecastEvents,
  buildHref,
  defaultScenarioState,
  formatCurrency,
  formatShortDate,
  formatSignedCurrency,
  getCashflowMetrics,
  scenarioOptions,
  type ScenarioKey,
  type ScenarioState,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

function CashflowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className={cn(
            "font-semibold",
            entry.value < 0 ? "text-danger" : entry.name === "Scenario" ? "text-primary" : "text-muted-foreground",
          )}
        >
          {entry.name}: {formatSignedCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function CashflowContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const focus = searchParams.get("focus")
  const invoices = useStore((state) => state.invoices)
  const transactions = useStore((state) => state.transactions)
  const [scenario, setScenario] = useState<ScenarioState>(defaultScenarioState)

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

  const baselineProjection = useMemo(
    () => buildCashflowSeries(invoices, transactions),
    [invoices, transactions],
  )
  const scenarioProjection = useMemo(
    () => buildCashflowSeries(invoices, transactions, scenario),
    [invoices, transactions, scenario],
  )
  const baselineMetrics = useMemo(
    () => getCashflowMetrics(baselineProjection, transactions),
    [baselineProjection, transactions],
  )
  const scenarioMetrics = useMemo(
    () => getCashflowMetrics(scenarioProjection, transactions),
    [scenarioProjection, transactions],
  )

  const hasScenario = Object.values(scenario).some(Boolean)
  const chartData = baselineProjection.map((point, index) => ({
    date: point.label,
    baseline: point.balance,
    scenario: scenarioProjection[index]?.balance ?? point.balance,
  }))

  const eventBalanceMap = new Map(
    scenarioProjection.map((point) => [point.date, point.balance]),
  )
  const forecastEvents = useMemo(
    () =>
      buildForecastEvents(invoices, scenario).filter((event) => event.date >= scenarioProjection[0]?.date),
    [invoices, scenario, scenarioProjection],
  )

  const comparisonCards = [
    {
      label: "Current balance",
      value: formatCurrency(scenarioMetrics.currentBalance),
      detail: "Starting point",
      icon: TrendingUp,
      tone: "text-foreground",
    },
    {
      label: "Projected ending balance",
      value: formatSignedCurrency(scenarioMetrics.endingBalance),
      detail: hasScenario
        ? `${formatSignedCurrency(scenarioMetrics.endingBalance - baselineMetrics.endingBalance)} vs baseline`
        : "At the end of the planning window",
      icon: TrendingDown,
      tone: scenarioMetrics.endingBalance < 0 ? "text-danger" : "text-success",
    },
    {
      label: "Zero day",
      value: scenarioMetrics.zeroDayLabel ?? "No zero day",
      detail:
        scenarioMetrics.daysUntilZero !== null
          ? `${scenarioMetrics.daysUntilZero} days from today`
          : "Balance stays above zero in this horizon",
      icon: Clock3,
      tone: scenarioMetrics.daysUntilZero !== null ? "text-danger" : "text-success",
    },
    {
      label: "Average daily burn",
      value: formatCurrency(scenarioMetrics.dailyBurnRate),
      detail: "Average confirmed spend day",
      icon: Flame,
      tone: "text-warning",
    },
  ]

  const scenarioDeltaLabel =
    scenarioMetrics.daysUntilZero === null
      ? "Scenario removes the zero-day event in this horizon."
      : baselineMetrics.daysUntilZero !== null
      ? `${scenarioMetrics.daysUntilZero - baselineMetrics.daysUntilZero} day shift versus baseline.`
      : "Scenario keeps the balance protected."

  const toggleScenario = (key: ScenarioKey) => {
    setScenario((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Cashflow</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projection, scenario planning, and event-level explanation of what moves the balance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="bg-danger/10 text-danger hover:bg-danger/10">
            {baselineMetrics.daysUntilZero ?? 0} day risk window
          </Badge>
          <Button variant="outline" onClick={() => router.push("/invoices?status=overdue&focus=collections")}>
            Collect overdue cash
          </Button>
        </div>
      </div>

      <Card className={cn("border-border/80", focus === "zero-day" && "border-danger/40 ring-1 ring-danger/30")}>
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-danger/15 p-2.5">
              <AlertTriangle className="size-5 text-danger" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Zero day is currently projected for {baselineMetrics.zeroDayLabel ?? "n/a"}.
              </p>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                The drop happens because payroll, rent, and the supplier catch-up land before your major invoice collections.
                Simulate collections or a supplier delay below to see the before vs after.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-border/80 bg-muted/20 px-4 py-3 text-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Projected low</p>
            <p className="mt-1 font-semibold text-danger">
              {formatSignedCurrency(baselineMetrics.projectedLow)}
            </p>
            <p className="text-xs text-muted-foreground">
              On {formatShortDate(baselineMetrics.projectedLowDate)}
            </p>
          </div>
        </CardContent>
      </Card>

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
              <CardTitle>Before vs after forecast</CardTitle>
              <CardDescription>
                Baseline shows the current path. Scenario overlays show what changes if you act now.
              </CardDescription>
            </div>
            {hasScenario && (
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
                Scenario active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="scenario-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.60 0.20 255)" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="oklch(0.60 0.20 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.22 0.010 240)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "oklch(0.55 0.010 240)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                tick={{ fontSize: 11, fill: "oklch(0.55 0.010 240)" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CashflowTooltip />} />
              <ReferenceLine y={0} stroke="oklch(0.55 0.22 25)" strokeDasharray="4 4" />
              <Area
                type="monotone"
                dataKey="baseline"
                name="Baseline"
                stroke="oklch(0.50 0.03 240)"
                strokeWidth={2}
                fillOpacity={0}
              />
              <Area
                type="monotone"
                dataKey="scenario"
                name="Scenario"
                stroke="oklch(0.60 0.20 255)"
                strokeWidth={2.6}
                fill="url(#scenario-balance)"
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Baseline</p>
              <p className="mt-2 text-lg font-semibold text-danger">
                {baselineMetrics.zeroDayLabel ?? "No zero day"}
              </p>
              <p className="text-sm text-muted-foreground">
                Lowest balance {formatSignedCurrency(baselineMetrics.projectedLow)}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Scenario</p>
              <p className={cn("mt-2 text-lg font-semibold", scenarioMetrics.zeroDay ? "text-warning" : "text-success")}>
                {scenarioMetrics.zeroDayLabel ?? "Protected"}
              </p>
              <p className="text-sm text-muted-foreground">
                Lowest balance {formatSignedCurrency(scenarioMetrics.projectedLow)}
              </p>
            </div>
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Impact</p>
              <p className="mt-2 text-lg font-semibold text-primary">{scenarioDeltaLabel}</p>
              <p className="text-sm text-muted-foreground">
                Ending balance change {formatSignedCurrency(scenarioMetrics.endingBalance - baselineMetrics.endingBalance)}
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
            <CardTitle>Scenario simulator</CardTitle>
          </div>
          <CardDescription>
            These controls are UI-functional and immediately update the projection, lowest balance, and zero day.
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
                <p className="text-xs font-medium text-primary">{option.impactLabel}</p>
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
            <CardTitle>Upcoming events timeline</CardTitle>
          </div>
          <CardDescription>
            Every event below explains how it changes the balance and lets you jump to the relevant page.
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
                          event.amount > 0
                            ? "bg-success/15 text-success hover:bg-success/15"
                            : "bg-danger/15 text-danger hover:bg-danger/15",
                        )}
                      >
                        {event.amount > 0 ? "Incoming" : "Outgoing"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{formatShortDate(event.date)}</span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{event.label}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", event.amount > 0 ? "text-success" : "text-danger")}>
                        {formatSignedCurrency(event.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">event impact</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-semibold", balanceAfter !== undefined && balanceAfter < 0 ? "text-danger" : "text-foreground")}>
                        {balanceAfter !== undefined ? formatSignedCurrency(balanceAfter) : "--"}
                      </p>
                      <p className="text-xs text-muted-foreground">balance after</p>
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

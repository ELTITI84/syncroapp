"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Clock3,
  Sparkles,
  Wallet,
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
import { currentDateLabel } from "@/lib/data"
import { useStore } from "@/lib/store"
import {
  buildCashflowSeries,
  buildHref,
  formatCurrency,
  formatSignedCurrency,
  getCashflowMetrics,
  getInsights,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

function ProjectionTooltip({
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
          className={cn("font-semibold", entry.value < 0 ? "text-danger" : "text-foreground")}
        >
          {entry.name}: {formatSignedCurrency(entry.value)}
        </p>
      ))}
    </div>
  )
}

export function DashboardContent() {
  const router = useRouter()
  const invoices = useStore((state) => state.invoices)
  const transactions = useStore((state) => state.transactions)

  const projection = useMemo(() => buildCashflowSeries(invoices, transactions), [invoices, transactions])
  const metrics = useMemo(() => getCashflowMetrics(projection, transactions), [projection, transactions])
  const { insights, healthScore } = useMemo(() => getInsights(invoices, transactions), [invoices, transactions])

  const previewInsights = insights.filter((insight) => ["critical", "high"].includes(insight.severity)).slice(0, 4)
  const featuredInsight = previewInsights[0] ?? null
  const secondaryInsights = previewInsights.slice(1)
  const criticalCount = insights.filter((insight) => insight.severity === "critical").length
  const highCount = insights.filter((insight) => insight.severity === "high").length

  const chartData = projection.slice(0, 15).map((point) => ({
    date: point.label,
    balance: point.balance,
  }))

  const metricCards = [
    {
      label: "Current cash",
      value: formatCurrency(metrics.currentBalance),
      detail: "Available today",
      icon: Wallet,
      tone: "text-foreground",
      href: "/cashflow",
    },
    {
      label: "Incoming cash",
      value: formatCurrency(metrics.upcomingIncome),
      detail: "Expected in the next 24 days",
      icon: ArrowUpRight,
      tone: "text-success",
      href: "/invoices?status=pending",
    },
    {
      label: "Outgoing cash",
      value: formatCurrency(metrics.upcomingExpenses),
      detail: "Scheduled in the next 24 days",
      icon: ArrowDownRight,
      tone: "text-danger",
      href: "/movements?tab=confirmed",
    },
    {
      label: "Risk window",
      value: metrics.daysUntilZero !== null ? `${metrics.daysUntilZero} days` : "Stable",
      detail: metrics.zeroDayLabel ? `Zero day: ${metrics.zeroDayLabel}` : "No negative balance in horizon",
      icon: Clock3,
      tone: metrics.daysUntilZero !== null ? "text-danger" : "text-success",
      href: "/cashflow?focus=zero-day",
    },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentDateLabel} - Health score {healthScore}/100
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Decision support mode</Badge>
          <Button variant="outline" onClick={() => router.push("/cashflow?focus=zero-day")}>
            Review risk
          </Button>
        </div>
      </div>

      <Card className="border-danger/30 bg-danger/5">
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-danger/15 p-2.5">
              <AlertTriangle className="size-5 text-danger" />
            </div>
            <div>
              <p className="text-sm font-semibold text-danger">
                Cash goes negative in {metrics.daysUntilZero ?? 0} days if nothing changes.
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Payroll, rent, and the supplier catch-up payment land before the biggest collections.
                The fastest fix is to move collections forward or delay one outflow.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/cashflow?focus=zero-day")}>Open critical path</Button>
            <Button variant="outline" onClick={() => router.push("/invoices?status=overdue&focus=collections")}>
              Collect overdue cash
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <CardTitle>Cashflow projection</CardTitle>
              <CardDescription>
                The next two weeks show exactly when the buffer breaks and when collections recover it.
              </CardDescription>
            </div>
            <Button variant="ghost" className="text-primary" onClick={() => router.push("/cashflow")}>
              Full forecast
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 6, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="dashboard-balance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.60 0.20 255)" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="oklch(0.60 0.20 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.22 0.010 240)" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "oklch(0.55 0.010 240)" }} tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tick={{ fontSize: 11, fill: "oklch(0.55 0.010 240)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<ProjectionTooltip />} />
              <ReferenceLine y={0} stroke="oklch(0.55 0.22 25)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="balance" name="Balance" stroke="oklch(0.60 0.20 255)" strokeWidth={2.5} fill="url(#dashboard-balance)" />
            </AreaChart>
          </ResponsiveContainer>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Lowest projected balance</p>
              <p className="mt-1 text-lg font-semibold text-danger">{formatSignedCurrency(metrics.projectedLow)}</p>
              <p className="text-xs text-muted-foreground">On {metrics.zeroDayLabel ?? metrics.projectedLowDate}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Projected ending cash</p>
              <p className={cn("mt-1 text-lg font-semibold", metrics.endingBalance < 0 ? "text-danger" : "text-success")}>{formatSignedCurrency(metrics.endingBalance)}</p>
              <p className="text-xs text-muted-foreground">At the end of the planning window</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Average daily burn</p>
              <p className="mt-1 text-lg font-semibold text-warning">{formatCurrency(metrics.dailyBurnRate)}</p>
              <p className="text-xs text-muted-foreground">Average confirmed outflow per spend day</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-1">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-warning" />
                <CardTitle>AI insights preview</CardTitle>
              </div>
              <CardDescription className="mt-1">
                Stronger preview of the highest-risk signals, with clearer context and direct next moves.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-danger/15 text-danger hover:bg-danger/15">{criticalCount} critical</Badge>
              <Badge className="bg-warning/15 text-warning hover:bg-warning/15">{highCount} high</Badge>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Health {healthScore}/100</Badge>
              <Button variant="ghost" className="text-primary" onClick={() => router.push("/insights")}>
                View all
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
                  <Badge className="bg-danger/15 text-danger hover:bg-danger/15">{featuredInsight.severity}</Badge>
                  <p className="mt-4 text-lg font-semibold leading-tight text-foreground">{featuredInsight.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{featuredInsight.summary}</p>
                </div>
                <ChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">What changed</p>
                  <p className="mt-2 text-sm text-foreground">{featuredInsight.what}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Best next move</p>
                  <p className="mt-2 text-sm text-foreground">{featuredInsight.action}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                <span className={cn("font-semibold", featuredInsight.moneyImpact > 0 ? "text-success" : "text-danger")}>
                  {formatSignedCurrency(featuredInsight.moneyImpact)}
                </span>
                <span className={cn("font-medium", featuredInsight.daysImpact > 0 ? "text-success" : "text-danger")}>
                  {featuredInsight.daysImpact > 0 ? `+${featuredInsight.daysImpact}` : featuredInsight.daysImpact} days
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
                    <Badge className={cn("border-transparent", insight.severity === "critical" && "bg-danger/15 text-danger hover:bg-danger/15", insight.severity === "high" && "bg-warning/15 text-warning hover:bg-warning/15")}>
                      {insight.severity}
                    </Badge>
                    <p className="mt-3 text-sm font-semibold text-foreground">{insight.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.what}</p>
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Recommended move</p>
                    <p className="mt-1 text-sm text-foreground">{insight.action}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                </div>
                <div className="mt-4 flex items-center gap-3 text-xs">
                  <span className={cn("font-semibold", insight.moneyImpact > 0 ? "text-success" : "text-danger")}>
                    {formatSignedCurrency(insight.moneyImpact)}
                  </span>
                  <span className={cn("font-medium", insight.daysImpact > 0 ? "text-success" : "text-danger")}>
                    {insight.daysImpact > 0 ? `+${insight.daysImpact}` : insight.daysImpact} days
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

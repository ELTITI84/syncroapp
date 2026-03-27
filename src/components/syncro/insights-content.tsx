"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { ChevronRight, ShieldAlert, Sparkles, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import {
  buildCashflowSeries,
  buildHref,
  formatCurrency,
  formatSignedCurrency,
  getCashflowMetrics,
  getExpenseBreakdown,
  getInsights,
  getMovementCounts,
} from "@/lib/syncro"
import { cn } from "@/lib/utils"

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low"

const COLORS = [
  "oklch(0.60 0.20 255)",
  "oklch(0.72 0.18 160)",
  "oklch(0.72 0.20 75)",
  "oklch(0.55 0.22 25)",
  "oklch(0.78 0.17 85)",
  "oklch(0.68 0.18 310)",
]

function severityTone(severity: Exclude<SeverityFilter, "all">) {
  if (severity === "critical") return "bg-danger/15 text-danger hover:bg-danger/15"
  if (severity === "high") return "bg-warning/15 text-warning hover:bg-warning/15"
  if (severity === "medium") return "bg-primary/15 text-primary hover:bg-primary/15"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: { percentage: number } }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{payload[0].name}</p>
      <p className="text-muted-foreground">
        {formatCurrency(payload[0].value)} - {payload[0].payload.percentage}%
      </p>
    </div>
  )
}

export function InsightsContent() {
  const router = useRouter()
  const invoices = useStore((state) => state.invoices)
  const transactions = useStore((state) => state.transactions)
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const projection = useMemo(() => buildCashflowSeries(invoices, transactions), [invoices, transactions])
  const metrics = useMemo(() => getCashflowMetrics(projection, transactions), [projection, transactions])
  const { insights, healthScore } = useMemo(() => getInsights(invoices, transactions), [invoices, transactions])
  const expenseBreakdown = useMemo(() => getExpenseBreakdown(transactions).slice(0, 6), [transactions])
  const movementCounts = useMemo(() => getMovementCounts(transactions), [transactions])

  const filteredInsights = insights.filter((insight) => severityFilter === "all" || insight.severity === severityFilter)
  const counts = {
    all: insights.length,
    critical: insights.filter((insight) => insight.severity === "critical").length,
    high: insights.filter((insight) => insight.severity === "high").length,
    medium: insights.filter((insight) => insight.severity === "medium").length,
    low: insights.filter((insight) => insight.severity === "low").length,
  }

  const quickStats = [
    {
      label: "Days until zero",
      value: metrics.daysUntilZero !== null ? `${metrics.daysUntilZero} days` : "Protected",
      tone: metrics.daysUntilZero !== null ? "text-danger" : "text-success",
    },
    {
      label: "Overdue cash",
      value: formatCurrency(
        invoices.filter((invoice) => invoice.status === "overdue").reduce((sum, invoice) => sum + invoice.amount, 0),
      ),
      tone: "text-warning",
    },
    {
      label: "Movements to review",
      value: `${movementCounts.pending + movementCounts.duplicate}`,
      tone: "text-primary",
    },
  ]

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI insights</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Structured decision support across cash risk, collections, expenses, and client concentration.
          </p>
        </div>
        <Badge className="bg-primary/10 text-primary hover:bg-primary/10">
          {insights.length} insights generated
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-muted-foreground" />
              <CardTitle>Financial health</CardTitle>
            </div>
            <CardDescription>Composite score based on runway, collections, spend mix, and review backlog.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
            <div className="rounded-2xl border border-border/80 bg-muted/10 p-5 text-center">
              <p className={cn("text-5xl font-bold", healthScore < 40 ? "text-danger" : healthScore < 65 ? "text-warning" : "text-success")}>
                {healthScore}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">out of 100</p>
            </div>
            <div className="space-y-3">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/10 px-4 py-3 text-sm">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className={cn("font-semibold", stat.tone)}>{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              <CardTitle>Expense mix</CardTitle>
            </div>
            <CardDescription>Largest confirmed cost buckets currently shaping the operating profile.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 px-6 pb-6 md:flex-row md:items-center">
            <ResponsiveContainer width={220} height={200}>
              <PieChart>
                <Pie data={expenseBreakdown} dataKey="amount" nameKey="category" innerRadius={56} outerRadius={84} paddingAngle={2}>
                  {expenseBreakdown.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {expenseBreakdown.map((item, index) => (
                <div key={item.category} className="flex items-center gap-3 text-sm">
                  <div className="size-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="flex-1 text-muted-foreground">{item.category}</span>
                  <span className="font-medium text-foreground">{formatCurrency(item.amount)}</span>
                  <span className="w-10 text-right text-xs text-muted-foreground">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "critical", "high", "medium", "low"] as SeverityFilter[]).map((value) => (
          <button
            key={value}
            onClick={() => setSeverityFilter(value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-all",
              severityFilter === value
                ? value === "all"
                  ? "border-foreground bg-foreground text-background"
                  : severityTone(value as Exclude<SeverityFilter, "all">)
                : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground",
            )}
          >
            {value} ({counts[value]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredInsights.map((insight) => {
          const expanded = expandedId === insight.id
          return (
            <Card key={insight.id} className={cn("transition-all", expanded && "border-primary/30 bg-muted/10")}>
              <button className="w-full text-left" onClick={() => setExpandedId(expanded ? null : insight.id)}>
                <CardContent className="flex items-start gap-4 px-6 py-5">
                  <div className="mt-1"><Badge className={severityTone(insight.severity)}>{insight.severity}</Badge></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.summary}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className={cn("text-sm font-semibold", insight.moneyImpact > 0 ? "text-success" : "text-danger")}>{formatSignedCurrency(insight.moneyImpact)}</p>
                    <p className="text-xs text-muted-foreground">
                      {insight.daysImpact > 0 ? `+${insight.daysImpact}` : insight.daysImpact} days
                    </p>
                  </div>
                  <ChevronRight className={cn("mt-1 size-4 text-muted-foreground transition-transform", expanded && "rotate-90")} />
                </CardContent>
              </button>

              {expanded && (
                <CardContent className="grid gap-3 px-6 pb-6 md:grid-cols-2">
                  <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground"><Sparkles className="size-4 text-primary" />What is happening</div>
                    <p className="mt-2 text-sm text-muted-foreground">{insight.what}</p>
                  </div>
                  <div className="rounded-xl border border-border/80 bg-muted/10 p-4">
                    <p className="text-sm font-medium text-foreground">Why it matters</p>
                    <p className="mt-2 text-sm text-muted-foreground">{insight.why}</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="text-sm font-medium text-primary">What to do now</p>
                    <p className="mt-2 text-sm text-muted-foreground">{insight.action}</p>
                  </div>
                  <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                    <p className="text-sm font-medium text-success">Expected benefit</p>
                    <p className="mt-2 text-sm text-muted-foreground">{insight.benefit}</p>
                  </div>
                  <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4 text-sm">
                      <span className={cn("font-semibold", insight.moneyImpact > 0 ? "text-success" : "text-danger")}>{formatSignedCurrency(insight.moneyImpact)}</span>
                      <span className={cn("font-medium", insight.daysImpact > 0 ? "text-success" : "text-danger")}>{insight.daysImpact > 0 ? `+${insight.daysImpact}` : insight.daysImpact} runway days</span>
                    </div>
                    <Button onClick={() => router.push(buildHref(insight.target))}>
                      {insight.ctaLabel}
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

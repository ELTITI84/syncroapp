"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Scale, Sparkles, TrendingUp, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTransactions } from "@/hooks/use-transactions"
import { formatCurrency, formatSignedCurrency, getResultsOverview } from "@/lib/syncro"
import { cn } from "@/lib/utils"

type InsightCard = {
  id: string
  tone: "danger" | "success" | "warning" | "primary"
  title: string
  description: string
  actionLabel: string
  href: string
}

function changeLabel(value: number | null) {
  if (value === null) return "Sin base"
  if (value === 0) return "0%"
  return `${value > 0 ? "+" : ""}${value}%`
}

function changeTone(value: number | null, positiveIsGood = true) {
  if (value === null || value === 0) return "text-muted-foreground"
  const good = positiveIsGood ? value > 0 : value < 0
  return good ? "text-success" : "text-danger"
}

function insightToneClass(tone: InsightCard["tone"]) {
  if (tone === "danger") return "border-danger/20 bg-danger/5"
  if (tone === "success") return "border-success/20 bg-success/5"
  if (tone === "warning") return "border-warning/20 bg-warning/5"
  return "border-primary/20 bg-primary/5"
}

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function ResultsContent() {
  const router = useRouter()
  const { transactions, isLoading } = useTransactions()

  const overview = useMemo(() => getResultsOverview(transactions), [transactions])
  const { current, previous } = overview

  const currentLabel = capitalizeLabel(current.label)
  const previousLabel = capitalizeLabel(previous.label)

  const insights = useMemo<InsightCard[]>(() => {
    const items: InsightCard[] = []

    if (
      overview.expenseChangePct !== null &&
      overview.incomeChangePct !== null &&
      overview.expenseChangePct - overview.incomeChangePct >= 10
    ) {
      items.push({
        id: "expenses-vs-income",
        tone: "danger",
        title: "Los gastos están creciendo más rápido que los ingresos",
        description: `Tus gastos subieron ${changeLabel(overview.expenseChangePct)} mientras tus ingresos subieron ${changeLabel(overview.incomeChangePct)} contra ${previous.label}.`,
        actionLabel: "Revisar gastos",
        href: "/movements?tab=confirmed",
      })
    }

    if (overview.marginChangePts >= 5) {
      items.push({
        id: "margin-improved",
        tone: "success",
        title: "Tu margen mejoró",
        description: `Pasaste de ${previous.margin}% a ${current.margin}% de margen. Estás reteniendo más plata por cada venta.`,
        actionLabel: "Ver movimientos",
        href: "/movements?tab=confirmed",
      })
    }

    if (overview.topThreeExpenseShare >= 70) {
      items.push({
        id: "expense-concentration",
        tone: "warning",
        title: "Pocas categorías explican casi todo el gasto",
        description: `Las 3 categorías principales concentran ${overview.topThreeExpenseShare}% de lo que salió este mes.`,
        actionLabel: "Abrir categorías",
        href: "/movements?tab=confirmed",
      })
    }

    if (overview.pendingReviewCount > 0) {
      items.push({
        id: "data-quality",
        tone: "primary",
        title: "Todavía hay movimientos por revisar",
        description: `${overview.pendingReviewCount} movimiento(s) siguen pendientes. Este resultado puede moverse cuando los confirmes.`,
        actionLabel: "Revisar pendientes",
        href: "/movements?tab=pending_review",
      })
    }

    if (items.length === 0) {
      items.push({
        id: "healthy",
        tone: current.netProfit >= 0 ? "success" : "warning",
        title: current.netProfit >= 0 ? "El negocio viene positivo" : "El negocio viene ajustado",
        description:
          current.netProfit >= 0
            ? `Este mes te quedaron ${formatCurrency(current.netProfit)} después de cubrir costos y gastos.`
            : `Este mes estás ${formatCurrency(Math.abs(current.netProfit))} abajo después de cubrir costos y gastos.`,
        actionLabel: "Ver movimientos",
        href: "/movements?tab=confirmed",
      })
    }

    return items.slice(0, 4)
  }, [current.margin, current.netProfit, overview, previous.label, previous.margin])

  const metricCards = [
    {
      label: "Ingresos",
      value: formatCurrency(current.income),
      detail: `vs ${previous.label}: ${changeLabel(overview.incomeChangePct)}`,
      tone: "text-success",
      icon: ArrowUpRight,
    },
    {
      label: "Gastos totales",
      value: formatCurrency(current.totalExpenses),
      detail: `vs ${previous.label}: ${changeLabel(overview.expenseChangePct)}`,
      tone: "text-danger",
      icon: ArrowDownRight,
    },
    {
      label: "Resultado final",
      value: formatSignedCurrency(current.netProfit),
      detail: current.netProfit >= 0 ? "Terminaste arriba este mes" : "Terminaste abajo este mes",
      tone: current.netProfit >= 0 ? "text-success" : "text-danger",
      icon: Wallet,
    },
    {
      label: "Margen",
      value: `${current.margin}%`,
      detail: `${overview.marginChangePts > 0 ? "+" : ""}${overview.marginChangePts} pts vs ${previous.label}`,
      tone: current.margin >= 20 ? "text-success" : current.margin >= 0 ? "text-warning" : "text-danger",
      icon: TrendingUp,
    },
  ]

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
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 p-6">
      <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-white via-primary/5 to-secondary/60 px-6 py-6 shadow-sm">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-primary/10 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Resultados</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Acá ves si realmente estás ganando o perdiendo plata, sin lenguaje contable complicado.
              La lectura está pensada para entender en segundos qué entró, qué salió y qué te quedó.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="h-9 rounded-full bg-primary/10 px-4 text-primary hover:bg-primary/10">
              {currentLabel}
            </Badge>
            <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 backdrop-blur">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Resumen</p>
              <p className={cn("mt-2 text-2xl font-bold tracking-tight", current.netProfit >= 0 ? "text-success" : "text-danger")}>
                {formatSignedCurrency(current.netProfit)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {current.netProfit >= 0 ? "Ganancia del período" : "Pérdida del período"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5">
              <Scale className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {current.netProfit >= 0
                  ? `En ${currentLabel} generaste ${formatCurrency(current.income)}, gastaste ${formatCurrency(current.totalExpenses)} y te quedaron ${formatCurrency(current.netProfit)} de ganancia.`
                  : `En ${currentLabel} generaste ${formatCurrency(current.income)}, gastaste ${formatCurrency(current.totalExpenses)} y cerraste con una pérdida de ${formatCurrency(Math.abs(current.netProfit))}.`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Eso significa que hoy tu margen está en {current.margin}%.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => router.push("/movements?tab=confirmed")}>Ver movimientos</Button>
            <Button variant="outline" onClick={() => router.push("/cashflow")}>Ver flujo de caja</Button>
          </div>
        </CardContent>
      </Card>

      {overview.pendingReviewCount > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="flex items-start gap-3 px-6 py-5">
            <AlertTriangle className="mt-0.5 size-5 text-warning" />
            <div>
              <p className="text-sm font-semibold text-warning">
                Todavía hay datos por revisar
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tenés {overview.pendingReviewCount} movimiento(s) pendientes. Este resumen está bueno para decidir rápido, pero puede cambiar cuando esos movimientos se confirmen.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="overflow-hidden border-border/80">
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
          )
        })}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Tabla de resultados</CardTitle>
            <CardDescription>
              Leé esta tabla como: lo que entró, lo que costó vender, lo que gastaste para operar y lo que te quedó.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="overflow-x-auto rounded-2xl border border-border/80 bg-card">
              <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Qué significa</TableHead>
                  <TableHead>{currentLabel}</TableHead>
                  <TableHead>{previousLabel}</TableHead>
                  <TableHead className="text-right">Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {current.lines.map((line) => {
                  const previousLine = previous.lines.find((item) => item.id === line.id)
                  const comparison = previousLine ? line.value - previousLine.value : 0

                  return (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium text-foreground">{line.label}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{line.description}</TableCell>
                      <TableCell className={cn(
                        "font-semibold",
                        line.tone === "success" && "text-success",
                        line.tone === "danger" && "text-danger",
                        line.tone === "warning" && "text-warning",
                      )}>
                        {formatSignedCurrency(line.value)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {previousLine ? formatSignedCurrency(previousLine.value) : "-"}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-medium",
                        comparison > 0 && line.id !== "direct-costs" && line.id !== "operating-expenses" && "text-success",
                        comparison < 0 && line.id !== "direct-costs" && line.id !== "operating-expenses" && "text-danger",
                        comparison > 0 && (line.id === "direct-costs" || line.id === "operating-expenses") && "text-danger",
                        comparison < 0 && (line.id === "direct-costs" || line.id === "operating-expenses") && "text-success",
                      )}>
                        {previousLine ? formatSignedCurrency(comparison) : "-"}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Qué explica el resultado</CardTitle>
              <CardDescription>
                Las categorías que más pesaron este mes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6">
              {current.topExpenseCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">Todavía no hay gastos confirmados para este período.</p>
              ) : (
                current.topExpenseCategories.map((item) => (
                  <button
                    key={item.category}
                    onClick={() => router.push(`/movements?tab=confirmed&category=${encodeURIComponent(item.category)}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/80 bg-muted/10 px-4 py-3 text-left transition-all hover:border-primary/30 hover:bg-muted/20"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{item.category}</p>
                      <p className="text-xs text-muted-foreground">{item.share}% del gasto del mes</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{formatCurrency(item.amount)}</span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Señales útiles</CardTitle>
              <CardDescription>
                Alertas y oportunidades pensadas para decidir rápido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6">
              {insights.map((insight) => (
                <div key={insight.id} className={cn("rounded-2xl border p-4", insightToneClass(insight.tone))}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-white/70 p-2">
                      <Sparkles className="size-4 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
                      <Button variant="link" className="mt-2 h-auto p-0 text-primary" onClick={() => router.push(insight.href)}>
                        {insight.actionLabel}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Cómo lo estamos leyendo</CardTitle>
              <CardDescription>
                Para hacerlo simple, Syncro separa automáticamente costo directo y gasto del negocio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-6 pb-6 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/80 bg-muted/10 p-4">
                <p>Ingresos: todo lo que entró como venta o cobro.</p>
                <p className="mt-2">Costos directos: lo que te costó entregar o producir.</p>
                <p className="mt-2">Gastos del negocio: sueldos, alquiler, herramientas, marketing y operación.</p>
                <p className="mt-2">Resultado final: lo que realmente te quedó después de todo.</p>
              </div>
              <p>{current.directCosts > 0 ? "Este mes ya detectamos costos directos en tus movimientos." : "Este mes todavía no detectamos costos directos claros; si aparecen, esta lectura se vuelve más precisa."}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

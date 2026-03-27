import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from "date-fns"

import {
  baseCashBalance,
  clients as baseClients,
  insights as baseInsights,
  planningHorizonDays,
  scheduledCashEvents,
  type Client,
  type Insight,
  type Invoice,
  type NavigationTarget,
  type ScheduledCashEvent,
  type Transaction,
} from "./data"

export type ScenarioKey = "collect_overdue" | "delay_supplier" | "trim_saas"
export type ScenarioState = Record<ScenarioKey, boolean>
export type InvoiceFilter = "all" | "overdue" | "due-soon" | "expected" | "pending" | "paid"
export type MovementTab = "confirmed" | "pending" | "duplicate"

export type ForecastEvent = ScheduledCashEvent & {
  source: "schedule" | "invoice" | "scenario"
  relatedInvoiceId?: string
}

export type CashflowPoint = {
  date: string
  label: string
  balance: number
  income: number
  expenses: number
  events: ForecastEvent[]
}

export type CashflowMetrics = {
  currentBalance: number
  endingBalance: number
  projectedLow: number
  projectedLowDate: string
  zeroDay: string | null
  zeroDayLabel: string | null
  daysUntilZero: number | null
  dailyBurnRate: number
  upcomingIncome: number
  upcomingExpenses: number
}

export type TodayAction = {
  id: string
  title: string
  description: string
  priority: "critical" | "high" | "medium"
  moneyImpact: number
  daysImpact: number
  owner: string
  target: NavigationTarget
}

export type WhyReason = {
  id: string
  title: string
  metric: string
  description: string
  tone: "danger" | "warning" | "primary"
  target: NavigationTarget
}

export type ClientRecord = Client & {
  totalOwed: number
  invoiceCount: number
  overdueCount: number
  overdueAmount: number
  paymentRate: number
}

export const TODAY = startOfDay(new Date())
export const DUE_SOON_DAYS = 7

export const defaultScenarioState: ScenarioState = {
  collect_overdue: false,
  delay_supplier: false,
  trim_saas: false,
}

export const scenarioOptions: {
  key: ScenarioKey
  label: string
  description: string
  impactLabel: string
}[] = [
  {
    key: "collect_overdue",
    label: "Collect overdue invoices",
    description: "Run a focused collections sprint and bring overdue cash forward.",
    impactLabel: "+$28,300 and more runway",
  },
  {
    key: "delay_supplier",
    label: "Delay hardware supplier",
    description: "Push the hardware catch-up payment until after the next collections batch.",
    impactLabel: "Moves the sharpest outflow later",
  },
  {
    key: "trim_saas",
    label: "Trim SaaS spend",
    description: "Cancel duplicate or low-usage tools to create a faster cash buffer.",
    impactLabel: "+$800 immediate relief",
  },
]

const toISODate = (date: Date) => format(date, "yyyy-MM-dd")

export function buildHref(target?: NavigationTarget) {
  if (!target) return "#"
  const search = new URLSearchParams(target.params)
  const query = search.toString()
  return `${target.pathname}${query ? `?${query}` : ""}`
}

export function formatCurrency(value: number) {
  return `$${Math.abs(value).toLocaleString()}`
}

export function formatSignedCurrency(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString()}`
}

export function formatShortDate(dateString: string) {
  return format(parseISO(dateString), "MMM d")
}

export function getInvoiceBucket(invoice: Invoice, referenceDate = TODAY): InvoiceFilter {
  if (invoice.status === "paid") return "paid"

  const dueDate = parseISO(invoice.dueDate)
  const daysToDue = differenceInCalendarDays(dueDate, referenceDate)

  if (invoice.status === "overdue" || isBefore(dueDate, referenceDate)) {
    return "overdue"
  }

  if (daysToDue <= DUE_SOON_DAYS) {
    return "due-soon"
  }

  return "expected"
}

export function matchesInvoiceFilter(invoice: Invoice, filter: InvoiceFilter) {
  if (filter === "all") return true
  if (filter === "pending") return invoice.status !== "paid"
  return getInvoiceBucket(invoice) === filter
}

export function getOutstandingInvoices(invoices: Invoice[]) {
  return invoices.filter((invoice) => invoice.status !== "paid")
}

export function getInvoiceSummary(invoices: Invoice[]) {
  const outstanding = getOutstandingInvoices(invoices)
  const overdue = outstanding.filter((invoice) => getInvoiceBucket(invoice) === "overdue")
  const dueSoon = outstanding.filter((invoice) => getInvoiceBucket(invoice) === "due-soon")
  const paid = invoices.filter((invoice) => invoice.status === "paid")

  return {
    outstandingAmount: outstanding.reduce((sum, invoice) => sum + invoice.amount, 0),
    overdueAmount: overdue.reduce((sum, invoice) => sum + invoice.amount, 0),
    dueSoonAmount: dueSoon.reduce((sum, invoice) => sum + invoice.amount, 0),
    paidAmount: paid.reduce((sum, invoice) => sum + invoice.amount, 0),
    overdueCount: overdue.length,
    dueSoonCount: dueSoon.length,
  }
}

export function getCurrentBalance(transactions: Transaction[]) {
  const confirmedNet = transactions
    .filter((transaction) => transaction.status === "confirmed")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  return baseCashBalance + confirmedNet
}

export function getBurnRate(transactions: Transaction[]) {
  const confirmedExpenses = transactions.filter(
    (transaction) => transaction.status === "confirmed" && transaction.amount < 0,
  )

  const totalConfirmedExpenses = confirmedExpenses.reduce(
    (sum, transaction) => sum + Math.abs(transaction.amount),
    0,
  )

  return Math.round(totalConfirmedExpenses / Math.max(confirmedExpenses.length, 1))
}

function buildInvoiceForecastEvents(invoices: Invoice[]): ForecastEvent[] {
  return invoices.flatMap((invoice) =>
    invoice.expectedPayments.map((payment, index) => ({
      id: `forecast-${invoice.id}-${index}`,
      date: payment.date,
      label: `${invoice.client} collection`,
      amount: payment.amount,
      type: "income" as const,
      description: payment.note,
      source: "invoice" as const,
      relatedInvoiceId: invoice.id,
      target: {
        pathname: "/invoices",
        params: { highlight: invoice.id },
      },
    })),
  )
}

function applyCollectOverdueScenario(invoices: Invoice[], events: ForecastEvent[]) {
  const overdueInvoices = invoices.filter((invoice) => getInvoiceBucket(invoice) === "overdue")
  const overdueIds = new Set(overdueInvoices.map((invoice) => invoice.id))
  const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)

  const withoutExistingOverdueForecast = events.filter(
    (event) => !(event.relatedInvoiceId && overdueIds.has(event.relatedInvoiceId)),
  )

  withoutExistingOverdueForecast.push({
    id: "scenario-collect-overdue",
    date: toISODate(addDays(TODAY, 3)),
    label: "Collections sprint closes overdue invoices",
    amount: overdueAmount,
    type: "income",
    description: "Assumes the team actively escalates and closes the overdue receivables this week.",
    source: "scenario",
    target: {
      pathname: "/invoices",
      params: { status: "overdue", focus: "collections" },
    },
  })

  return withoutExistingOverdueForecast
}

function applyDelaySupplierScenario(events: ForecastEvent[]) {
  return events.map((event) =>
    event.id === "forecast-supplier-catchup"
      ? {
          ...event,
          date: toISODate(addDays(TODAY, 22)),
          description: "Supplier payment moved after the next collections batch.",
        }
      : event,
  )
}

function applyTrimSaasScenario(events: ForecastEvent[]) {
  return [
    ...events,
    {
      id: "scenario-trim-saas",
      date: toISODate(addDays(TODAY, 12)),
      label: "SaaS savings land",
      amount: 800,
      type: "income" as const,
      description: "Duplicate tools and inactive seats are removed from the next billing cycle.",
      source: "scenario" as const,
      target: {
        pathname: "/movements",
        params: { tab: "confirmed", category: "SaaS", focus: "saas" },
      },
    },
  ]
}

export function buildForecastEvents(
  invoices: Invoice[],
  scenario: ScenarioState = defaultScenarioState,
) {
  let events: ForecastEvent[] = [
    ...scheduledCashEvents.map((event) => ({ ...event, source: "schedule" as const })),
    ...buildInvoiceForecastEvents(invoices),
  ]

  if (scenario.collect_overdue) {
    events = applyCollectOverdueScenario(invoices, events)
  }

  if (scenario.delay_supplier) {
    events = applyDelaySupplierScenario(events)
  }

  if (scenario.trim_saas) {
    events = applyTrimSaasScenario(events)
  }

  return events.sort((left, right) => {
    if (left.date === right.date) {
      return left.amount - right.amount
    }

    return left.date.localeCompare(right.date)
  })
}

export function buildCashflowSeries(
  invoices: Invoice[],
  transactions: Transaction[],
  scenario: ScenarioState = defaultScenarioState,
  horizon = planningHorizonDays,
) {
  const events = buildForecastEvents(invoices, scenario)
  let runningBalance = getCurrentBalance(transactions)

  const points: CashflowPoint[] = []

  for (let offset = 0; offset <= horizon; offset += 1) {
    const date = addDays(TODAY, offset)
    const isoDate = toISODate(date)
    const dayEvents = events.filter((event) => event.date === isoDate)
    const delta = dayEvents.reduce((sum, event) => sum + event.amount, 0)
    const income = dayEvents
      .filter((event) => event.amount > 0)
      .reduce((sum, event) => sum + event.amount, 0)
    const expenses = dayEvents
      .filter((event) => event.amount < 0)
      .reduce((sum, event) => sum + Math.abs(event.amount), 0)

    if (offset > 0) {
      runningBalance += delta
    }

    points.push({
      date: isoDate,
      label: offset === 0 ? "Today" : format(date, "MMM d"),
      balance: runningBalance,
      income,
      expenses,
      events: dayEvents,
    })
  }

  return points
}

export function getCashflowMetrics(points: CashflowPoint[], transactions: Transaction[]): CashflowMetrics {
  const currentBalance = points[0]?.balance ?? getCurrentBalance(transactions)
  const endingBalance = points.at(-1)?.balance ?? currentBalance
  const projectedLowPoint =
    points.reduce((lowest, point) => (point.balance < lowest.balance ? point : lowest), points[0]) ??
    points[0]
  const zeroDayPoint = points.find((point, index) => index > 0 && point.balance < 0)
  const upcomingIncome = points.reduce((sum, point) => sum + point.income, 0)
  const upcomingExpenses = points.reduce((sum, point) => sum + point.expenses, 0)

  return {
    currentBalance,
    endingBalance,
    projectedLow: projectedLowPoint?.balance ?? currentBalance,
    projectedLowDate: projectedLowPoint?.date ?? toISODate(TODAY),
    zeroDay: zeroDayPoint?.date ?? null,
    zeroDayLabel: zeroDayPoint ? formatShortDate(zeroDayPoint.date) : null,
    daysUntilZero: zeroDayPoint ? differenceInCalendarDays(parseISO(zeroDayPoint.date), TODAY) : null,
    dailyBurnRate: getBurnRate(transactions),
    upcomingIncome,
    upcomingExpenses,
  }
}

export function getExpenseBreakdown(transactions: Transaction[]) {
  const confirmedExpenses = transactions.filter(
    (transaction) => transaction.status === "confirmed" && transaction.amount < 0,
  )

  const totals = confirmedExpenses.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.category] =
      (accumulator[transaction.category] ?? 0) + Math.abs(transaction.amount)
    return accumulator
  }, {})

  const totalExpenses = Object.values(totals).reduce((sum, value) => sum + value, 0)

  return Object.entries(totals)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: Math.round((amount / Math.max(totalExpenses, 1)) * 100),
    }))
    .sort((left, right) => right.amount - left.amount)
}

export function getHealthScore(
  invoices: Invoice[],
  transactions: Transaction[],
  metrics: CashflowMetrics,
) {
  const overdueAmount = invoices
    .filter((invoice) => getInvoiceBucket(invoice) === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const outstandingAmount = getOutstandingInvoices(invoices).reduce(
    (sum, invoice) => sum + invoice.amount,
    0,
  )
  const duplicates = transactions.filter((transaction) => transaction.status === "duplicate").length
  const pendingDetected = transactions.filter((transaction) => transaction.status === "pending").length
  const saasSpend = transactions
    .filter((transaction) => transaction.category === "SaaS")
    .reduce((sum, transaction) => sum + Math.abs(Math.min(transaction.amount, 0)), 0)
  const totalSpend = transactions
    .filter((transaction) => transaction.amount < 0 && transaction.status === "confirmed")
    .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

  let score = 100

  if (metrics.daysUntilZero !== null) {
    if (metrics.daysUntilZero <= 7) score -= 35
    else if (metrics.daysUntilZero <= 14) score -= 20
  }

  if (outstandingAmount > 0) {
    const overdueRatio = overdueAmount / outstandingAmount
    if (overdueRatio >= 0.5) score -= 22
    else if (overdueRatio >= 0.3) score -= 14
  }

  if (totalSpend > 0 && saasSpend / totalSpend >= 0.16) {
    score -= 8
  }

  score -= duplicates * 4
  score -= pendingDetected * 3

  return Math.max(12, Math.min(96, Math.round(score)))
}

export function getTodayActions(invoices: Invoice[], transactions: Transaction[], metrics: CashflowMetrics) {
  const overdueInvoices = invoices.filter((invoice) => getInvoiceBucket(invoice) === "overdue")
  const deltaExposure = overdueInvoices
    .filter((invoice) => invoice.clientId === "c3")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const saasSpend = transactions
    .filter((transaction) => transaction.category === "SaaS")
    .reduce((sum, transaction) => sum + Math.abs(Math.min(transaction.amount, 0)), 0)

  const actions: TodayAction[] = [
    {
      id: "action-acme",
      title: "Call Acme Corp for the promised transfer",
      description: "INV-001 is overdue and already has a promised partial payment in the horizon.",
      priority: "critical",
      moneyImpact: 12500,
      daysImpact: 10,
      owner: "Collections",
      target: {
        pathname: "/invoices",
        params: { status: "overdue", highlight: "INV-001" },
      },
    },
    {
      id: "action-delta",
      title: "Escalate Delta Systems before cash gets tighter",
      description: "Two overdue invoices from the same client are creating the biggest collection bottleneck.",
      priority: "critical",
      moneyImpact: deltaExposure,
      daysImpact: 12,
      owner: "Founder",
      target: {
        pathname: "/invoices",
        params: { status: "overdue", client: "c3", focus: "collections" },
      },
    },
    {
      id: "action-supplier",
      title: "Negotiate the hardware supplier catch-up date",
      description: "Moving one supplier payment clears the biggest forecast dip before collections arrive.",
      priority: metrics.daysUntilZero !== null && metrics.daysUntilZero <= 8 ? "high" : "medium",
      moneyImpact: 12500,
      daysImpact: 7,
      owner: "Finance",
      target: {
        pathname: "/cashflow",
        params: { focus: "scenario-supplier" },
      },
    },
    {
      id: "action-saas",
      title: "Trim SaaS before the next billing cycle closes",
      description: "Pending tool charges and duplicate subscriptions still need review.",
      priority: "medium",
      moneyImpact: Math.min(saasSpend, 800),
      daysImpact: 4,
      owner: "Ops",
      target: {
        pathname: "/movements",
        params: { tab: "pending", category: "SaaS", focus: "saas" },
      },
    },
  ]

  return actions
}

export function getWhyReasons(invoices: Invoice[], transactions: Transaction[], metrics: CashflowMetrics) {
  const firstWeekExpenses = buildForecastEvents(invoices)
    .filter(
      (event) =>
        event.amount < 0 &&
        differenceInCalendarDays(parseISO(event.date), TODAY) >= 0 &&
        differenceInCalendarDays(parseISO(event.date), TODAY) <= 7,
    )
    .reduce((sum, event) => sum + Math.abs(event.amount), 0)
  const firstWeekIncome = buildForecastEvents(invoices)
    .filter(
      (event) =>
        event.amount > 0 &&
        differenceInCalendarDays(parseISO(event.date), TODAY) >= 0 &&
        differenceInCalendarDays(parseISO(event.date), TODAY) <= 7,
    )
    .reduce((sum, event) => sum + event.amount, 0)
  const overdueAmount = invoices
    .filter((invoice) => getInvoiceBucket(invoice) === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const recurringSaas = transactions
    .filter((transaction) => transaction.category === "SaaS")
    .reduce((sum, transaction) => sum + Math.abs(Math.min(transaction.amount, 0)), 0)

  const reasons: WhyReason[] = [
    {
      id: "reason-outflows",
      title: "Large outflows hit before collections",
      metric: `${formatCurrency(firstWeekExpenses)} out vs ${formatCurrency(firstWeekIncome)} in this week`,
      description:
        "Payroll, rent, and a supplier catch-up all land before your next major invoice collections.",
      tone: "danger",
      target: {
        pathname: "/cashflow",
        params: { focus: "timeline" },
      },
    },
    {
      id: "reason-overdue",
      title: "Overdue receivables are still frozen",
      metric: `${formatCurrency(overdueAmount)} overdue`,
      description:
        "The forecast depends on cash that should already be in the bank but is still blocked in collections.",
      tone: "warning",
      target: {
        pathname: "/invoices",
        params: { status: "overdue", focus: "collections" },
      },
    },
    {
      id: "reason-saas",
      title: "Recurring software costs are stacked on top of fixed costs",
      metric: `${formatCurrency(recurringSaas)} in tracked SaaS`,
      description:
        "Tooling is not the main risk by itself, but it compounds the cash squeeze when collections slip.",
      tone: metrics.daysUntilZero !== null && metrics.daysUntilZero <= 8 ? "warning" : "primary",
      target: {
        pathname: "/movements",
        params: { tab: "confirmed", category: "SaaS", focus: "saas" },
      },
    },
  ]

  return reasons
}

export function getClientRecords(invoices: Invoice[]) {
  return baseClients.map((client) => {
    const clientInvoices = invoices.filter((invoice) => invoice.clientId === client.id)
    const outstanding = clientInvoices.filter((invoice) => invoice.status !== "paid")
    const overdueInvoices = clientInvoices.filter((invoice) => getInvoiceBucket(invoice) === "overdue")
    const paidInvoices = clientInvoices.filter((invoice) => invoice.status === "paid")

    return {
      ...client,
      totalOwed: outstanding.reduce((sum, invoice) => sum + invoice.amount, 0),
      invoiceCount: clientInvoices.length,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, invoice) => sum + invoice.amount, 0),
      paymentRate: Math.round((paidInvoices.length / Math.max(clientInvoices.length, 1)) * 100),
    }
  })
}

export function getMovementCounts(transactions: Transaction[]) {
  return {
    confirmed: transactions.filter((transaction) => transaction.status === "confirmed").length,
    pending: transactions.filter((transaction) => transaction.status === "pending").length,
    duplicate: transactions.filter((transaction) => transaction.status === "duplicate").length,
  }
}

export function getUncategorizedTransactions(transactions: Transaction[]) {
  return transactions.filter(
    (transaction) => transaction.category === "Other" || Boolean(transaction.suggestedCategory),
  )
}

export function getInsights(invoices: Invoice[], transactions: Transaction[]) {
  const metrics = getCashflowMetrics(buildCashflowSeries(invoices, transactions), transactions)
  const score = getHealthScore(invoices, transactions, metrics)

  return {
    insights: baseInsights,
    healthScore: score,
  }
}

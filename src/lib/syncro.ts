import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isValid,
  isSameMonth,
  parseISO,
  startOfDay,
  subMonths,
} from "date-fns"
import { es } from "date-fns/locale"

import {
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
export type MovementStatus = "confirmed" | "pending_review" | "duplicate" | "detected"
export type MovementTab = "confirmed" | "pending_review" | "duplicate"

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

export type InvoiceSummary = {
  outstandingAmount: number
  overdueAmount: number
  dueSoonAmount: number
  paidAmount: number
  overdueCount: number
  dueSoonCount: number
  receivablesOutstanding: number
  payablesOutstanding: number
  overdueReceivables: number
  dueSoonPayables: number
}

export type ResultsLine = {
  id: string
  label: string
  description: string
  value: number
  tone: "default" | "success" | "danger" | "warning"
}

export type ResultsCategoryShare = {
  category: string
  amount: number
  share: number
}

export type ResultsPeriodSummary = {
  label: string
  income: number
  directCosts: number
  grossProfit: number
  operatingExpenses: number
  totalExpenses: number
  netProfit: number
  margin: number
  lines: ResultsLine[]
  topExpenseCategories: ResultsCategoryShare[]
  transactionCount: number
}

export type ResultsOverview = {
  current: ResultsPeriodSummary
  previous: ResultsPeriodSummary
  incomeChangePct: number | null
  expenseChangePct: number | null
  netChangePct: number | null
  marginChangePts: number
  pendingReviewCount: number
  pendingReviewAmount: number
  topThreeExpenseShare: number
}

type RuntimeInsightOptions = {
  id: string
  title: string
  severity: Insight["severity"]
  summary: string
  what: string
  why: string
  action: string
  benefit?: string
  moneyImpact?: number
  daysImpact?: number
  ctaLabel: string
  target: NavigationTarget
}

export const TODAY = startOfDay(new Date())
export const DUE_SOON_DAYS = 7
const SUPPLIER_EVENT_PATTERN = /supplier|proveedor|hardware/i
const MONEY_LOCALE = "es-AR"

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
  impactSummary: string
  improvesCash: boolean
  improvesResult: boolean
}[] = [
  {
    key: "collect_overdue",
    label: "Cobrar vencidas",
    description: "Trae a hoy cobros ya devengados para aliviar la caja sin cambiar la rentabilidad.",
    impactLabel: "mejora caja",
    impactSummary: "Acelera el ingreso de efectivo de facturas vencidas, pero no cambia el resultado.",
    improvesCash: true,
    improvesResult: false,
  },
  {
    key: "delay_supplier",
    label: "Mover pago fuerte",
    description: "Patea un egreso relevante para después del próximo bloque de cobros y mejora la caja de corto plazo.",
    impactLabel: "mejora caja",
    impactSummary: "Reordena el momento del pago, pero no cambia el resultado del negocio.",
    improvesCash: true,
    improvesResult: false,
  },
  {
    key: "trim_saas",
    label: "Recortar gasto recurrente",
    description: "Elimina herramientas duplicadas o de bajo uso para bajar salidas de caja y gasto operativo.",
    impactLabel: "mejora caja y resultado",
    impactSummary: "Reduce pagos futuros y también mejora el resultado al recortar gasto recurrente.",
    improvesCash: true,
    improvesResult: true,
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
  return `$${Math.abs(value).toLocaleString(MONEY_LOCALE)}`
}

export function formatSignedCurrency(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}$${Math.abs(value).toLocaleString(MONEY_LOCALE)}`
}

export function getSignedAmount(amount: number, type: "income" | "expense") {
  return type === "expense" ? -Math.abs(amount) : Math.abs(amount)
}

export function getSignedTransactionAmount(transaction: Pick<Transaction, "amount" | "type">) {
  return getSignedAmount(transaction.amount, transaction.type)
}

export function getSignedEventAmount(event: Pick<ScheduledCashEvent, "amount" | "type">) {
  return getSignedAmount(event.amount, event.type)
}

export function formatShortDate(dateString?: string | null, fallback = "Sin fecha") {
  if (!dateString?.trim()) {
    return fallback
  }

  const parsedDate = parseISO(dateString)

  if (!isValid(parsedDate)) {
    return fallback
  }

  return format(parsedDate, "d MMM", { locale: es })
}

export function getInvoiceBucketLabel(bucket: InvoiceFilter) {
  if (bucket === "all") return "Todas"
  if (bucket === "overdue") return "Vencidas"
  if (bucket === "due-soon") return "Por vencer"
  if (bucket === "expected") return "Esperadas"
  if (bucket === "pending") return "Abiertas"
  return "Cobradas"
}

export function getPriorityLabel(priority: Invoice["priority"]) {
  if (priority === "high") return "Alta"
  if (priority === "medium") return "Media"
  return "Baja"
}

export function getMovementSourceLabel(source: Transaction["source"]) {
  if (source === "manual") return "Manual"
  if (source === "bank") return "Banco"
  if (source === "email" || source === "gmail") return "Email"
  if (source === "invoice") return "Factura"
  if (source === "import") return "Importación"
  if (source === "telegram") return "Telegram"
  return source
}

export function getMovementTypeLabel(type: Transaction["type"]) {
  return type === "income" ? "Ingreso" : "Gasto"
}

export function getRiskLabel(risk: Client["riskScore"]) {
  if (risk === "high") return "Alto"
  if (risk === "medium") return "Medio"
  return "Bajo"
}

function getPercentageChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) return 0
    return null
  }

  return Math.round(((current - previous) / Math.abs(previous)) * 100)
}

function normalizeCategoryKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

export function classifyExpenseBucket(category: string, description = ""): "direct-cost" | "operating-expense" {
  const source = normalizeCategoryKey(`${category} ${description}`)
  const directCostPatterns = [
    /costo de ventas/,
    /cost of sales/,
    /mercader/,
    /materia prima/,
    /insumo/,
    /hardware/,
    /contratista/,
    /contractor/,
    /produccion/,
    /logistica/,
    /freelancer/,
    /entrega/,
  ]

  return directCostPatterns.some((pattern) => pattern.test(source)) ? "direct-cost" : "operating-expense"
}

function buildResultsPeriodSummary(
  transactions: Transaction[],
  referenceDate: Date,
  label: string,
): ResultsPeriodSummary {
  const monthTransactions = transactions.filter(
    (transaction) =>
      transaction.status === "confirmed" &&
      isSameMonth(parseISO(transaction.date), referenceDate),
  )

  const income = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const expenseTransactions = monthTransactions.filter((transaction) => transaction.type === "expense")
  const directCosts = expenseTransactions
    .filter((transaction) => classifyExpenseBucket(transaction.category, transaction.description) === "direct-cost")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const operatingExpenses = expenseTransactions
    .filter((transaction) => classifyExpenseBucket(transaction.category, transaction.description) === "operating-expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const grossProfit = income - directCosts
  const totalExpenses = directCosts + operatingExpenses
  const netProfit = grossProfit - operatingExpenses
  const margin = income > 0 ? Math.round((netProfit / income) * 100) : 0

  const expenseCategoriesMap = expenseTransactions.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.category] = (accumulator[transaction.category] ?? 0) + transaction.amount
    return accumulator
  }, {})

  const topExpenseCategories = Object.entries(expenseCategoriesMap)
    .map(([category, amount]) => ({
      category,
      amount,
      share: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, 5)

  return {
    label,
    income,
    directCosts,
    grossProfit,
    operatingExpenses,
    totalExpenses,
    netProfit,
    margin,
    lines: [
      {
        id: "income",
        label: "Ingresos",
        description: "Lo que vendiste o cobraste este período.",
        value: income,
        tone: "success",
      },
      {
        id: "direct-costs",
        label: "Costos directos",
        description: "Lo que te costó generar esas ventas.",
        value: -directCosts,
        tone: "danger",
      },
      {
        id: "gross-profit",
        label: "Resultado bruto",
        description: "Lo que te queda después de cubrir el costo de vender.",
        value: grossProfit,
        tone: grossProfit >= 0 ? "default" : "danger",
      },
      {
        id: "operating-expenses",
        label: "Gastos del negocio",
        description: "Lo que gastaste para operar: sueldos, alquiler, marketing, herramientas y más.",
        value: -operatingExpenses,
        tone: "warning",
      },
      {
        id: "net-profit",
        label: "Resultado final",
        description: netProfit >= 0 ? "Lo que realmente ganaste." : "Lo que realmente perdiste.",
        value: netProfit,
        tone: netProfit >= 0 ? "success" : "danger",
      },
    ],
    topExpenseCategories,
    transactionCount: monthTransactions.length,
  }
}

export function getResultsOverview(transactions: Transaction[], referenceDate = new Date()): ResultsOverview {
  const current = buildResultsPeriodSummary(
    transactions,
    referenceDate,
    format(referenceDate, "MMMM yyyy", { locale: es }),
  )
  const previousDate = subMonths(referenceDate, 1)
  const previous = buildResultsPeriodSummary(
    transactions,
    previousDate,
    format(previousDate, "MMMM yyyy", { locale: es }),
  )
  const pendingReviewTransactions = transactions.filter((transaction) => transaction.status !== "confirmed")

  return {
    current,
    previous,
    incomeChangePct: getPercentageChange(current.income, previous.income),
    expenseChangePct: getPercentageChange(current.totalExpenses, previous.totalExpenses),
    netChangePct: getPercentageChange(current.netProfit, previous.netProfit),
    marginChangePts: current.margin - previous.margin,
    pendingReviewCount: pendingReviewTransactions.length,
    pendingReviewAmount: pendingReviewTransactions.reduce((sum, transaction) => sum + transaction.amount, 0),
    topThreeExpenseShare: current.topExpenseCategories.slice(0, 3).reduce((sum, item) => sum + item.share, 0),
  }
}

export function getInvoiceType(invoice: Invoice): "receivable" | "payable" {
  return invoice.type ?? "receivable"
}

export function getInvoiceTotalAmount(invoice: Invoice) {
  return invoice.totalAmount ?? invoice.amount
}

export function getInvoicePaidAmount(invoice: Invoice) {
  if (invoice.paidAmount !== undefined) {
    return invoice.paidAmount
  }

  return invoice.paymentHistory.reduce((sum, payment) => sum + payment.amount, 0)
}

export function getInvoiceOutstandingAmount(invoice: Invoice) {
  return Math.max(getInvoiceTotalAmount(invoice) - getInvoicePaidAmount(invoice), 0)
}

export function getInvoiceSignedOutstandingAmount(invoice: Invoice) {
  const outstanding = getInvoiceOutstandingAmount(invoice)
  return getInvoiceType(invoice) === "payable" ? -outstanding : outstanding
}

export function getInvoiceBucket(invoice: Invoice, referenceDate = TODAY): InvoiceFilter {
  if (invoice.status === "paid" || getInvoiceOutstandingAmount(invoice) <= 0) return "paid"
  if (!invoice.dueDate) return "expected"

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
  if (filter === "pending") return getInvoiceOutstandingAmount(invoice) > 0
  return getInvoiceBucket(invoice) === filter
}

export function getOutstandingInvoices(invoices: Invoice[]) {
  return invoices.filter(
    (invoice) => getInvoiceType(invoice) === "receivable" && getInvoiceOutstandingAmount(invoice) > 0,
  )
}

export function getInvoiceSummary(invoices: Invoice[]): InvoiceSummary {
  const receivables = invoices.filter((invoice) => getInvoiceType(invoice) === "receivable")
  const payables = invoices.filter((invoice) => getInvoiceType(invoice) === "payable")
  const outstandingReceivables = receivables.filter((invoice) => getInvoiceOutstandingAmount(invoice) > 0)
  const outstandingPayables = payables.filter((invoice) => getInvoiceOutstandingAmount(invoice) > 0)
  const overdueReceivables = outstandingReceivables.filter(
    (invoice) => getInvoiceBucket(invoice) === "overdue",
  )
  const dueSoonPayables = outstandingPayables.filter(
    (invoice) => getInvoiceBucket(invoice) === "due-soon",
  )
  const paidAmount = invoices.reduce((sum, invoice) => sum + getInvoicePaidAmount(invoice), 0)

  return {
    outstandingAmount:
      outstandingReceivables.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0) +
      outstandingPayables.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0),
    overdueAmount: overdueReceivables.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0),
    dueSoonAmount: dueSoonPayables.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0),
    paidAmount,
    overdueCount: overdueReceivables.length,
    dueSoonCount: dueSoonPayables.length,
    receivablesOutstanding: outstandingReceivables.reduce(
      (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
      0,
    ),
    payablesOutstanding: outstandingPayables.reduce(
      (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
      0,
    ),
    overdueReceivables: overdueReceivables.reduce(
      (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
      0,
    ),
    dueSoonPayables: dueSoonPayables.reduce(
      (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
      0,
    ),
  }
}

export function getCurrentBalance(transactions: Transaction[]) {
  return transactions
    .filter((transaction) => transaction.status === "confirmed")
    .reduce((sum, transaction) => sum + getSignedTransactionAmount(transaction), 0)
}

export function getBurnRate(transactions: Transaction[]) {
  const confirmedExpenses = transactions.filter(
    (transaction) => transaction.status === "confirmed" && transaction.type === "expense",
  )

  const totalConfirmedExpenses = confirmedExpenses.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  )

  return Math.round(totalConfirmedExpenses / Math.max(confirmedExpenses.length, 1))
}

function buildInvoiceForecastEvents(invoices: Invoice[]): ForecastEvent[] {
  return invoices.flatMap((invoice) =>
    invoice.expectedPayments.map((payment, index) => ({
      id: `forecast-${invoice.id}-${index}`,
      date: payment.date,
      label: getInvoiceType(invoice) === "payable" ? `Pago a ${invoice.client}` : `Cobro de ${invoice.client}`,
      amount: payment.amount,
      type: getInvoiceType(invoice) === "payable" ? "expense" as const : "income" as const,
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
  const overdueInvoices = invoices.filter(
    (invoice) =>
      getInvoiceType(invoice) === "receivable" && getInvoiceBucket(invoice) === "overdue",
  )
  const overdueIds = new Set(overdueInvoices.map((invoice) => invoice.id))
  const overdueAmount = overdueInvoices.reduce(
    (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
    0,
  )

  const withoutExistingOverdueForecast = events.filter(
    (event) => !(event.relatedInvoiceId && overdueIds.has(event.relatedInvoiceId)),
  )

  withoutExistingOverdueForecast.push({
    id: "scenario-collect-overdue",
    date: toISODate(addDays(TODAY, 3)),
    label: "Plan para cobrar vencidas",
    amount: overdueAmount,
    type: "income",
    description: "Supone que el equipo empuja y cobra esta semana las facturas ya vencidas.",
    source: "scenario",
    target: {
      pathname: "/invoices",
      params: { status: "overdue", focus: "collections" },
    },
  })

  return withoutExistingOverdueForecast
}

function applyDelaySupplierScenario(events: ForecastEvent[]) {
  const supplierEvent = events.find(
    (event) =>
      event.type === "expense" &&
      SUPPLIER_EVENT_PATTERN.test(`${event.label} ${event.description} ${event.id}`),
  )

  if (!supplierEvent) return events

  return events.map((event) =>
    event.id === supplierEvent.id
      ? {
          ...event,
          date: toISODate(addDays(TODAY, 22)),
          description: "El pago fuerte a proveedor se mueve para después del próximo bloque de cobros.",
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
      label: "Ahorro por recorte de herramientas",
      amount: 800,
      type: "income" as const,
      description: "Se sacan herramientas duplicadas y licencias sin uso del próximo ciclo.",
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
  scheduledEvents: ScheduledCashEvent[] = scheduledCashEvents,
  scenario: ScenarioState = defaultScenarioState,
) {
  let events: ForecastEvent[] = [
    ...scheduledEvents.map((event) => ({ ...event, source: "schedule" as const })),
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
      return getSignedEventAmount(left) - getSignedEventAmount(right)
    }

    return left.date.localeCompare(right.date)
  })
}

export function buildCashflowSeries(
  invoices: Invoice[],
  transactions: Transaction[],
  scheduledEvents: ScheduledCashEvent[] = scheduledCashEvents,
  scenario: ScenarioState = defaultScenarioState,
  horizon = planningHorizonDays,
) {
  const events = buildForecastEvents(invoices, scheduledEvents, scenario)
  let runningBalance = getCurrentBalance(transactions)

  const points: CashflowPoint[] = []

  for (let offset = 0; offset <= horizon; offset += 1) {
    const date = addDays(TODAY, offset)
    const isoDate = toISODate(date)
    const dayEvents = events.filter((event) => event.date === isoDate)
    const delta = dayEvents.reduce((sum, event) => sum + getSignedEventAmount(event), 0)
    const income = dayEvents
      .filter((event) => event.type === "income")
      .reduce((sum, event) => sum + event.amount, 0)
    const expenses = dayEvents
      .filter((event) => event.type === "expense")
      .reduce((sum, event) => sum + event.amount, 0)

    if (offset > 0) {
      runningBalance += delta
    }

    points.push({
      date: isoDate,
      label: offset === 0 ? "Hoy" : format(date, "d MMM", { locale: es }),
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
  const zeroDayPoint = points.find((point) => point.balance < 0)
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
    (transaction) => transaction.status === "confirmed" && transaction.type === "expense",
  )

  const totals = confirmedExpenses.reduce<Record<string, number>>((accumulator, transaction) => {
    accumulator[transaction.category] =
      (accumulator[transaction.category] ?? 0) + transaction.amount
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

function createRuntimeInsight(options: RuntimeInsightOptions): Insight {
  return {
    id: options.id,
    title: options.title,
    severity: options.severity,
    summary: options.summary,
    what: options.what,
    why: options.why,
    action: options.action,
    benefit: options.benefit ?? "",
    moneyImpact: options.moneyImpact ?? 0,
    daysImpact: options.daysImpact ?? 0,
    ctaLabel: options.ctaLabel,
    target: options.target,
  }
}

export function getRuntimeInsights(
  invoices: Invoice[],
  transactions: Transaction[],
  metrics: CashflowMetrics,
  scheduledEvents: ScheduledCashEvent[] = scheduledCashEvents,
) {
  const insights: Insight[] = []
  const receivableInvoices = invoices.filter((invoice) => getInvoiceType(invoice) === "receivable")
  const overdueReceivables = receivableInvoices.filter(
    (invoice) => getInvoiceBucket(invoice) === "overdue" && getInvoiceOutstandingAmount(invoice) > 0,
  )
  const overdueAmount = overdueReceivables.reduce(
    (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
    0,
  )
  const outstandingReceivables = receivableInvoices.filter(
    (invoice) => getInvoiceOutstandingAmount(invoice) > 0,
  )
  const receivablesOutstanding = outstandingReceivables.reduce(
    (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
    0,
  )
  const expenseBreakdown = getExpenseBreakdown(transactions)
  const topExpenseCategory = expenseBreakdown[0]
  const uncategorizedTransactions = getUncategorizedTransactions(transactions)
  const supplierEvent = scheduledEvents.find(
    (event) =>
      event.type === "expense" &&
      SUPPLIER_EVENT_PATTERN.test(`${event.label} ${event.description} ${event.id}`),
  )
  const cuttableCategories = new Set(["SaaS", "Marketing", "Viajes", "Honorarios", "Contratistas"])
  const cuttableExpense = expenseBreakdown.find((item) => cuttableCategories.has(item.category))

  if (overdueReceivables.length > 0) {
    insights.push(createRuntimeInsight({
      id: "runtime-overdue-invoices",
      title: "Hay facturas vencidas frenando la caja",
      severity: overdueReceivables.length >= 3 || overdueAmount >= 10000 ? "critical" : "high",
      summary: `${overdueReceivables.length} factura${overdueReceivables.length === 1 ? "" : "s"} vencida${overdueReceivables.length === 1 ? "" : "s"} retienen ${formatCurrency(overdueAmount)}.`,
      what: `${overdueReceivables.length} factura${overdueReceivables.length === 1 ? "" : "s"} por cobrar ya vencieron y siguen abiertas.`,
      why: "Ese dinero debería haber entrado a caja y hoy es una de las causas más directas de tensión financiera.",
      action: "Entrá a vencidas, ordená por saldo y empezá por la factura más grande o más atrasada.",
      benefit: "Cobrar esta deuda mejora la caja sin recortar operación.",
      moneyImpact: overdueAmount,
      daysImpact: metrics.daysUntilZero !== null ? Math.min(21, overdueReceivables.length * 4) : 0,
      ctaLabel: "Ir a vencidas",
      target: {
        pathname: "/invoices",
        params: { type: "receivable", status: "overdue", focus: "collections" },
      },
    }))
  }

  if (receivablesOutstanding > 0 && receivablesOutstanding >= Math.max(metrics.currentBalance * 0.75, metrics.dailyBurnRate * 8)) {
    insights.push(createRuntimeInsight({
      id: "runtime-collectable-backlog",
      title: "Tenés mucho por cobrar acumulado",
      severity: receivablesOutstanding >= Math.max(metrics.currentBalance, metrics.dailyBurnRate * 12) ? "high" : "medium",
      summary: `Hay ${formatCurrency(receivablesOutstanding)} abiertos en cuentas por cobrar.`,
      what: "La cartera abierta ya es grande en relación con la caja disponible y el ritmo de gasto.",
      why: "Aunque el resultado parezca sano, la caja no mejora hasta que esos cobros se concreten.",
      action: "Revisá las facturas abiertas, identificá promesas de pago débiles y empujá primero los montos grandes.",
      benefit: "Bajar el atraso comercial te da oxígeno sin tocar costos.",
      moneyImpact: receivablesOutstanding,
      daysImpact: Math.max(2, Math.round(receivablesOutstanding / Math.max(metrics.dailyBurnRate, 1))),
      ctaLabel: "Ver por cobrar",
      target: {
        pathname: "/invoices",
        params: { type: "receivable", status: "pending" },
      },
    }))
  }

  if (topExpenseCategory && topExpenseCategory.percentage >= 25) {
    insights.push(createRuntimeInsight({
      id: `runtime-high-expense-${topExpenseCategory.category.toLowerCase().replace(/\s+/g, "-")}`,
      title: `La categoría ${topExpenseCategory.category} está pesando demasiado`,
      severity: topExpenseCategory.percentage >= 35 ? "high" : "medium",
      summary: `${topExpenseCategory.category} representa ${topExpenseCategory.percentage}% del gasto confirmado (${formatCurrency(topExpenseCategory.amount)}).`,
      what: `${topExpenseCategory.category} es hoy la categoría de gasto más pesada.`,
      why: "Cuando una sola categoría concentra demasiado, cualquier desvío ahí te mueve fuerte la caja.",
      action: `Abrí movimientos filtrados por ${topExpenseCategory.category} y revisá qué egresos podés postergar, renegociar o cortar.`,
      benefit: "Atacar la categoría dominante suele generar el mayor alivio con menos fricción.",
      moneyImpact: -topExpenseCategory.amount,
      daysImpact: -Math.max(1, Math.round(topExpenseCategory.amount / Math.max(metrics.dailyBurnRate, 1))),
      ctaLabel: `Revisar ${topExpenseCategory.category}`,
      target: {
        pathname: "/movements",
        params: { tab: "confirmed", category: topExpenseCategory.category },
      },
    }))
  }

  if (uncategorizedTransactions.length > 0) {
    const uncategorizedAmount = uncategorizedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    insights.push(createRuntimeInsight({
      id: "runtime-uncategorized-movements",
      title: "Hay movimientos sin categoría",
      severity: uncategorizedTransactions.length >= 3 ? "high" : "medium",
      summary: `${uncategorizedTransactions.length} movimiento${uncategorizedTransactions.length === 1 ? "" : "s"} siguen sin categoría visible.`,
      what: "Todavía hay transacciones que no quedaron clasificadas o siguen en Otros.",
      why: "Eso distorsiona el análisis de gasto y hace que los siguientes insights sean menos confiables.",
      action: "Entrá al filtro de sin categoría y confirmá o corregí categoría antes de seguir analizando.",
      benefit: "Limpiar este bloque mejora la calidad de decisiones y evita ruido en reportes.",
      moneyImpact: -uncategorizedAmount,
      ctaLabel: "Clasificar movimientos",
      target: {
        pathname: "/movements",
        params: { tab: "pending_review", quickFilter: "uncategorized" },
      },
    }))
  }

  if (metrics.daysUntilZero !== null && receivablesOutstanding > metrics.currentBalance) {
    insights.push(createRuntimeInsight({
      id: "runtime-cash-vs-result-gap",
      title: "Hay diferencia entre caja y resultado",
      severity: metrics.daysUntilZero <= 10 ? "critical" : "high",
      summary: `El negocio tiene ${formatCurrency(receivablesOutstanding)} por cobrar, pero la caja igual se tensa en ${metrics.daysUntilZero} días.`,
      what: "Hay ventas o cobros pendientes en el papel, pero los egresos salen antes de que ese dinero entre.",
      why: "Esta brecha explica por qué podés sentirte apretado de caja aunque el mes no se vea malo en resultados.",
      action: "Mirá el flujo de caja y compará cuándo entra cada cobro versus cuándo golpean payroll, proveedor y otros egresos.",
      benefit: "Entender esta diferencia evita decisiones equivocadas basadas solo en facturación.",
      moneyImpact: receivablesOutstanding - metrics.currentBalance,
      daysImpact: -metrics.daysUntilZero,
      ctaLabel: "Abrir flujo de caja",
      target: {
        pathname: "/cashflow",
        params: { focus: "zero-day" },
      },
    }))
  }

  if (cuttableExpense && (cuttableExpense.category === "SaaS" || cuttableExpense.percentage >= 10 || supplierEvent)) {
    const targetCategory = cuttableExpense.category
    insights.push(createRuntimeInsight({
      id: `runtime-cuttable-${targetCategory.toLowerCase().replace(/\s+/g, "-")}`,
      title: "Hay gasto recortable a corto plazo",
      severity: targetCategory === "SaaS" ? "high" : "medium",
      summary: `${targetCategory} suma ${formatCurrency(cuttableExpense.amount)} y aparece como un buen candidato para recorte.`,
      what: `Parte del gasto de ${targetCategory} no parece estructural o admite revisión rápida.`,
      why: "Es una palanca concreta para ganar aire sin esperar cobranzas ni tocar áreas más sensibles.",
      action: `Entrá a ${targetCategory}, validá recurrencias, duplicados o tickets no prioritarios y definí qué se corta este ciclo.`,
      benefit: "Un recorte quirúrgico mejora caja y, en varios casos, también resultado.",
      moneyImpact: Math.round(cuttableExpense.amount * 0.2),
      daysImpact: Math.max(1, Math.round((cuttableExpense.amount * 0.2) / Math.max(metrics.dailyBurnRate, 1))),
      ctaLabel: `Recortar ${targetCategory}`,
      target: {
        pathname: "/movements",
        params: { tab: "confirmed", category: targetCategory, focus: targetCategory === "SaaS" ? "saas" : "timeline" },
      },
    }))
  }

  return insights
}

export function getHealthScore(
  invoices: Invoice[],
  transactions: Transaction[],
  metrics: CashflowMetrics,
) {
  const overdueAmount = invoices
    .filter((invoice) => getInvoiceType(invoice) === "receivable" && getInvoiceBucket(invoice) === "overdue")
    .reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0)
  const outstandingAmount = getOutstandingInvoices(invoices).reduce(
    (sum, invoice) => sum + getInvoiceOutstandingAmount(invoice),
    0,
  )
  const duplicates = transactions.filter((transaction) => transaction.status === "duplicate").length
  const pendingDetected = transactions.filter(
    (transaction) => transaction.status === "pending_review" || transaction.status === "detected",
  ).length
  const saasSpend = transactions
    .filter((transaction) => transaction.category === "SaaS" && transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const totalSpend = transactions
    .filter((transaction) => transaction.type === "expense" && transaction.status === "confirmed")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

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

export function getTodayActions(
  invoices: Invoice[],
  transactions: Transaction[],
  metrics: CashflowMetrics,
  scheduledEvents: ScheduledCashEvent[] = scheduledCashEvents,
) {
  const overdueInvoices = invoices.filter((invoice) => getInvoiceBucket(invoice) === "overdue")
    .filter((invoice) => getInvoiceType(invoice) === "receivable")
  const largestOverdue = overdueInvoices
    .slice()
    .sort(
      (left, right) => getInvoiceOutstandingAmount(right) - getInvoiceOutstandingAmount(left),
    )[0]
  const riskiestClient = Object.values(
    overdueInvoices.reduce<Record<string, { clientId: string; client: string; amount: number; count: number }>>(
      (accumulator, invoice) => {
        const key = invoice.clientId
        const current = accumulator[key] ?? {
          clientId: invoice.clientId,
          client: invoice.client,
          amount: 0,
          count: 0,
        }
        current.amount += getInvoiceOutstandingAmount(invoice)
        current.count += 1
        accumulator[key] = current
        return accumulator
      },
      {},
    ),
  ).sort((left, right) => right.amount - left.amount)[0]
  const supplierEvent = scheduledEvents.find(
    (event) =>
      event.type === "expense" &&
      SUPPLIER_EVENT_PATTERN.test(`${event.label} ${event.description} ${event.id}`),
  )
  const saasSpend = transactions
    .filter((transaction) => transaction.category === "SaaS" && transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const actions: TodayAction[] = [
    ...(largestOverdue
      ? [{
      id: "action-acme",
      title: `Acelerar el cobro de ${largestOverdue.client}`,
      description: `${largestOverdue.id} está vencida y es una de las facturas que más pesa en la caja.`,
      priority: "critical" as const,
      moneyImpact: getInvoiceOutstandingAmount(largestOverdue),
      daysImpact: 10,
      owner: "Cobros",
      target: {
        pathname: "/invoices",
        params: { status: "overdue", highlight: largestOverdue.id },
      },
    }]
      : []),
    ...(riskiestClient
      ? [{
      id: "action-delta",
      title: `Escalar cuenta ${riskiestClient.client} antes de que la caja se tense más`,
      description: "La mayor concentración de deuda vencida está en este cliente.",
      priority: "critical" as const,
      moneyImpact: riskiestClient.amount,
      daysImpact: 12,
      owner: "Dirección",
      target: {
        pathname: "/invoices",
        params: { status: "overdue", client: riskiestClient.clientId, focus: "collections" },
      },
    }]
      : []),
    ...(supplierEvent
      ? [{
      id: "action-supplier",
      title: "Negociar o mover el próximo pago fuerte a proveedor",
      description: "Mover un pago fuerte a proveedor baja el peor pozo de caja antes de que entren los cobros.",
      priority: (metrics.daysUntilZero !== null && metrics.daysUntilZero <= 8 ? "high" : "medium") as "high" | "medium",
      moneyImpact: supplierEvent.amount,
      daysImpact: 7,
      owner: "Finanzas",
      target: {
        pathname: "/cashflow",
        params: { focus: "scenario-supplier" },
      },
    }]
      : []),
    {
      id: "action-saas",
      title: "Revisar herramientas antes del próximo cobro mensual",
      description: "Todavía hay cargos de herramientas y suscripciones duplicadas por validar.",
      priority: "medium" as const,
      moneyImpact: Math.min(saasSpend, 800),
      daysImpact: 4,
      owner: "Operaciones",
      target: {
        pathname: "/movements",
        params: { tab: "pending_review", category: "SaaS", focus: "saas" },
      },
    },
  ]

  return actions.slice(0, 4)
}

export function getWhyReasons(
  invoices: Invoice[],
  transactions: Transaction[],
  metrics: CashflowMetrics,
  scheduledEvents: ScheduledCashEvent[] = scheduledCashEvents,
) {
  const forecastEvents = buildForecastEvents(invoices, scheduledEvents)
  const firstWeekExpenses = forecastEvents
    .filter(
      (event) =>
        event.type === "expense" &&
        differenceInCalendarDays(parseISO(event.date), TODAY) >= 0 &&
        differenceInCalendarDays(parseISO(event.date), TODAY) <= 7,
    )
    .reduce((sum, event) => sum + event.amount, 0)
  const firstWeekIncome = forecastEvents
    .filter(
      (event) =>
        event.type === "income" &&
        differenceInCalendarDays(parseISO(event.date), TODAY) >= 0 &&
        differenceInCalendarDays(parseISO(event.date), TODAY) <= 7,
    )
    .reduce((sum, event) => sum + event.amount, 0)
  const overdueAmount = invoices
    .filter((invoice) => getInvoiceType(invoice) === "receivable" && getInvoiceBucket(invoice) === "overdue")
    .reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0)
  const recurringSaas = transactions
    .filter((transaction) => transaction.category === "SaaS" && transaction.type === "expense")
    .reduce((sum, transaction) => sum + transaction.amount, 0)

  const reasons: WhyReason[] = [
    {
      id: "reason-outflows",
      title: "Salen pagos grandes antes de que entren los cobros",
      metric: `${formatCurrency(firstWeekExpenses)} salen vs ${formatCurrency(firstWeekIncome)} entran esta semana`,
      description:
        "Sueldos, alquiler y un pago fuerte a proveedor caen antes de tus próximos cobros importantes.",
      tone: "danger",
      target: {
        pathname: "/cashflow",
        params: { focus: "timeline" },
      },
    },
    {
      id: "reason-overdue",
      title: "Todavía tenés plata frenada en facturas vencidas",
      metric: `${formatCurrency(overdueAmount)} vencidos`,
      description:
        "El flujo depende de dinero que ya debería estar en la cuenta, pero sigue sin cobrarse.",
      tone: "warning",
      target: {
        pathname: "/invoices",
        params: { status: "overdue", focus: "collections" },
      },
    },
    {
      id: "reason-saas",
      title: "Las herramientas se suman arriba de los costos fijos",
      metric: `${formatCurrency(recurringSaas)} en herramientas`,
      description:
        "No es el problema principal por sí solo, pero agrava la presión de caja cuando los cobros se atrasan.",
      tone: metrics.daysUntilZero !== null && metrics.daysUntilZero <= 8 ? "warning" : "primary",
      target: {
        pathname: "/movements",
        params: { tab: "confirmed", category: "SaaS", focus: "saas" },
      },
    },
  ]

  return reasons
}

export function getClientRecords(clients: Client[], invoices: Invoice[]) {
  return clients.map((client) => {
    const clientInvoices = invoices.filter(
      (invoice) =>
        getInvoiceType(invoice) === "receivable" &&
        (invoice.clientId === client.id || invoice.client === client.name),
    )
    const outstanding = clientInvoices.filter((invoice) => getInvoiceOutstandingAmount(invoice) > 0)
    const overdueInvoices = clientInvoices.filter((invoice) => getInvoiceBucket(invoice) === "overdue")
    const paidInvoices = clientInvoices.filter((invoice) => getInvoiceOutstandingAmount(invoice) <= 0)

    return {
      ...client,
      totalOwed: outstanding.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0),
      invoiceCount: clientInvoices.length,
      overdueCount: overdueInvoices.length,
      overdueAmount: overdueInvoices.reduce((sum, invoice) => sum + getInvoiceOutstandingAmount(invoice), 0),
      paymentRate: Math.round((paidInvoices.length / Math.max(clientInvoices.length, 1)) * 100),
    }
  })
}

export function getMovementCounts(transactions: Transaction[]) {
  return {
    confirmed: transactions.filter((transaction) => transaction.status === "confirmed").length,
    pending_review: transactions.filter(
      (transaction) => transaction.status === "pending_review" || transaction.status === "detected",
    ).length,
    duplicate: transactions.filter((transaction) => transaction.status === "duplicate").length,
    detected: transactions.filter((transaction) => transaction.status === "detected").length,
  }
}

export function getUncategorizedTransactions(transactions: Transaction[]) {
  return transactions.filter(
    (transaction) =>
      !transaction.categoryId &&
      (!transaction.suggestedCategory || transaction.category === "Otros" || transaction.category.trim().length === 0),
  )
}

export function matchesMovementTab(status: MovementStatus, tab: MovementTab) {
  if (tab === "pending_review") {
    return status === "pending_review" || status === "detected"
  }

  return status === tab
}

export function isImportedTransaction(transaction: Pick<Transaction, "source" | "sourceData">) {
  if (transaction.source === "import" || transaction.source === "gmail") return true
  if (!transaction.sourceData || typeof transaction.sourceData !== "object") return false
  return Boolean((transaction.sourceData as Record<string, unknown>).imported)
}

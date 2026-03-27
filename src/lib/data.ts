import { addDays, format, subDays } from "date-fns"

const today = new Date()
const toISODate = (date: Date) => format(date, "yyyy-MM-dd")

export type NavigationTarget = {
  pathname: string
  params?: Record<string, string>
}

export type InvoicePayment = {
  date: string
  amount: number
  note: string
}

export type Invoice = {
  id: string
  client: string
  clientId: string
  amount: number
  issueDate: string
  dueDate: string
  status: "paid" | "pending" | "overdue"
  description: string
  owner: string
  priority: "high" | "medium" | "low"
  paymentHistory: InvoicePayment[]
  expectedPayments: InvoicePayment[]
}

export type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  source: "manual" | "email" | "bank"
  status: "confirmed" | "pending" | "duplicate"
  clientId?: string
  suggestedCategory?: string
  notes?: string
  recurring?: boolean
  relatedInvoiceId?: string
}

export type Insight = {
  id: string
  title: string
  severity: "critical" | "high" | "medium" | "low"
  summary: string
  what: string
  why: string
  action: string
  benefit: string
  moneyImpact: number
  daysImpact: number
  ctaLabel: string
  target: NavigationTarget
}

export type Client = {
  id: string
  name: string
  industry: string
  riskScore: "low" | "medium" | "high"
  avgPaymentDays: number
  paymentTerms: string
}

export type ScheduledCashEvent = {
  id: string
  date: string
  label: string
  amount: number
  type: "income" | "expense"
  description: string
  target?: NavigationTarget
}

export type NotificationItem = {
  id: string
  title: string
  body: string
  severity: "critical" | "high" | "medium"
  target: NavigationTarget
}

export const planningHorizonDays = 24
export const currentDateLabel = format(today, "EEEE, MMMM d, yyyy")
export const baseCashBalance = 72660

export const clients: Client[] = [
  {
    id: "c1",
    name: "Acme Corp",
    industry: "Manufacturing",
    riskScore: "low",
    avgPaymentDays: 28,
    paymentTerms: "Net 30",
  },
  {
    id: "c2",
    name: "Bright Ideas LLC",
    industry: "Creative services",
    riskScore: "medium",
    avgPaymentDays: 45,
    paymentTerms: "Net 30",
  },
  {
    id: "c3",
    name: "Delta Systems",
    industry: "Enterprise IT",
    riskScore: "high",
    avgPaymentDays: 62,
    paymentTerms: "Net 30",
  },
  {
    id: "c4",
    name: "Epsilon Partners",
    industry: "Advisory",
    riskScore: "low",
    avgPaymentDays: 22,
    paymentTerms: "Net 15",
  },
  {
    id: "c5",
    name: "Focal Point Media",
    industry: "Media",
    riskScore: "medium",
    avgPaymentDays: 38,
    paymentTerms: "Net 21",
  },
]

export const invoices: Invoice[] = [
  {
    id: "INV-001",
    client: "Acme Corp",
    clientId: "c1",
    amount: 12500,
    issueDate: toISODate(subDays(today, 25)),
    dueDate: toISODate(subDays(today, 12)),
    status: "overdue",
    description: "Software development services for the operations dashboard rollout.",
    owner: "Collections",
    priority: "high",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 9)),
        amount: 4400,
        note: "Promised partial transfer after follow-up call.",
      },
    ],
  },
  {
    id: "INV-002",
    client: "Bright Ideas LLC",
    clientId: "c2",
    amount: 8200,
    issueDate: toISODate(subDays(today, 16)),
    dueDate: toISODate(addDays(today, 15)),
    status: "pending",
    description: "Brand and UI retainer for the current month.",
    owner: "Revenue Ops",
    priority: "medium",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 15)),
        amount: 8200,
        note: "Expected on standard terms.",
      },
    ],
  },
  {
    id: "INV-003",
    client: "Delta Systems",
    clientId: "c3",
    amount: 5800,
    issueDate: toISODate(subDays(today, 40)),
    dueDate: toISODate(subDays(today, 18)),
    status: "overdue",
    description: "API integration consulting and systems mapping.",
    owner: "Founder",
    priority: "high",
    paymentHistory: [],
    expectedPayments: [],
  },
  {
    id: "INV-004",
    client: "Epsilon Partners",
    clientId: "c4",
    amount: 3400,
    issueDate: toISODate(subDays(today, 6)),
    dueDate: toISODate(addDays(today, 25)),
    status: "pending",
    description: "Monthly advisory subscription and license fee.",
    owner: "Revenue Ops",
    priority: "low",
    paymentHistory: [],
    expectedPayments: [],
  },
  {
    id: "INV-005",
    client: "Focal Point Media",
    clientId: "c5",
    amount: 9800,
    issueDate: toISODate(subDays(today, 22)),
    dueDate: toISODate(addDays(today, 11)),
    status: "pending",
    description: "Content production sprint and campaign execution.",
    owner: "Founder",
    priority: "medium",
    paymentHistory: [
      {
        date: toISODate(subDays(today, 7)),
        amount: 5000,
        note: "Partial payment received for the first project milestone.",
      },
    ],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 11)),
        amount: 9800,
        note: "Client confirmed the remaining transfer in the next batch.",
      },
    ],
  },
  {
    id: "INV-006",
    client: "Acme Corp",
    clientId: "c1",
    amount: 12000,
    issueDate: toISODate(subDays(today, 70)),
    dueDate: toISODate(subDays(today, 40)),
    status: "paid",
    description: "Software development services from the prior quarter.",
    owner: "Revenue Ops",
    priority: "low",
    paymentHistory: [
      {
        date: toISODate(subDays(today, 43)),
        amount: 12000,
        note: "Full payment received.",
      },
    ],
    expectedPayments: [],
  },
  {
    id: "INV-007",
    client: "Delta Systems",
    clientId: "c3",
    amount: 10000,
    issueDate: toISODate(subDays(today, 54)),
    dueDate: toISODate(subDays(today, 26)),
    status: "overdue",
    description: "Platform architecture review and resiliency planning.",
    owner: "Founder",
    priority: "high",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 24)),
        amount: 7300,
        note: "Collections expects a partial settlement after escalation.",
      },
    ],
  },
  {
    id: "INV-008",
    client: "Focal Point Media",
    clientId: "c5",
    amount: 1400,
    issueDate: toISODate(subDays(today, 2)),
    dueDate: toISODate(addDays(today, 20)),
    status: "pending",
    description: "Post-production edits and final delivery support.",
    owner: "Revenue Ops",
    priority: "low",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 20)),
        amount: 1400,
        note: "Expected with the next client payment batch.",
      },
    ],
  },
]

export const transactions: Transaction[] = [
  {
    id: "T001",
    date: toISODate(subDays(today, 1)),
    description: "AWS cloud services",
    amount: -4200,
    type: "expense",
    category: "SaaS",
    source: "bank",
    status: "confirmed",
    recurring: true,
    notes: "Monthly infrastructure bill.",
  },
  {
    id: "T002",
    date: toISODate(subDays(today, 2)),
    description: "Acme Corp partial payment",
    amount: 6000,
    type: "income",
    category: "Invoice payment",
    source: "bank",
    status: "confirmed",
    clientId: "c1",
    relatedInvoiceId: "INV-001",
  },
  {
    id: "T003",
    date: toISODate(subDays(today, 3)),
    description: "Payroll - current month",
    amount: -18500,
    type: "expense",
    category: "Payroll",
    source: "bank",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T004",
    date: toISODate(subDays(today, 4)),
    description: "Office rent",
    amount: -3800,
    type: "expense",
    category: "Rent",
    source: "bank",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T005",
    date: toISODate(subDays(today, 5)),
    description: "Slack subscription",
    amount: -320,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T006",
    date: toISODate(subDays(today, 6)),
    description: "Figma subscription",
    amount: -150,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T007",
    date: toISODate(subDays(today, 6)),
    description: "GitHub Copilot",
    amount: -190,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "pending",
    recurring: true,
    suggestedCategory: "SaaS",
    notes: "Imported from email and waiting for reconciliation.",
  },
  {
    id: "T008",
    date: toISODate(subDays(today, 7)),
    description: "Focal Point Media payment",
    amount: 5000,
    type: "income",
    category: "Invoice payment",
    source: "bank",
    status: "confirmed",
    clientId: "c5",
    relatedInvoiceId: "INV-005",
  },
  {
    id: "T009",
    date: toISODate(subDays(today, 8)),
    description: "Digital marketing campaign",
    amount: -2100,
    type: "expense",
    category: "Marketing",
    source: "bank",
    status: "confirmed",
    notes: "Performance campaign with weak ROI this week.",
  },
  {
    id: "T010",
    date: toISODate(subDays(today, 9)),
    description: "Notion Teams",
    amount: -120,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "pending",
    recurring: true,
    suggestedCategory: "SaaS",
    notes: "Email receipt detected, still not matched with bank feed.",
  },
  {
    id: "T011",
    date: toISODate(subDays(today, 10)),
    description: "Supplier invoice - hardware",
    amount: -8500,
    type: "expense",
    category: "Hardware",
    source: "bank",
    status: "confirmed",
    notes: "Critical supplier payment linked to the April shipment.",
  },
  {
    id: "T012",
    date: toISODate(subDays(today, 11)),
    description: "Consulting fee - external",
    amount: -1500,
    type: "expense",
    category: "Consulting",
    source: "bank",
    status: "confirmed",
  },
  {
    id: "T013",
    date: toISODate(subDays(today, 12)),
    description: "Epsilon Partners payment",
    amount: 3400,
    type: "income",
    category: "Invoice payment",
    source: "bank",
    status: "confirmed",
    clientId: "c4",
    relatedInvoiceId: "INV-004",
  },
  {
    id: "T014",
    date: toISODate(subDays(today, 12)),
    description: "Notion Teams",
    amount: -120,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "duplicate",
    recurring: true,
    suggestedCategory: "SaaS",
    notes: "Likely duplicate of the March subscription receipt.",
  },
  {
    id: "T015",
    date: toISODate(subDays(today, 13)),
    description: "Travel expenses - sales team",
    amount: -950,
    type: "expense",
    category: "Travel",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "T016",
    date: toISODate(subDays(today, 14)),
    description: "Google Workspace",
    amount: -240,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T017",
    date: toISODate(subDays(today, 16)),
    description: "Insurance premium",
    amount: -1800,
    type: "expense",
    category: "Insurance",
    source: "bank",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T018",
    date: toISODate(subDays(today, 18)),
    description: "Freelancer payment",
    amount: -2200,
    type: "expense",
    category: "Contractors",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "T019",
    date: toISODate(subDays(today, 4)),
    description: "Stripe payout fee",
    amount: -640,
    type: "expense",
    category: "Other",
    source: "email",
    status: "pending",
    suggestedCategory: "Bank fees",
    notes: "Detected from payout email with no category assigned yet.",
  },
]

export const scheduledCashEvents: ScheduledCashEvent[] = [
  {
    id: "forecast-contractors",
    date: toISODate(addDays(today, 1)),
    label: "Contractor milestone payout",
    amount: -2200,
    type: "expense",
    description: "Planned payment for the delivery team.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Contractors", focus: "timeline" },
    },
  },
  {
    id: "forecast-sales-travel",
    date: toISODate(addDays(today, 2)),
    label: "Sales travel reimbursement",
    amount: -1500,
    type: "expense",
    description: "Expense reimbursement already approved.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Travel" },
    },
  },
  {
    id: "forecast-software-true-up",
    date: toISODate(addDays(today, 3)),
    label: "Quarterly software true-up",
    amount: -1800,
    type: "expense",
    description: "Annualized software overage billed this week.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "forecast-aws-reserved",
    date: toISODate(addDays(today, 4)),
    label: "AWS reserved instances",
    amount: -4200,
    type: "expense",
    description: "Forecasted infrastructure renewal based on last invoice.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "forecast-payroll",
    date: toISODate(addDays(today, 5)),
    label: "Payroll",
    amount: -18500,
    type: "expense",
    description: "Largest fixed outflow of the cycle.",
    target: {
      pathname: "/cashflow",
      params: { focus: "timeline" },
    },
  },
  {
    id: "forecast-rent",
    date: toISODate(addDays(today, 6)),
    label: "Office rent",
    amount: -3800,
    type: "expense",
    description: "Recurring operating expense due before major collections.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Rent" },
    },
  },
  {
    id: "forecast-supplier-catchup",
    date: toISODate(addDays(today, 8)),
    label: "Hardware supplier catch-up",
    amount: -12500,
    type: "expense",
    description: "Supplier expects payment before the next shipment release.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Hardware", focus: "supplier" },
    },
  },
  {
    id: "forecast-marketing-renewal",
    date: toISODate(addDays(today, 13)),
    label: "Marketing renewal",
    amount: -2100,
    type: "expense",
    description: "Next performance campaign invoice.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Marketing" },
    },
  },
  {
    id: "forecast-aws-spike",
    date: toISODate(addDays(today, 15)),
    label: "AWS usage spike",
    amount: -4200,
    type: "expense",
    description: "Projected extra infrastructure cost from the current load.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "forecast-contractor-topup",
    date: toISODate(addDays(today, 17)),
    label: "Contractor top-up",
    amount: -1500,
    type: "expense",
    description: "Second payment for the sprint team.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Contractors" },
    },
  },
  {
    id: "forecast-insurance-topup",
    date: toISODate(addDays(today, 18)),
    label: "Insurance top-up",
    amount: -1800,
    type: "expense",
    description: "Coverage adjustment triggered by the policy renewal.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Insurance" },
    },
  },
  {
    id: "forecast-tax-advance",
    date: toISODate(addDays(today, 20)),
    label: "Tax advance",
    amount: -12800,
    type: "expense",
    description: "Projected tax advance due before the next large collection.",
    target: {
      pathname: "/cashflow",
      params: { focus: "timeline" },
    },
  },
]

export const insights: Insight[] = [
  {
    id: "i1",
    title: "Cash buffer turns negative before your next major collection",
    severity: "critical",
    summary: "Your forecast crosses below zero in the next 8 days unless collections move earlier or one supplier payment shifts.",
    what: "Payroll, rent, and a supplier catch-up payment hit before your largest invoice receipts land.",
    why: "This is the moment where cash timing matters more than margin. The business is not unprofitable, but the order of inflows and outflows is risky.",
    action: "Open the cashflow view and compare the collection and supplier-delay scenarios.",
    benefit: "You can avoid the shortfall and recover more than 20 days of runway with a focused collections push.",
    moneyImpact: -1700,
    daysImpact: -8,
    ctaLabel: "Open cashflow risk",
    target: {
      pathname: "/cashflow",
      params: { focus: "zero-day" },
    },
  },
  {
    id: "i2",
    title: "Three overdue invoices are holding back $28,300",
    severity: "critical",
    summary: "Overdue receivables are now the main reason the forecast compresses.",
    what: "Acme Corp and Delta Systems account for all of your overdue exposure.",
    why: "Those invoices are large enough to fund payroll and keep the forecast above zero on their own.",
    action: "Prioritize reminders and escalation for the overdue invoices list.",
    benefit: "Recovering the overdue balance would materially extend runway and reduce collection risk concentration.",
    moneyImpact: 28300,
    daysImpact: 22,
    ctaLabel: "Review overdue invoices",
    target: {
      pathname: "/invoices",
      params: { status: "overdue", focus: "collections" },
    },
  },
  {
    id: "i3",
    title: "SaaS spend is too high for the current runway",
    severity: "high",
    summary: "Recurring tools are eating into runway while some auto-detected charges still need review.",
    what: "The account is carrying AWS, Slack, Figma, Google Workspace, Notion, and Copilot costs in the same cycle.",
    why: "Small recurring expenses compound when collections slip and fixed costs are already elevated.",
    action: "Audit SaaS transactions and confirm whether pending tool charges should stay active.",
    benefit: "Trimming redundant tools can create a fast buffer without touching headcount or delivery.",
    moneyImpact: 800,
    daysImpact: 4,
    ctaLabel: "Audit SaaS spend",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "i4",
    title: "Delta Systems remains the highest collection risk",
    severity: "high",
    summary: "Delta is still late and has $15,800 open across two invoices.",
    what: "This client averages 62 payment days and is now the least reliable payer in the book.",
    why: "A large share of your overdue exposure depends on a client with a weak payment pattern.",
    action: "Review the client profile and prepare tighter terms for the next engagement.",
    benefit: "Reducing Delta concentration lowers both cash timing risk and collection volatility.",
    moneyImpact: 15800,
    daysImpact: 12,
    ctaLabel: "Open client risk",
    target: {
      pathname: "/clients",
      params: { highlight: "c3" },
    },
  },
  {
    id: "i5",
    title: "Payroll lands before enough invoice cash clears",
    severity: "high",
    summary: "The next payroll run consumes most of the available buffer on its own.",
    what: "Payroll is your biggest fixed outflow and lands ahead of the largest expected receivables.",
    why: "Even a profitable month can feel constrained when payroll and supplier obligations cluster too early.",
    action: "Review the cashflow timeline and decide whether to delay a non-critical supplier payment.",
    benefit: "Spacing those outflows gives collections time to catch up and reduces short-term strain.",
    moneyImpact: -6200,
    daysImpact: -5,
    ctaLabel: "Inspect payroll impact",
    target: {
      pathname: "/cashflow",
      params: { focus: "timeline" },
    },
  },
  {
    id: "i6",
    title: "Possible duplicate charge still unresolved",
    severity: "medium",
    summary: "A duplicate Notion Teams charge is still sitting in the queue.",
    what: "One subscription receipt appears twice and is currently marked as a likely duplicate.",
    why: "Leaving duplicates unresolved inflates operating expenses and weakens expense visibility.",
    action: "Open duplicates and confirm whether to keep or dismiss the charge.",
    benefit: "Resolving the duplicate cleans the dataset and may recover a small but immediate amount.",
    moneyImpact: 120,
    daysImpact: 0,
    ctaLabel: "Review duplicates",
    target: {
      pathname: "/movements",
      params: { tab: "duplicate", highlight: "T014" },
    },
  },
  {
    id: "i7",
    title: "Marketing spend increased without a matching cash buffer",
    severity: "medium",
    summary: "Marketing is not the biggest line item, but it is rising at the wrong point in the cycle.",
    what: "Campaign spend is above the previous run rate while collections are still late.",
    why: "Variable growth spend is harder to justify when near-term liquidity is already tight.",
    action: "Filter movements to marketing and review which campaigns can wait.",
    benefit: "Pausing lower-yield spend protects cash while keeping core delivery intact.",
    moneyImpact: -600,
    daysImpact: -1,
    ctaLabel: "Review marketing spend",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Marketing" },
    },
  },
  {
    id: "i8",
    title: "Focal Point Media is moving in the right direction",
    severity: "low",
    summary: "A recent partial payment reduced risk and the remaining collection is already expected.",
    what: "The client already paid one milestone and has another payment expected within the horizon.",
    why: "This is a good signal because it offsets part of the near-term strain.",
    action: "Track the invoice detail and keep the promise date visible to the team.",
    benefit: "Reliable follow-through from this client helps stabilize the next two weeks of forecast.",
    moneyImpact: 5000,
    daysImpact: 2,
    ctaLabel: "Open invoice detail",
    target: {
      pathname: "/invoices",
      params: { highlight: "INV-005" },
    },
  },
]

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Critical cashflow alert",
    body: "Forecast goes below zero before the next major collection.",
    severity: "critical",
    target: { pathname: "/cashflow", params: { focus: "zero-day" } },
  },
  {
    id: "n2",
    title: "Overdue collections need action",
    body: "Three overdue invoices now represent $28,300 of delayed cash.",
    severity: "high",
    target: { pathname: "/invoices", params: { status: "overdue", focus: "collections" } },
  },
  {
    id: "n3",
    title: "Duplicate charge detected",
    body: "One Notion Teams charge still needs review.",
    severity: "medium",
    target: { pathname: "/movements", params: { tab: "duplicate", highlight: "T014" } },
  },
]

import { addDays, format, subDays } from "date-fns"
import { es } from "date-fns/locale"

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
  totalAmount?: number
  paidAmount?: number
  type?: "receivable" | "payable"
  issueDate: string
  dueDate: string
  status: "paid" | "pending" | "overdue"
  description: string
  owner: string
  priority: "high" | "medium" | "low"
  notes?: string
  sourceData?: unknown | null
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
  categoryId?: string | null
  source: "manual" | "email" | "bank" | "invoice" | "import" | "telegram" | "gmail"
  status: "confirmed" | "pending_review" | "duplicate" | "detected"
  clientId?: string
  suggestedCategory?: string
  notes?: string
  recurring?: boolean
  invoiceId?: string
  sourceData?: unknown | null
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
export const currentDateLabel = format(today, "EEEE d 'de' MMMM, yyyy", { locale: es })
export const baseCashBalance = 72660

export const clients: Client[] = [
  {
    id: "c1",
    name: "Acme Corp",
    industry: "Industria",
    riskScore: "low",
    avgPaymentDays: 28,
    paymentTerms: "30 días",
  },
  {
    id: "c2",
    name: "Bright Ideas LLC",
    industry: "Servicios creativos",
    riskScore: "medium",
    avgPaymentDays: 45,
    paymentTerms: "30 días",
  },
  {
    id: "c3",
    name: "Delta Systems",
    industry: "Tecnología empresarial",
    riskScore: "high",
    avgPaymentDays: 62,
    paymentTerms: "30 días",
  },
  {
    id: "c4",
    name: "Epsilon Partners",
    industry: "Consultoría",
    riskScore: "low",
    avgPaymentDays: 22,
    paymentTerms: "15 días",
  },
  {
    id: "c5",
    name: "Focal Point Media",
    industry: "Medios",
    riskScore: "medium",
    avgPaymentDays: 38,
    paymentTerms: "21 días",
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
    description: "Servicios de desarrollo para el tablero operativo del cliente.",
    owner: "Cobros",
    priority: "high",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 9)),
        amount: 4400,
        note: "Prometieron una transferencia parcial después del llamado.",
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
    description: "Abono mensual de marca y experiencia de producto.",
    owner: "Ingresos",
    priority: "medium",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 15)),
        amount: 8200,
        note: "Se espera en la fecha acordada.",
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
    description: "Consultoría de integración API y mapeo de sistemas.",
    owner: "Dirección",
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
    description: "Abono mensual de consultoría y licencia.",
    owner: "Ingresos",
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
    description: "Sprint de producción de contenido y ejecución de campaña.",
    owner: "Dirección",
    priority: "medium",
    paymentHistory: [
      {
        date: toISODate(subDays(today, 7)),
        amount: 5000,
        note: "Entró un pago parcial por el primer hito del proyecto.",
      },
    ],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 11)),
        amount: 9800,
        note: "El cliente confirmó la transferencia restante en el próximo lote.",
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
    description: "Servicios de desarrollo del trimestre anterior.",
    owner: "Ingresos",
    priority: "low",
    paymentHistory: [
      {
        date: toISODate(subDays(today, 43)),
        amount: 12000,
        note: "Pago completo recibido.",
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
    description: "Revisión de arquitectura de plataforma y plan de resiliencia.",
    owner: "Dirección",
    priority: "high",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 24)),
        amount: 7300,
        note: "Cobros espera un pago parcial después de escalar el caso.",
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
    description: "Ediciones de postproducción y soporte para la entrega final.",
    owner: "Ingresos",
    priority: "low",
    paymentHistory: [],
    expectedPayments: [
      {
        date: toISODate(addDays(today, 20)),
        amount: 1400,
        note: "Se espera junto con el próximo pago del cliente.",
      },
    ],
  },
]

export const transactions: Transaction[] = [
  {
    id: "T001",
    date: toISODate(subDays(today, 1)),
    description: "Servicios cloud de AWS",
    amount: 4200,
    type: "expense",
    category: "SaaS",
    source: "bank",
    status: "confirmed",
    recurring: true,
    notes: "Factura mensual de infraestructura.",
  },
  {
    id: "T002",
    date: toISODate(subDays(today, 2)),
    description: "Cobro parcial de Acme Corp",
    amount: 6000,
    type: "income",
    category: "Cobro de factura",
    source: "bank",
    status: "confirmed",
    clientId: "c1",
    invoiceId: "INV-001",
  },
  {
    id: "T003",
    date: toISODate(subDays(today, 3)),
    description: "Sueldos del mes",
    amount: 18500,
    type: "expense",
    category: "Sueldos",
    source: "bank",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T004",
    date: toISODate(subDays(today, 4)),
    description: "Alquiler de oficina",
    amount: 3800,
    type: "expense",
    category: "Alquiler",
    source: "bank",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T005",
    date: toISODate(subDays(today, 5)),
    description: "Suscripción de Slack",
    amount: 320,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T006",
    date: toISODate(subDays(today, 6)),
    description: "Suscripción de Figma",
    amount: 150,
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
    amount: 190,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "detected",
    recurring: true,
    suggestedCategory: "SaaS",
    notes: "Importado desde email y pendiente de limpieza operativa.",
    sourceData: { provider: "gmail", channel: "receipt", imported: true },
  },
  {
    id: "T008",
    date: toISODate(subDays(today, 7)),
    description: "Cobro de Focal Point Media",
    amount: 5000,
    type: "income",
    category: "Cobro de factura",
    source: "bank",
    status: "confirmed",
    clientId: "c5",
    invoiceId: "INV-005",
  },
  {
    id: "T009",
    date: toISODate(subDays(today, 8)),
    description: "Campaña de marketing digital",
    amount: 2100,
    type: "expense",
    category: "Marketing",
    source: "bank",
    status: "confirmed",
    notes: "Campaña de performance con retorno flojo esta semana.",
  },
  {
    id: "T010",
    date: toISODate(subDays(today, 9)),
    description: "Notion Teams",
    amount: 120,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "pending_review",
    recurring: true,
    suggestedCategory: "SaaS",
    notes: "Recibo detectado por email, pendiente de revisión.",
    sourceData: { provider: "gmail", channel: "receipt", imported: true },
  },
  {
    id: "T011",
    date: toISODate(subDays(today, 10)),
    description: "Factura de proveedor de hardware",
    amount: 8500,
    type: "expense",
    category: "Insumos",
    source: "bank",
    status: "confirmed",
    notes: "Pago crítico a proveedor ligado al envío de abril.",
  },
  {
    id: "T012",
    date: toISODate(subDays(today, 11)),
    description: "Honorarios externos",
    amount: 1500,
    type: "expense",
    category: "Honorarios",
    source: "bank",
    status: "confirmed",
  },
  {
    id: "T013",
    date: toISODate(subDays(today, 12)),
    description: "Cobro de Epsilon Partners",
    amount: 3400,
    type: "income",
    category: "Cobro de factura",
    source: "bank",
    status: "confirmed",
    clientId: "c4",
    invoiceId: "INV-004",
  },
  {
    id: "T014",
    date: toISODate(subDays(today, 12)),
    description: "Notion Teams",
    amount: 120,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "duplicate",
    recurring: true,
    suggestedCategory: "SaaS",
    notes: "Parece duplicado del comprobante de suscripción de marzo.",
  },
  {
    id: "T015",
    date: toISODate(subDays(today, 13)),
    description: "Viajes del equipo comercial",
    amount: 950,
    type: "expense",
    category: "Viajes",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "T016",
    date: toISODate(subDays(today, 14)),
    description: "Google Workspace",
    amount: 240,
    type: "expense",
    category: "SaaS",
    source: "email",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T017",
    date: toISODate(subDays(today, 16)),
    description: "Prima de seguro",
    amount: 1800,
    type: "expense",
    category: "Seguros",
    source: "bank",
    status: "confirmed",
    recurring: true,
  },
  {
    id: "T018",
    date: toISODate(subDays(today, 18)),
    description: "Pago a freelancer",
    amount: 2200,
    type: "expense",
    category: "Contratistas",
    source: "manual",
    status: "confirmed",
  },
  {
    id: "T019",
    date: toISODate(subDays(today, 4)),
    description: "Comisión de liquidación de Stripe",
    amount: 640,
    type: "expense",
    category: "Otros",
    source: "email",
    status: "detected",
    suggestedCategory: "Comisiones bancarias",
    notes: "Detectado desde email de payout y sin categoría definida.",
    sourceData: { provider: "stripe", channel: "payout_email", imported: true },
  },
]

export const scheduledCashEvents: ScheduledCashEvent[] = [
  {
    id: "forecast-contractors",
    date: toISODate(addDays(today, 1)),
    label: "Pago de hito a contratistas",
    amount: 2200,
    type: "expense",
    description: "Pago previsto para el equipo de entrega.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Contratistas", focus: "timeline" },
    },
  },
  {
    id: "forecast-sales-travel",
    date: toISODate(addDays(today, 2)),
    label: "Reintegro de viaje comercial",
    amount: 1500,
    type: "expense",
    description: "Reintegro ya aprobado.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Viajes" },
    },
  },
  {
    id: "forecast-software-true-up",
    date: toISODate(addDays(today, 3)),
    label: "Ajuste trimestral de software",
    amount: 1800,
    type: "expense",
    description: "Ajuste de herramientas facturado esta semana.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "forecast-aws-reserved",
    date: toISODate(addDays(today, 4)),
    label: "Renovación reservada de AWS",
    amount: 4200,
    type: "expense",
    description: "Renovación estimada de infraestructura según la última factura.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "forecast-payroll",
    date: toISODate(addDays(today, 5)),
    label: "Sueldos",
    amount: 18500,
    type: "expense",
    description: "El egreso fijo más grande del ciclo.",
    target: {
      pathname: "/cashflow",
      params: { focus: "timeline" },
    },
  },
  {
    id: "forecast-rent",
    date: toISODate(addDays(today, 6)),
    label: "Alquiler de oficina",
    amount: 3800,
    type: "expense",
    description: "Gasto operativo recurrente que vence antes de los cobros grandes.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Alquiler" },
    },
  },
  {
    id: "forecast-supplier-catchup",
    date: toISODate(addDays(today, 8)),
    label: "Pago pendiente a proveedor de hardware",
    amount: 12500,
    type: "expense",
    description: "El proveedor espera cobrar antes de liberar el próximo envío.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Insumos", focus: "supplier" },
    },
  },
  {
    id: "forecast-marketing-renewal",
    date: toISODate(addDays(today, 13)),
    label: "Renovación de marketing",
    amount: 2100,
    type: "expense",
    description: "Próxima factura de campaña de performance.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Marketing" },
    },
  },
  {
    id: "forecast-aws-spike",
    date: toISODate(addDays(today, 15)),
    label: "Suba de consumo de AWS",
    amount: 4200,
    type: "expense",
    description: "Costo extra estimado de infraestructura por la carga actual.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "forecast-contractor-topup",
    date: toISODate(addDays(today, 17)),
    label: "Refuerzo a contratistas",
    amount: 1500,
    type: "expense",
    description: "Segundo pago para el equipo del sprint.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Contratistas" },
    },
  },
  {
    id: "forecast-insurance-topup",
    date: toISODate(addDays(today, 18)),
    label: "Ajuste de seguro",
    amount: 1800,
    type: "expense",
    description: "Ajuste de cobertura disparado por la renovación de la póliza.",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Seguros" },
    },
  },
  {
    id: "forecast-tax-advance",
    date: toISODate(addDays(today, 20)),
    label: "Anticipo de impuestos",
    amount: 12800,
    type: "expense",
    description: "Anticipo impositivo estimado antes del próximo cobro grande.",
    target: {
      pathname: "/cashflow",
      params: { focus: "timeline" },
    },
  },
]

export const insights: Insight[] = [
  {
    id: "i1",
    title: "La caja se pone en rojo antes del próximo cobro fuerte",
    severity: "critical",
    summary: "El flujo baja de cero en los próximos 8 días si no se adelantan cobros o se mueve un pago importante.",
    what: "Sueldos, alquiler y un pago fuerte a proveedor caen antes de que entren las facturas más grandes.",
    why: "Acá importa más el momento de entrada y salida del dinero que el margen. El negocio no necesariamente pierde plata, pero el orden de los movimientos te aprieta.",
    action: "Abrí flujo de caja y compará los escenarios de cobrar antes o mover el pago fuerte.",
    benefit: "Podés evitar el bache y recuperar más de 20 días de aire si empujás bien las cobranzas.",
    moneyImpact: -1700,
    daysImpact: -8,
    ctaLabel: "Ver riesgo de caja",
    target: {
      pathname: "/cashflow",
      params: { focus: "zero-day" },
    },
  },
  {
    id: "i2",
    title: "Tres facturas vencidas están frenando $28.300",
    severity: "critical",
    summary: "Lo vencido ya es la razón principal por la que se comprime la caja proyectada.",
    what: "Acme Corp y Delta Systems explican toda la deuda vencida.",
    why: "Esas facturas alcanzan para pagar sueldos y sostener la caja por sí solas.",
    action: "Priorizá recordatorios y escalamiento en la lista de vencidas.",
    benefit: "Cobrar ese saldo te da más aire y baja la dependencia de pocos clientes.",
    moneyImpact: 28300,
    daysImpact: 22,
    ctaLabel: "Revisar vencidas",
    target: {
      pathname: "/invoices",
      params: { status: "overdue", focus: "collections" },
    },
  },
  {
    id: "i3",
    title: "El gasto en herramientas está alto para la caja actual",
    severity: "high",
    summary: "Las herramientas recurrentes consumen caja mientras todavía hay cargos detectados por revisar.",
    what: "En este ciclo conviven AWS, Slack, Figma, Google Workspace, Notion y Copilot.",
    why: "Los gastos chicos y repetidos se acumulan rápido cuando los cobros vienen tarde y los costos fijos ya son altos.",
    action: "Revisá movimientos de herramientas y confirmá si esos cargos realmente tienen que seguir activos.",
    benefit: "Recortar herramientas repetidas genera un colchón rápido sin tocar equipo ni entrega.",
    moneyImpact: 800,
    daysImpact: 4,
    ctaLabel: "Revisar herramientas",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "SaaS", focus: "saas" },
    },
  },
  {
    id: "i4",
    title: "Delta Systems sigue siendo el cliente más riesgoso para cobrar",
    severity: "high",
    summary: "Delta sigue atrasado y tiene $15.800 abiertos en dos facturas.",
    what: "Este cliente paga en promedio a 62 días y hoy es el menos confiable de la cartera.",
    why: "Una parte grande de la deuda vencida depende de un cliente con mal patrón de pago.",
    action: "Revisá la ficha del cliente y prepará condiciones más firmes para el próximo trabajo.",
    benefit: "Bajar la concentración en Delta reduce riesgo de timing y de volatilidad al cobrar.",
    moneyImpact: 15800,
    daysImpact: 12,
    ctaLabel: "Ver riesgo del cliente",
    target: {
      pathname: "/clients",
      params: { highlight: "c3" },
    },
  },
  {
    id: "i5",
    title: "Los sueldos llegan antes de que entren suficientes cobros",
    severity: "high",
    summary: "La próxima nómina consume sola gran parte del colchón disponible.",
    what: "Sueldos es tu egreso fijo más grande y cae antes de los cobros esperados más importantes.",
    why: "Incluso un mes rentable puede sentirse apretado si sueldos y proveedores caen demasiado pronto.",
    action: "Revisá la línea de tiempo y decidí si conviene mover un pago no crítico a proveedor.",
    benefit: "Separar esos egresos da tiempo a que entren cobros y baja la presión de corto plazo.",
    moneyImpact: -6200,
    daysImpact: -5,
    ctaLabel: "Ver impacto de sueldos",
    target: {
      pathname: "/cashflow",
      params: { focus: "timeline" },
    },
  },
  {
    id: "i6",
    title: "Todavía hay un cargo duplicado sin resolver",
    severity: "medium",
    summary: "Un cargo de Notion Teams duplicado sigue pendiente en la cola.",
    what: "Un comprobante de suscripción aparece dos veces y está marcado como posible duplicado.",
    why: "Dejar duplicados sin resolver infla los gastos y ensucia la lectura real del negocio.",
    action: "Abrí duplicados y confirmá si ese cargo se conserva o se descarta.",
    benefit: "Resolverlo limpia la base y puede recuperar un monto chico pero inmediato.",
    moneyImpact: 120,
    daysImpact: 0,
    ctaLabel: "Revisar duplicados",
    target: {
      pathname: "/movements",
      params: { tab: "duplicate", highlight: "T014" },
    },
  },
  {
    id: "i7",
    title: "El gasto en marketing subió sin respaldo de caja",
    severity: "medium",
    summary: "Marketing no es el mayor rubro, pero está subiendo en un momento incómodo del ciclo.",
    what: "El gasto de campañas está arriba del ritmo anterior mientras los cobros siguen demorados.",
    why: "Cuesta más justificar gasto variable de crecimiento cuando la liquidez de corto plazo ya está ajustada.",
    action: "Filtrá marketing y revisá qué campañas pueden esperar.",
    benefit: "Pausar gasto de menor rendimiento protege caja sin tocar la operación central.",
    moneyImpact: -600,
    daysImpact: -1,
    ctaLabel: "Revisar marketing",
    target: {
      pathname: "/movements",
      params: { tab: "confirmed", category: "Marketing" },
    },
  },
  {
    id: "i8",
    title: "Focal Point Media viene mejorando",
    severity: "low",
    summary: "Un pago parcial reciente bajó el riesgo y ya hay otro cobro esperado.",
    what: "El cliente ya pagó un hito y hay otro pago previsto dentro del horizonte.",
    why: "Es una buena señal porque compensa parte de la presión de corto plazo.",
    action: "Seguí el detalle de la factura y mantené visible la fecha prometida.",
    benefit: "Si este cliente sigue cumpliendo, ayuda a estabilizar las próximas dos semanas.",
    moneyImpact: 5000,
    daysImpact: 2,
    ctaLabel: "Ver detalle de factura",
    target: {
      pathname: "/invoices",
      params: { highlight: "INV-005" },
    },
  },
]

export const notifications: NotificationItem[] = [
  {
    id: "n1",
    title: "Alerta crítica de caja",
    body: "El flujo cae por debajo de cero antes del próximo cobro importante.",
    severity: "critical",
    target: { pathname: "/cashflow", params: { focus: "zero-day" } },
  },
  {
    id: "n2",
    title: "Las facturas vencidas necesitan acción",
    body: "Tres facturas vencidas ya representan $28.300 demorados.",
    severity: "high",
    target: { pathname: "/invoices", params: { status: "overdue", focus: "collections" } },
  },
  {
    id: "n3",
    title: "Cargo duplicado detectado",
    body: "Un cargo de Notion Teams todavía necesita revisión.",
    severity: "medium",
    target: { pathname: "/movements", params: { tab: "duplicate", highlight: "T014" } },
  },
]

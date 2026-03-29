import { BadRequestException, ConflictException, DatabaseException } from "@/exceptions/base/base-exceptions"
import type { Invoice, Transaction } from "@/lib/data"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { Json } from "@/lib/supabase/database.types"
import { IntakeRepository } from "@/repositories/intake/intake.repository"
import type { ClaudePromptQueryDto } from "@/types/intake/dto/claude-prompt-query.dto"
import type { ImportConfirmDto } from "@/types/intake/dto/import-confirm.dto"
import type { ImportEntity, ImportPreviewDto } from "@/types/intake/dto/import-preview.dto"

type CsvImportError = {
  row: number
  field?: string
  message: string
}

type TransactionPreviewItem = {
  date: string
  description: string
  amount: number
  type: "income" | "expense"
  category: string
  source: Transaction["source"]
  notes?: string
  counterparty?: string
}

type InvoicePreviewItem = {
  clientId: string
  amount: number
  type: "receivable" | "payable"
  issueDate: string
  dueDate: string
  description: string
  owner: string
  priority: "high" | "medium" | "low"
  notes?: string
}

type PreviewContent = {
  entityType: ImportEntity
  filename: string
  columns: string[]
  requiredColumns: string[]
  totalRows: number
  validRows: number
  invalidRows: number
  errors: CsvImportError[]
  items: Array<TransactionPreviewItem | InvoicePreviewItem>
}

const transactionRequiredColumns = ["date", "description", "amount", "type"]
const invoiceRequiredColumns = ["counterparty", "amount", "issue_date", "due_date", "description"]

const transactionHeaderAliases: Record<string, string> = {
  date: "date",
  fecha: "date",
  description: "description",
  descripcion: "description",
  detail: "description",
  details: "description",
  amount: "amount",
  monto: "amount",
  importe: "amount",
  type: "type",
  tipo: "type",
  category: "category",
  categoria: "category",
  source: "source",
  origen: "source",
  notes: "notes",
  note: "notes",
  notas: "notes",
  counterparty: "counterparty",
  client: "counterparty",
  cliente: "counterparty",
}

const invoiceHeaderAliases: Record<string, string> = {
  counterparty: "counterparty",
  client: "counterparty",
  cliente: "counterparty",
  amount: "amount",
  monto: "amount",
  importe: "amount",
  issue_date: "issue_date",
  issuedate: "issue_date",
  fecha_emision: "issue_date",
  due_date: "due_date",
  duedate: "due_date",
  fecha_vencimiento: "due_date",
  description: "description",
  descripcion: "description",
  detail: "description",
  type: "type",
  tipo: "type",
  owner: "owner",
  responsible: "owner",
  responsable: "owner",
  priority: "priority",
  prioridad: "priority",
  notes: "notes",
  notas: "notes",
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_")
}

function parseCsv(content: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ""
  let inQuotes = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const nextChar = content[index + 1]

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        currentValue += "\""
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue)
      currentValue = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") index += 1
      currentRow.push(currentValue)
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentValue = ""
      continue
    }

    currentValue += char
  }

  currentRow.push(currentValue)
  if (currentRow.some((cell) => cell.trim().length > 0)) {
    rows.push(currentRow)
  }

  if (inQuotes) {
    throw new BadRequestException("CSV has unterminated quotes", "El CSV tiene comillas sin cerrar.")
  }

  return rows
}

function parseAmount(raw: string, row: number, field: string, errors: CsvImportError[]) {
  const sanitized = raw.trim().replace(/\./g, "").replace(",", ".")
  const amount = Number(sanitized)

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push({ row, field, message: "El monto debe ser un número mayor a 0." })
    return null
  }

  return amount
}

function parseIsoDate(raw: string, row: number, field: string, errors: CsvImportError[]) {
  const value = raw.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push({ row, field, message: "La fecha debe tener formato YYYY-MM-DD." })
    return null
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    errors.push({ row, field, message: "La fecha no es válida." })
    return null
  }

  return value
}

function mapHeaders(headers: string[], aliases: Record<string, string>) {
  return headers.map((header) => aliases[normalizeHeader(header)] ?? normalizeHeader(header))
}

function buildTransactionPreview(rows: string[][], filename: string): PreviewContent {
  const originalHeaders = rows[0] ?? []
  const columns = mapHeaders(originalHeaders, transactionHeaderAliases)
  const missingColumns = transactionRequiredColumns.filter((column) => !columns.includes(column))

  if (missingColumns.length > 0) {
    throw new BadRequestException(
      `Missing required transaction columns: ${missingColumns.join(", ")}`,
      `Faltan columnas requeridas: ${missingColumns.join(", ")}.`,
    )
  }

  const items: TransactionPreviewItem[] = []
  const errors: CsvImportError[] = []

  for (let index = 1; index < rows.length; index += 1) {
    const rawRow = rows[index] ?? []
    const rowNumber = index + 1
    const record = Object.fromEntries(columns.map((column, cellIndex) => [column, rawRow[cellIndex]?.trim() ?? ""]))

    const rowErrors: CsvImportError[] = []
    const date = parseIsoDate(record.date, rowNumber, "date", rowErrors)
    const description = record.description?.trim()
    const amount = parseAmount(record.amount, rowNumber, "amount", rowErrors)
    const type = record.type?.trim().toLowerCase()
    const category = record.category?.trim() || "Other"
    const source = normalizeHeader(record.source || "import")
    const notes = record.notes?.trim()
    const counterparty = record.counterparty?.trim()

    if (!description) rowErrors.push({ row: rowNumber, field: "description", message: "La descripción es obligatoria." })
    if (type !== "income" && type !== "expense") {
      rowErrors.push({ row: rowNumber, field: "type", message: "El tipo debe ser income o expense." })
    }
    if (!["manual", "email", "bank", "invoice", "import", "telegram", "gmail"].includes(source)) {
      rowErrors.push({
        row: rowNumber,
        field: "source",
        message: "El origen debe ser manual, email, bank, invoice, import, telegram o gmail.",
      })
    }

    if (rowErrors.length > 0 || !date || !description || amount === null || (type !== "income" && type !== "expense")) {
      errors.push(...rowErrors)
      continue
    }

    items.push({
      date,
      description,
      amount,
      type,
      category,
      source: source as Transaction["source"],
      notes: notes || undefined,
      counterparty: counterparty || undefined,
    })
  }

  return {
    entityType: "transactions",
    filename,
    columns,
    requiredColumns: transactionRequiredColumns,
    totalRows: Math.max(rows.length - 1, 0),
    validRows: items.length,
    invalidRows: errors.reduce((set, error) => set.add(error.row), new Set<number>()).size,
    errors,
    items,
  }
}

function buildInvoicePreview(rows: string[][], filename: string): PreviewContent {
  const originalHeaders = rows[0] ?? []
  const columns = mapHeaders(originalHeaders, invoiceHeaderAliases)
  const missingColumns = invoiceRequiredColumns.filter((column) => !columns.includes(column))

  if (missingColumns.length > 0) {
    throw new BadRequestException(
      `Missing required invoice columns: ${missingColumns.join(", ")}`,
      `Faltan columnas requeridas: ${missingColumns.join(", ")}.`,
    )
  }

  const items: InvoicePreviewItem[] = []
  const errors: CsvImportError[] = []

  for (let index = 1; index < rows.length; index += 1) {
    const rawRow = rows[index] ?? []
    const rowNumber = index + 1
    const record = Object.fromEntries(columns.map((column, cellIndex) => [column, rawRow[cellIndex]?.trim() ?? ""]))

    const rowErrors: CsvImportError[] = []
    const clientId = record.counterparty?.trim()
    const amount = parseAmount(record.amount, rowNumber, "amount", rowErrors)
    const issueDate = parseIsoDate(record.issue_date, rowNumber, "issue_date", rowErrors)
    const dueDate = parseIsoDate(record.due_date, rowNumber, "due_date", rowErrors)
    const description = record.description?.trim()
    const type = normalizeHeader(record.type || "receivable")
    const owner = record.owner?.trim() || "Revenue Ops"
    const priority = normalizeHeader(record.priority || "medium")
    const notes = record.notes?.trim()

    if (!clientId) rowErrors.push({ row: rowNumber, field: "counterparty", message: "La contraparte es obligatoria." })
    if (!description) rowErrors.push({ row: rowNumber, field: "description", message: "La descripción es obligatoria." })
    if (type !== "receivable" && type !== "payable") {
      rowErrors.push({ row: rowNumber, field: "type", message: "El tipo debe ser receivable o payable." })
    }
    if (priority !== "high" && priority !== "medium" && priority !== "low") {
      rowErrors.push({ row: rowNumber, field: "priority", message: "La prioridad debe ser high, medium o low." })
    }

    if (
      rowErrors.length > 0 ||
      !clientId ||
      amount === null ||
      !issueDate ||
      !dueDate ||
      !description ||
      (type !== "receivable" && type !== "payable") ||
      (priority !== "high" && priority !== "medium" && priority !== "low")
    ) {
      errors.push(...rowErrors)
      continue
    }

    items.push({
      clientId,
      amount,
      type,
      issueDate,
      dueDate,
      description,
      owner,
      priority,
      notes: notes || undefined,
    })
  }

  return {
    entityType: "invoices",
    filename,
    columns,
    requiredColumns: invoiceRequiredColumns,
    totalRows: Math.max(rows.length - 1, 0),
    validRows: items.length,
    invalidRows: errors.reduce((set, error) => set.add(error.row), new Set<number>()).size,
    errors,
    items,
  }
}

function parsePreview(dto: ImportPreviewDto): PreviewContent {
  const lowerFilename = dto.filename.toLowerCase()

  if (!lowerFilename.endsWith(".csv")) {
    throw new BadRequestException("Only CSV files are supported", "Solo se permiten archivos CSV.")
  }

  const rows = parseCsv(dto.csvContent.replace(/^\uFEFF/, ""))
  if (rows.length < 2) {
    throw new BadRequestException("CSV must include header and at least one row", "El CSV debe tener encabezado y al menos una fila.")
  }

  return dto.entityType === "transactions"
    ? buildTransactionPreview(rows, dto.filename)
    : buildInvoicePreview(rows, dto.filename)
}

function isPreviewContent(value: Json | null): value is PreviewContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  return "entityType" in value && "items" in value && "errors" in value
}

export class IntakeImportService {
  constructor(private readonly intakeRepository = new IntakeRepository()) {}

  async previewImport(dto: ImportPreviewDto) {
    const preview = parsePreview(dto)
    const log = await this.intakeRepository.createLog({
      source: "csv",
      status: "pending",
      source_reference: dto.filename,
      raw_content: dto.csvContent,
      processed_content: preview as Json,
    })

    return {
      intakeLogId: log.id,
      ...preview,
    }
  }

  async confirmImport(dto: ImportConfirmDto) {
    const log = await this.intakeRepository.getLogById(dto.intakeLogId)
    const userId = await this.intakeRepository.getCurrentUserId()

    if (log.status === "processed") {
      throw new ConflictException("Intake log already processed", "Este archivo ya fue importado.")
    }

    if (!isPreviewContent(log.processed_content)) {
      throw new BadRequestException("Intake log missing preview content", "El preview guardado es inválido. Volvé a cargar el CSV.")
    }

    const preview = log.processed_content
    if (preview.items.length === 0) {
      await this.intakeRepository.updateLog(log.id, {
        status: "failed",
        processed_at: new Date().toISOString(),
        error_message: "No hay filas válidas para importar.",
      })
      throw new BadRequestException("No valid rows to import", "No hay filas válidas para importar.")
    }

    try {
      if (preview.entityType === "transactions") {
        const createdTransactions: string[] = []

        for (const item of preview.items as TransactionPreviewItem[]) {
          const transaction: Omit<Transaction, "id"> = {
            date: item.date,
            description: item.description,
            amount: item.amount,
            type: item.type,
            category: item.category,
            source: item.source,
            status: "confirmed",
            notes: item.notes,
            clientId: item.counterparty,
            suggestedCategory: item.category,
            sourceData: {
              intakeLogId: log.id,
              importSource: "csv",
              originalFilename: preview.filename,
            },
          }

          const { data, error } = await supabaseAdmin
            .from("transactions")
            .insert({
              user_id: userId,
              type: transaction.type,
              amount: transaction.amount,
              description: transaction.description,
              counterparty: transaction.clientId,
              date: transaction.date,
              source: transaction.source,
              status: "confirmed",
              category_id: null,
              invoice_id: transaction.invoiceId,
              notes: transaction.notes,
              suggested_category: transaction.suggestedCategory,
              recurring: false,
              source_data: transaction.sourceData as Json,
            })
            .select("id")
            .single()

          if (error || !data) {
            throw new Error(error?.message ?? "No se pudo insertar la transacción importada.")
          }

          createdTransactions.push(data.id)
        }

        await this.intakeRepository.updateLog(log.id, {
          status: "processed",
          processed_at: new Date().toISOString(),
          created_transactions: createdTransactions,
          created_invoices: [],
          error_message: null,
        })

        return {
          intakeLogId: log.id,
          entityType: preview.entityType,
          importedCount: createdTransactions.length,
          createdTransactionIds: createdTransactions,
        }
      }

      const createdInvoices: string[] = []

      for (const item of preview.items as InvoicePreviewItem[]) {
        const invoice: Invoice = {
          id: `INV-${String(Date.now() + createdInvoices.length).slice(-6)}`,
          client: item.clientId,
          clientId: item.clientId,
          amount: item.amount,
          totalAmount: item.amount,
          paidAmount: 0,
          type: item.type,
          issueDate: item.issueDate,
          dueDate: item.dueDate,
          status: "pending",
          description: item.description,
          owner: item.owner,
          priority: item.priority,
          notes: item.notes,
          sourceData: {
            intakeLogId: log.id,
            importSource: "csv",
            originalFilename: preview.filename,
          },
          paymentHistory: [],
          expectedPayments: [],
        }

        const { data, error } = await supabaseAdmin
          .from("invoices")
          .insert({
            user_id: userId,
            counterparty: invoice.client,
            total_amount: invoice.totalAmount ?? invoice.amount,
            paid_amount: 0,
            issue_date: invoice.issueDate,
            due_date: invoice.dueDate,
            status: "pending",
            description: invoice.description,
            priority: invoice.priority,
            notes: invoice.notes ?? null,
            source_data: invoice.sourceData as Json,
            type: invoice.type ?? "receivable",
          })
          .select("id")
          .single()

        if (error || !data) {
          throw new Error(error?.message ?? "No se pudo insertar la factura importada.")
        }

        createdInvoices.push(data.id)
      }

      await this.intakeRepository.updateLog(log.id, {
        status: "processed",
        processed_at: new Date().toISOString(),
        created_transactions: [],
        created_invoices: createdInvoices,
        error_message: null,
      })

      return {
        intakeLogId: log.id,
        entityType: preview.entityType,
        importedCount: createdInvoices.length,
        createdInvoiceIds: createdInvoices,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido al confirmar importación."
      await this.intakeRepository.updateLog(log.id, {
        status: "failed",
        processed_at: new Date().toISOString(),
        error_message: message,
      })
      throw new DatabaseException(message, "No se pudo confirmar la importación. Revisá el preview e intentá de nuevo.")
    }
  }

  getClaudePrompt(query: ClaudePromptQueryDto) {
    if (query.entityType === "transactions") {
      return {
        entityType: "transactions" as const,
        requiredColumns: transactionRequiredColumns,
        example: [
          "date,description,amount,type,category,source,notes,counterparty",
          "2026-03-28,Cobro de mantenimiento,125000,income,Invoice payment,import,Transferencia marzo,Acme SA",
          "2026-03-28,Pago de hosting,18999,expense,SaaS,import,Factura AWS,Amazon Web Services",
        ].join("\n"),
        instructions: [
          "Usá solo archivos CSV.",
          "La primera fila debe ser el encabezado.",
          "Las columnas requeridas son date, description, amount y type.",
          "date debe estar en formato YYYY-MM-DD.",
          "type debe ser income o expense.",
          "source es opcional y por defecto se toma como import.",
          "Este endpoint solo devuelve guía; no importa datos directamente.",
        ],
      }
    }

    return {
      entityType: "invoices" as const,
      requiredColumns: invoiceRequiredColumns,
      example: [
        "counterparty,amount,issue_date,due_date,description,type,owner,priority,notes",
        "Globex,450000,2026-03-01,2026-03-30,Abono mensual marzo,receivable,Revenue Ops,medium,Cliente recurrente",
        "Proveedor Cloud,98000,2026-03-05,2026-03-20,Infraestructura marzo,payable,Finance,high,Renovación trimestral",
      ].join("\n"),
      instructions: [
        "Usá solo archivos CSV.",
        "La primera fila debe ser el encabezado.",
        "Las columnas requeridas son counterparty, amount, issue_date, due_date y description.",
        "issue_date y due_date deben usar formato YYYY-MM-DD.",
        "type es opcional y acepta receivable o payable.",
        "priority es opcional y acepta high, medium o low.",
        "Este endpoint solo devuelve guía; no importa datos directamente.",
      ],
    }
  }
}

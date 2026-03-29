"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { FileSpreadsheet, Loader2, Upload } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { apiFetch } from "@/lib/api"

type ImportEntity = "transactions" | "invoices"

type CsvImportDialogProps = {
  entityType: ImportEntity
  onImported: () => Promise<void> | void
}

type PreviewResponse = {
  intakeLogId: string
  entityType: ImportEntity
  filename: string
  columns: string[]
  requiredColumns: string[]
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{ row: number; field?: string; message: string }>
  items: Array<Record<string, unknown>>
}

type ClaudePromptResponse = {
  entityType: ImportEntity
  requiredColumns: string[]
  example: string
  instructions: string[]
}

function entityLabel(entityType: ImportEntity) {
  return entityType === "transactions" ? "movimientos" : "facturas"
}

function truncateValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  const text = typeof value === "string" ? value : String(value)
  return text.length > 60 ? `${text.slice(0, 60)}...` : text
}

export function CsvImportDialog({ entityType, onImported }: CsvImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [guidance, setGuidance] = useState<ClaudePromptResponse | null>(null)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setFile(null)
      setPreview(null)
      setGuidance(null)
      setSubmitError(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    let cancelled = false
    setIsLoadingGuidance(true)

    apiFetch<ClaudePromptResponse>(`/api/intake/import/claude-prompt?entityType=${entityType}`)
      .then((response) => {
        if (!cancelled) setGuidance(response)
      })
      .catch(() => {
        if (!cancelled) toast.error("No pudimos cargar la guía del CSV")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGuidance(false)
      })

    return () => {
      cancelled = true
    }
  }, [entityType, open])

  const previewHeaders = useMemo(() => {
    if (!preview || preview.items.length === 0) return []
    return Object.keys(preview.items[0]).slice(0, 6)
  }, [preview])

  const handleFileChange = (nextFile: File | null) => {
    if (!nextFile) {
      setFile(null)
      setPreview(null)
      setSubmitError(null)
      return
    }

    if (!nextFile.name.toLowerCase().endsWith(".csv")) {
      toast.error("Solo se permiten archivos CSV")
      setSubmitError("Solo se permiten archivos CSV.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setFile(nextFile)
    setPreview(null)
    setSubmitError(null)
  }

  const handlePreview = async () => {
    if (!file) {
      toast.error("Seleccioná un archivo CSV antes de continuar")
      return
    }

    try {
      setIsPreviewing(true)
      setSubmitError(null)
      const csvContent = await file.text()
      const response = await apiFetch<PreviewResponse>("/api/intake/import/preview", {
        method: "POST",
        body: JSON.stringify({
          entityType,
          filename: file.name,
          csvContent,
        }),
      })

      setPreview(response)
      toast.success("Preview generado")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo generar el preview"
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleConfirm = async () => {
    if (!preview) {
      toast.error("Primero generá el preview")
      return
    }

    try {
      setIsConfirming(true)
      setSubmitError(null)
      const response = await apiFetch<{ importedCount: number }>("/api/intake/import/confirm", {
        method: "POST",
        body: JSON.stringify({ intakeLogId: preview.intakeLogId }),
      })

      await onImported()
      toast.success(`Se importaron ${response.importedCount} ${entityLabel(entityType)}`)
      setOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo confirmar la importación"
      setSubmitError(message)
      toast.error(message)
    } finally {
      setIsConfirming(false)
    }
  }

  useEffect(() => {
    if (!file || !open) return
    void handlePreview()
  }, [file, open])

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload className="size-4" />
        Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importar CSV de {entityLabel(entityType)}</DialogTitle>
            <DialogDescription>
              El archivo siempre se previsualiza antes de importar. Solo se aceptan archivos `.csv`.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Archivo CSV</p>
                  <p className="text-xs text-muted-foreground">
                    Subí el archivo, revisá el preview y confirmá la importación.
                  </p>
                </div>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="max-w-sm"
                  onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                />
              </div>
              {file ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <FileSpreadsheet className="size-4" />
                  <span>{file.name}</span>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Guía del formato</p>
                  <p className="text-xs text-muted-foreground">
                    El fallback devuelve columnas requeridas, ejemplo e instrucciones. No importa directo.
                  </p>
                </div>
                {isLoadingGuidance ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
              </div>

              {guidance ? (
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {guidance.requiredColumns.map((column) => (
                      <Badge key={column} variant="secondary">
                        {column}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Ejemplo</p>
                    <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">{guidance.example}</pre>
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {guidance.instructions.map((instruction) => (
                      <p key={instruction}>{instruction}</p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {preview ? (
              <div className="space-y-4 rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Filas: {preview.totalRows}</Badge>
                  <Badge className="bg-success/15 text-success hover:bg-success/15">Válidas: {preview.validRows}</Badge>
                  <Badge className="bg-danger/15 text-danger hover:bg-danger/15">Con error: {preview.invalidRows}</Badge>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Preview</p>
                  {preview.items.length > 0 ? (
                    <div className="rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {previewHeaders.map((header) => (
                              <TableHead key={header}>{header}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {preview.items.slice(0, 5).map((item, index) => (
                            <TableRow key={`${preview.intakeLogId}-${index}`}>
                              {previewHeaders.map((header) => (
                                <TableCell key={header}>{truncateValue(item[header])}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No encontramos filas válidas para mostrar.</p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Errores detectados</p>
                  {preview.errors.length > 0 ? (
                    <div className="space-y-2">
                      {preview.errors.slice(0, 8).map((error, index) => (
                        <div
                          key={`${error.row}-${error.field ?? "general"}-${index}`}
                          className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm"
                        >
                          <span className="font-medium text-danger">Fila {error.row}</span>
                          <span className="text-foreground"> {error.field ? `(${error.field})` : ""} {error.message}</span>
                        </div>
                      ))}
                      {preview.errors.length > 8 ? (
                        <p className="text-xs text-muted-foreground">
                          Se muestran 8 errores. El resto quedó guardado en el preview de importación.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-success">No se detectaron errores en el archivo.</p>
                  )}
                </div>
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                {submitError}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handlePreview} disabled={!file || isPreviewing || isConfirming}>
              {isPreviewing ? <Loader2 className="size-4 animate-spin" /> : null}
              Generar preview
            </Button>
            <Button onClick={handleConfirm} disabled={!preview || preview.validRows === 0 || isPreviewing || isConfirming}>
              {isConfirming ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirmar importación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

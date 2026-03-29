"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { format, formatDistanceToNowStrict, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  ChevronDown,
  ExternalLink,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { MpConnectionInfo, MpMovement, MpPaymentStatus } from "@/types/mercadopago/types/mp.types"

type Period = "current_month" | "last_month" | "3_months" | "6_months" | "last_12_months"
type StatusFilter = "all" | "approved" | "pending" | "rejected"

const PERIOD_LABELS: Record<Period, string> = {
  current_month: "Mes actual",
  last_month: "Mes pasado",
  "3_months": "Últimos 3 meses",
  "6_months": "Últimos 6 meses",
  last_12_months: "Últimos 12 meses",
}

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "Todos",
  approved: "Aprobados",
  pending: "Pendientes",
  rejected: "Rechazados",
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatShortDate(value: string) {
  try {
    return format(parseISO(value), "dd/MM", { locale: es })
  } catch {
    return value
  }
}

function formatRelativeDate(value: string | null) {
  if (!value) {
    return "Todavía no sincronizado"
  }

  try {
    return `hace ${formatDistanceToNowStrict(parseISO(value), { locale: es })}`
  } catch {
    return value
  }
}

function getStatusBadgeClass(status: MpPaymentStatus) {
  if (status === "approved") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
  if (status === "pending" || status === "in_process") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300"
  }

  return "border-rose-500/20 bg-rose-500/10 text-rose-300"
}

function getStatusLabel(status: MpPaymentStatus) {
  const labels: Record<MpPaymentStatus, string> = {
    approved: "Aprobado",
    pending: "Pendiente",
    rejected: "Rechazado",
    cancelled: "Cancelado",
    in_process: "En proceso",
    refunded: "Devuelto",
  }

  return labels[status]
}

export function MpConnectPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [open, setOpen] = useState(true)
  const [status, setStatus] = useState<MpConnectionInfo | null>(null)
  const [movements, setMovements] = useState<MpMovement[]>([])
  const [total, setTotal] = useState(0)
  const [period, setPeriod] = useState<Period>("current_month")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [startingOauth, setStartingOauth] = useState(false)
  const [origin, setOrigin] = useState("")

  const webhookUrl = useMemo(() => {
    if (!origin || !status?.connectionId) {
      return null
    }

    return `${origin}/api/mercadopago/webhook?connectionId=${status.connectionId}`
  }, [origin, status?.connectionId])

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true)

    try {
      const response = await apiFetch<MpConnectionInfo>("/api/mercadopago/connect")
      setStatus(response)
    } catch {
      setStatus({
        connectionId: null,
        isConnected: false,
        mpEmail: null,
        mpUserId: null,
        lastSyncAt: null,
      })
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  const fetchMovements = useCallback(async (nextPeriod: Period, nextStatus: StatusFilter) => {
    setLoadingMovements(true)

    try {
      const response = await apiFetch<{ movements: MpMovement[]; total: number }>(
        `/api/mercadopago/movements?period=${nextPeriod}&status=${nextStatus}`,
      )
      setMovements(response.movements)
      setTotal(response.total)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos cargar los movimientos de Mercado Pago.")
    } finally {
      setLoadingMovements(false)
    }
  }, [])

  const handleSync = useCallback(
    async (syncPeriod: Period, silent = false) => {
      const shouldShowSpinner = !silent

      if (shouldShowSpinner) {
        setSyncing(true)
      }

      try {
        await apiFetch("/api/mercadopago/sync", {
          method: "POST",
          body: JSON.stringify({ period: syncPeriod }),
        })

        await fetchStatus()
        await fetchMovements(period, statusFilter)

        if (!silent) {
          toast.success("Mercado Pago sincronizado")
        }
      } catch (error) {
        if (!silent) {
          toast.error(error instanceof Error ? error.message : "No pudimos sincronizar Mercado Pago.")
        }
      } finally {
        if (shouldShowSpinner) {
          setSyncing(false)
        }
      }
    },
    [fetchMovements, fetchStatus, period, statusFilter],
  )

  const handleConnect = useCallback(() => {
    setStartingOauth(true)
    window.location.assign("/api/mercadopago/connect/start")
  }, [])

  const handleDisconnect = useCallback(async () => {
    try {
      await apiFetch("/api/mercadopago/connect", { method: "DELETE" })
      setStatus({
        connectionId: null,
        isConnected: false,
        mpEmail: null,
        mpUserId: null,
        lastSyncAt: null,
      })
      setMovements([])
      setTotal(0)
      toast.success("La cuenta de Mercado Pago quedó desconectada.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos desconectar la cuenta de Mercado Pago.")
    }
  }, [])

  useEffect(() => {
    setOrigin(window.location.origin)
    void fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    const mpState = searchParams.get("mp")
    const message = searchParams.get("message")

    if (!mpState) {
      return
    }

    if (mpState === "connected") {
      toast.success("Mercado Pago quedó vinculado correctamente.")
    } else if (mpState === "error") {
      toast.error(message ?? "No pudimos completar la vinculación con Mercado Pago.")
    }

    const params = new URLSearchParams(searchParams.toString())
    params.delete("mp")
    params.delete("message")
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [pathname, router, searchParams])

  useEffect(() => {
    if (!status?.isConnected) {
      return
    }

    void fetchMovements(period, statusFilter)
  }, [fetchMovements, period, status?.isConnected, statusFilter])

  useEffect(() => {
    if (!status?.isConnected) {
      return
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return
      }

      void handleSync("current_month", true)
    }, 60_000)

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void handleSync("current_month", true)
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [handleSync, status?.isConnected])

  if (loadingStatus) {
    return (
      <Card className="border-border/70 bg-card/80">
        <CardHeader className="gap-3 pb-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-44" />
              </div>
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="overflow-hidden border-border/70 bg-card/90">
        <CardHeader className="gap-4 pb-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-[#009ee3]/20 bg-[#009ee3]/10">
                <Wallet className="size-5 text-[#009ee3]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-foreground">Mercado Pago</p>
                  {status?.isConnected ? (
                    <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10">
                      <BadgeCheck className="mr-1 size-3.5" />
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border/80 text-muted-foreground">
                      Desconectado
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {status?.isConnected
                    ? `${status.mpEmail ?? "Cuenta vinculada"} · último sync ${formatRelativeDate(status.lastSyncAt)}`
                    : "Vinculá tu cuenta para traer cobros y pagos recibidos sin salir de SYNCRO."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              {status?.isConnected ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => void handleSync(period)} disabled={syncing}>
                    {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                    Sync ahora
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-9">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => void handleDisconnect()}
                      >
                        Desconectar cuenta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button
                  size="sm"
                  className="bg-[#009ee3] text-white hover:bg-[#0b8cc7]"
                  onClick={handleConnect}
                  disabled={startingOauth}
                >
                  {startingOauth ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  Vincular con Mercado Pago
                </Button>
              )}

              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9">
                  <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4 border-t border-border/60 pt-5">
            {!status?.isConnected ? (
              <div className="grid gap-4 lg:grid-cols-[1.25fr_0.85fr]">
                <div className="rounded-2xl border border-border/70 bg-muted/10 p-5">
                  <p className="text-sm font-medium text-foreground">Conexión segura con OAuth</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    No necesitás pegar tu Access Token. Al tocar el botón te redirigimos a Mercado Pago
                    para autorizar la conexión y volver automáticamente a SYNCRO.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button className="bg-[#009ee3] text-white hover:bg-[#0b8cc7]" onClick={handleConnect} disabled={startingOauth}>
                      {startingOauth ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                      Vincular con Mercado Pago
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href="https://www.mercadopago.com.ar/developers/panel/app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir Developer Dashboard
                        <ExternalLink className="size-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#009ee3]/15 bg-[#009ee3]/5 p-5">
                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <AlertCircle className="size-4 text-[#009ee3]" />
                    Alcance de la API personal
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    La conexión muestra cobros y pagos recibidos que Mercado Pago expone para cuentas
                    personales. Si necesitás completar egresos o retiros bancarios, podés combinarlo
                    después con importación manual.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px_180px]">
                  <div className="rounded-2xl border border-border/70 bg-muted/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Estado</p>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      Cuenta vinculada con {status.mpEmail ?? "Mercado Pago"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Polling activo cada 60 segundos mientras esta pestaña permanezca visible.
                    </p>
                  </div>

                  <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/5 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{total} movimientos de Mercado Pago</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Los movimientos se sirven desde cache local y se actualizan con sync manual, polling o webhook.
                    </p>
                  </div>
                  {webhookUrl ? (
                    <p className="text-xs text-muted-foreground">
                      Webhook sugerido: <span className="font-mono text-[11px] text-foreground">{webhookUrl}</span>
                    </p>
                  ) : null}
                </div>

                {loadingMovements ? (
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 rounded-2xl" />
                    ))}
                  </div>
                ) : movements.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 px-5 py-8 text-center">
                    <p className="text-sm font-medium text-foreground">No hay movimientos de MP en este período.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Probá con otro rango o corré un sync para ampliar el historial cacheado.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/70">
                    {movements.map((movement) => (
                      <div
                        key={movement.id}
                        className="flex items-center gap-3 border-b border-border/60 bg-card/60 px-4 py-3 last:border-b-0"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                          <ArrowUpRight className="size-4 text-emerald-400" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium text-foreground">
                              {movement.description ?? "Cobro recibido desde Mercado Pago"}
                            </p>
                            <Badge
                              variant="outline"
                              className="border-[#009ee3]/20 bg-[#009ee3]/10 text-[#009ee3]"
                            >
                              MP
                            </Badge>
                          </div>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {movement.payerEmail ?? movement.paymentMethodId ?? movement.operationType ?? "Sin detalle adicional"}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-400">
                            +{formatAmount(movement.amount, movement.currency)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatShortDate(movement.dateCreated)}</p>
                        </div>

                        <Badge className={cn("ml-1 shrink-0 border", getStatusBadgeClass(movement.status))}>
                          {getStatusLabel(movement.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

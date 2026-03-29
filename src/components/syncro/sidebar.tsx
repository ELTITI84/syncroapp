"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Scale,
  ChevronRight,
  LayoutDashboard,
  Lightbulb,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  FileText,
  ArrowLeftRight,
} from "lucide-react"
import { useSWRConfig } from "swr"

import { useSession } from "@/hooks/use-session"
import { apiFetch } from "@/lib/api"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "./global-search"
import { Badge } from "@/components/ui/badge"

const navItems = [
  { href: "/", label: "Inicio", icon: LayoutDashboard },
  { href: "/results", label: "Resultados", icon: Scale },
  { href: "/cashflow", label: "Flujo de caja", icon: TrendingUp },
  { href: "/invoices", label: "Cobros y pagos", icon: FileText },
  { href: "/movements", label: "Movimientos", icon: ArrowLeftRight },
  { href: "/insights", label: "Señales", icon: Lightbulb },
  { href: "/clients", label: "Clientes", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { mutate } = useSWRConfig()
  const { user } = useSession()
  const [lastSync, setLastSync] = useState(new Date())
  const [syncing, setSyncing] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    await mutate(() => true, undefined, { revalidate: true })
    setLastSync(new Date())
    setSyncing(false)
  }

  const syncAgo = Math.round((Date.now() - lastSync.getTime()) / 60000)

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center justify-start gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-7 shrink-0 items-start justify-start overflow-hidden ">
            <img src="/logo.svg" alt="" className=" object-cover" aria-hidden />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">SYNCRO</span>
          <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/10">beta</Badge>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-accent/60 px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Search className="size-3.5" />
          <span>Buscar...</span>
          <kbd className="ml-auto rounded border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-foreground/60">Ctrl K</kbd>
        </button>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Navegación</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  active ? "border border-sidebar-primary/30 bg-sidebar-accent font-medium text-sidebar-primary" : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground")} />
                {label}
                {active && <ChevronRight className="ml-auto size-3 text-sidebar-primary" />}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
          <button
            onClick={handleSync}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            <span>{syncing ? "Sincronizando..." : "Sincronizar"}</span>
            <span className="ml-auto text-[10px]">{syncAgo === 0 ? "ahora mismo" : `hace ${syncAgo}m`}</span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-full border border-sidebar-primary/40 bg-sidebar-primary/20 text-xs font-semibold text-sidebar-primary">
              {user ? (user.full_name ?? user.email).slice(0, 2).toUpperCase() : ".."}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-sidebar-foreground">
                {user?.full_name ?? user?.email ?? "—"}
              </p>
              <button
                onClick={async () => {
                  await apiFetch("/api/auth/logout", { method: "POST" })
                  router.push("/login")
                }}
                className="truncate text-[10px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  ChevronRight,
  LayoutDashboard,
  Lightbulb,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
  Zap,
  FileText,
  ArrowLeftRight,
} from "lucide-react"

import { notifications } from "@/lib/data"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { GlobalSearch } from "./global-search"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cashflow", label: "Cashflow", icon: TrendingUp },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/movements", label: "Movements", icon: ArrowLeftRight },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/clients", label: "Clients", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { lastSync, syncData } = useStore()
  const [syncing, setSyncing] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

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

  const handleSync = () => {
    setSyncing(true)
    setTimeout(() => {
      syncData()
      setSyncing(false)
    }, 1400)
  }

  const syncAgo = Math.round((Date.now() - lastSync.getTime()) / 60000)

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary">
            <Zap className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight text-foreground">SYNCRO</span>
          <Badge className="ml-auto bg-primary/10 text-primary hover:bg-primary/10">beta</Badge>
        </div>

        <button
          onClick={() => setSearchOpen(true)}
          className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="size-3.5" />
          <span>Search...</span>
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">Ctrl K</kbd>
        </button>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
          <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">Navigation</p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  active ? "border border-primary/20 bg-primary/10 font-medium text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {label}
                {active && <ChevronRight className="ml-auto size-3 text-primary" />}
              </Link>
            )
          })}
        </nav>

        <div className="space-y-2 border-t border-sidebar-border px-3 py-4">
          <button
            onClick={handleSync}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <RefreshCw className={cn("size-4", syncing && "animate-spin")} />
            <span>{syncing ? "Syncing..." : "Sync data"}</span>
            <span className="ml-auto text-[10px]">{syncAgo === 0 ? "just now" : `${syncAgo}m ago`}</span>
          </button>

          <button
            onClick={() => setNotificationsOpen(true)}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <Bell className="size-4" />
            <span>Notifications</span>
            <span className="ml-auto flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-danger-foreground">
              {notifications.length}
            </span>
          </button>

          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex size-7 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-xs font-semibold text-primary">JD</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">Jane Doe</p>
              <p className="truncate text-[10px] text-muted-foreground">Acme Inc.</p>
            </div>
          </div>
        </div>
      </aside>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>Latest SYNCRO signals that need attention.</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 px-4 pb-4">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => {
                  const query = new URLSearchParams(notification.target.params ?? {}).toString()
                  router.push(`${notification.target.pathname}${query ? `?${query}` : ""}`)
                  setNotificationsOpen(false)
                }}
                className="w-full rounded-xl border border-border/80 bg-muted/10 p-4 text-left transition-all hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className={cn(notification.severity === "critical" ? "bg-danger/15 text-danger hover:bg-danger/15" : notification.severity === "high" ? "bg-warning/15 text-warning hover:bg-warning/15" : "bg-primary/15 text-primary hover:bg-primary/15")}>
                      {notification.severity}
                    </Badge>
                    <p className="mt-3 text-sm font-semibold text-foreground">{notification.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{notification.body}</p>
                  </div>
                  <ChevronRight className="mt-1 size-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

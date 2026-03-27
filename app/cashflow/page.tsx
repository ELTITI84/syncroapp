import { Suspense } from "react"
import { AppShell } from "@/components/syncro/app-shell"
import { CashflowContent } from "@/components/syncro/cashflow-content"

export default function CashflowPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
        <CashflowContent />
      </Suspense>
    </AppShell>
  )
}

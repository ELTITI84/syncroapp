import { Suspense } from "react"
import { AppShell } from "@/components/syncro/app-shell"
import { InvoicesContent } from "@/components/syncro/invoices-content"

export default function InvoicesPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading...</div>}>
        <InvoicesContent />
      </Suspense>
    </AppShell>
  )
}

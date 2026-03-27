import { Suspense } from "react"
import { AppShell } from "@/components/syncro/app-shell"
import { ClientsContent } from "@/components/syncro/clients-content"

export default function ClientsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading...</div>}>
        <ClientsContent />
      </Suspense>
    </AppShell>
  )
}

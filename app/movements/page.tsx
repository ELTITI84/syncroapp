import { Suspense } from "react"
import { AppShell } from "@/components/syncro/app-shell"
import { MovementsContent } from "@/components/syncro/movements-content"

export default function MovementsPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-6 text-muted-foreground text-sm">Loading...</div>}>
        <MovementsContent />
      </Suspense>
    </AppShell>
  )
}

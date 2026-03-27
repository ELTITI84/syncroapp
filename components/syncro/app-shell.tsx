"use client"

import { Sidebar } from "./sidebar"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}

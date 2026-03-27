import type { Metadata } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const _geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  title: "SYNCRO - Cashflow Intelligence",
  description:
    "SYNCRO helps businesses track money, manage invoices, and understand future cashflow with actionable recommendations.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning style={{ colorScheme: "dark" }}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}

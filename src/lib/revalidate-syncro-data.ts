const syncroApiPrefixes = [
  "/api/dashboard",
  "/api/cashflow",
  "/api/insights",
  "/api/invoices",
  "/api/movements",
  "/api/clients",
] as const

export function isSyncroDataKey(key: unknown) {
  return (
    typeof key === "string" &&
    syncroApiPrefixes.some((prefix) => key === prefix || key.startsWith(`${prefix}?`))
  )
}

type ApiEnvelope<T> = {
  data: T
}

function isApiEnvelope<T>(body: unknown): body is ApiEnvelope<T> {
  return typeof body === "object" && body !== null && "data" in body
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error?.userMessage ?? body?.error?.message ?? `Request failed: ${res.status}`)
  }
  const body = await res.json()
  return (isApiEnvelope<T>(body) ? body.data : body) as T
}

export const fetcher = (url: string) => apiFetch(url)

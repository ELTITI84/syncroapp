import { createSupabaseServerClient } from "@/lib/supabase/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { SessionNotFoundException } from "@/exceptions/auth/auth-exceptions"

export abstract class AuthenticatedRepository {
  protected static readonly PAGE_SIZE = 1000

  protected async getClientAndUserId() {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) throw new SessionNotFoundException()
    return [supabase, data.user.id] as const
  }

  protected async getUserId(): Promise<string> {
    const [, userId] = await this.getClientAndUserId()
    return userId
  }

  protected async getClient() {
    return createSupabaseServerClient()
  }

  protected async fetchAllUserRows<T = any>(
    table: string,
    select: string,
    options?: {
      orderBy?: string
      ascending?: boolean
    },
  ): Promise<T[]> {
    const [supabase, userId] = await this.getClientAndUserId()
    const client = supabase as any
    const rows: T[] = []
    let from = 0

    while (true) {
      let query: any = client
        .from(table)
        .select(select)
        .eq("user_id", userId)

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false })
      }

      const { data, error } = await query.range(
        from,
        from + AuthenticatedRepository.PAGE_SIZE - 1,
      )

      if (error) throw new Error(error.message)

      const page = (data ?? []) as T[]
      rows.push(...page)

      if (page.length < AuthenticatedRepository.PAGE_SIZE) {
        break
      }

      from += AuthenticatedRepository.PAGE_SIZE
    }

    return rows
  }

  protected async fetchAllRows<T = any>(
    table: string,
    select: string,
    options?: {
      orderBy?: string
      ascending?: boolean
    },
  ): Promise<T[]> {
    const client = supabaseAdmin as any
    const rows: T[] = []
    let from = 0

    while (true) {
      let query: any = client.from(table).select(select)

      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending ?? false })
      }

      const { data, error } = await query.range(
        from,
        from + AuthenticatedRepository.PAGE_SIZE - 1,
      )

      if (error) throw new Error(error.message)

      const page = (data ?? []) as T[]
      rows.push(...page)

      if (page.length < AuthenticatedRepository.PAGE_SIZE) {
        break
      }

      from += AuthenticatedRepository.PAGE_SIZE
    }

    return rows
  }
}

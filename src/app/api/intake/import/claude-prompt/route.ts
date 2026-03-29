import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { IntakeImportService } from "@/services/intake/intake-import.service"
import { claudePromptQuerySchema } from "@/types/intake/dto/claude-prompt-query.dto"

const intakeImportService = new IntakeImportService()

export async function GET(request: Request) {
  return routeHandler(async () => {
    const { searchParams } = new URL(request.url)
    const parsedQuery = claudePromptQuerySchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsedQuery.success) {
      throw new ValidationException(parsedQuery.error.message, "Query inválida para la guía de CSV.")
    }

    return intakeImportService.getClaudePrompt(parsedQuery.data)
  }, { cacheSeconds: 300, staleWhileRevalidate: 600 })
}

import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { IntakeImportService } from "@/services/intake/intake-import.service"
import { importPreviewSchema } from "@/types/intake/dto/import-preview.dto"

const intakeImportService = new IntakeImportService()

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsedBody = importPreviewSchema.safeParse(body)

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para previsualizar la importación CSV.")
    }

    return intakeImportService.previewImport(parsedBody.data)
  })
}

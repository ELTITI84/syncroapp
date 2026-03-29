import { ValidationException } from "@/exceptions/base/base-exceptions"
import { routeHandler } from "@/lib/handlers/route-handler"
import { IntakeImportService } from "@/services/intake/intake-import.service"
import { importConfirmSchema } from "@/types/intake/dto/import-confirm.dto"

const intakeImportService = new IntakeImportService()

export async function POST(request: Request) {
  return routeHandler(async () => {
    const body = await request.json()
    const parsedBody = importConfirmSchema.safeParse(body)

    if (!parsedBody.success) {
      throw new ValidationException(parsedBody.error.message, "Body inválido para confirmar la importación.")
    }

    return intakeImportService.confirmImport(parsedBody.data)
  })
}

import { MovementNotFoundException } from "@/exceptions/movements/movements-exceptions"
import type { Transaction } from "@/lib/data"
import { MovementsRepository } from "@/repositories/movements/movements.repository"
import type { CreateMovementDto } from "@/types/movements/dto/create-movement.dto"
import type { MovementsQueryDto } from "@/types/movements/dto/movements-query.dto"
import type { UpdateMovementDto } from "@/types/movements/dto/update-movement.dto"

export class MovementsService {
  constructor(private readonly movementsRepository = new MovementsRepository()) {}

  async getMovements(query: MovementsQueryDto) {
    const movements = await this.movementsRepository.getMovements()
    const search = query.search?.trim().toLowerCase()

    return {
      movements: movements.filter((movement) => {
        const matchesTab = query.tab ? movement.status === query.tab : true
        const matchesCategory = query.category ? movement.category === query.category : true
        const matchesType = query.type ? movement.type === query.type : true
        const matchesSource = query.source ? movement.source === query.source : true
        const matchesSearch =
          !search ||
          movement.description.toLowerCase().includes(search) ||
          movement.category.toLowerCase().includes(search) ||
          movement.notes?.toLowerCase().includes(search)

        return matchesTab && matchesCategory && matchesType && matchesSource && matchesSearch
      }),
    }
  }

  async getMovementById(movementId: string) {
    const movement = await this.movementsRepository.getMovementById(movementId)

    if (!movement) {
      throw new MovementNotFoundException(movementId)
    }

    return movement
  }

  async createMovement(payload: CreateMovementDto) {
    const movement: Transaction = {
      id: `T${String(Date.now()).slice(-6)}`,
      date: payload.date,
      description: payload.description,
      amount: payload.type === "expense" ? -payload.amount : payload.amount,
      type: payload.type,
      category: payload.category,
      source: payload.source,
      status: "confirmed",
      notes: payload.notes,
    }

    return this.movementsRepository.createMovement(movement)
  }

  async updateMovement(movementId: string, updates: UpdateMovementDto) {
    const currentMovement = await this.getMovementById(movementId)
    const nextMovement = await this.movementsRepository.updateMovement(movementId, {
      ...updates,
      amount:
        updates.amount !== undefined
          ? (updates.type ?? currentMovement.type) === "expense"
            ? -updates.amount
            : updates.amount
          : undefined,
    })

    if (!nextMovement) {
      throw new MovementNotFoundException(movementId)
    }

    return nextMovement
  }

  async deleteMovement(movementId: string) {
    const deletedMovement = await this.movementsRepository.deleteMovement(movementId)

    if (!deletedMovement) {
      throw new MovementNotFoundException(movementId)
    }

    return { success: true, movementId }
  }
}

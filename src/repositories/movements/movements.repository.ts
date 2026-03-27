import type { Transaction } from "@/lib/data"
import {
  deleteMockTransaction,
  getMockTransactionById,
  listMockTransactions,
  saveMockTransaction,
  updateMockTransaction,
} from "@/repositories/mock/mock-state"

export class MovementsRepository {
  async getMovements() {
    return listMockTransactions()
  }

  async getMovementById(movementId: string) {
    return getMockTransactionById(movementId)
  }

  async createMovement(movement: Transaction) {
    return saveMockTransaction(movement)
  }

  async updateMovement(movementId: string, updates: Partial<Transaction>) {
    return updateMockTransaction(movementId, updates)
  }

  async deleteMovement(movementId: string) {
    return deleteMockTransaction(movementId)
  }
}

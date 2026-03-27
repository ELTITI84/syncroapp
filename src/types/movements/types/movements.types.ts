import type { Transaction } from "@/lib/data"
import type { MovementTab } from "@/lib/syncro"

export type MovementModel = Transaction
export type MovementStatusTab = MovementTab

export type MovementsListResult = {
  movements: MovementModel[]
}

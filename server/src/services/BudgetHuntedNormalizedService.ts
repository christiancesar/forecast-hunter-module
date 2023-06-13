import BudgetHuntedMapper from "@shared/database/mappers/BudgetHuntedMapper";
import { BudgetHuntedDTO } from "src/dtos/BudgetHuntedDTO";
import { BudgetDTO } from "src/dtos/domain/BudgetDTO";

export class BudgetHuntedNormalizedService {
  async execute(budgetsHunted: BudgetHuntedDTO[]): Promise<BudgetDTO[]> {
    const budgetsNormalized = budgetsHunted.map((budget) => {
      return BudgetHuntedMapper.toDomain(budget);
    });

    return budgetsNormalized;
  }
}

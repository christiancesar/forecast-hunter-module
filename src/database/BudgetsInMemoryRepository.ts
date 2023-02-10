import { BudgetHunterDTO } from "dtos/BudgetHunterDTO";

export class BudgetsInMemoryRepository {
  private budgets: BudgetHunterDTO[] = [];

  async save(budget: BudgetHunterDTO): Promise<void> {
    this.budgets.push(budget);
  }

  async saveAll(budgets: BudgetHunterDTO[]): Promise<void> {
    this.budgets.push(...budgets);
  }

  async findByShortId(shortId: string): Promise<BudgetHunterDTO | undefined> {
    return this.budgets.find((budget) => budget.NroOrc === shortId);
  }

  async findAll(): Promise<BudgetHunterDTO[]> {
    return this.budgets;
  }
}

import { BudgetHuntedDTO } from "dtos/BudgetHuntedDTO";

export class BudgetsHuntedInMemoryRepository {
  private budgets: BudgetHuntedDTO[] = [];

  async save(budget: BudgetHuntedDTO): Promise<void> {
    this.budgets.push(budget);
  }

  async saveAll(budgets: BudgetHuntedDTO[]): Promise<void> {
    this.budgets.push(...budgets);
  }

  async update(budget: BudgetHuntedDTO): Promise<void> {
    const index = this.budgets.findIndex(
      (budgetItem) => budgetItem.NroOrc === budget.NroOrc
    );

    this.budgets[index] = budget;
  }

  async findByShortId(shortId: string): Promise<BudgetHuntedDTO | undefined> {
    return this.budgets.find((budget) => budget.NroOrc === shortId);
  }

  async findAll(): Promise<BudgetHuntedDTO[]> {
    return this.budgets;
  }
}

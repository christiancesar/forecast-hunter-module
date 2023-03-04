import { BudgetHuntedDTO } from "../../../../dtos/BudgetHuntedDTO";

export class BudgetsHuntedInMemoryRepository {
  private budgets: BudgetHuntedDTO[] = [];

  async save(budget: BudgetHuntedDTO): Promise<BudgetHuntedDTO> {
    const length = this.budgets.push(budget);
    return this.budgets[length - 1];
  }

  async saveAll(budgets: BudgetHuntedDTO[]): Promise<BudgetHuntedDTO[]> {
    this.budgets.push(...budgets);
    return this.budgets;
  }

  async update(budget: BudgetHuntedDTO): Promise<BudgetHuntedDTO> {
    const index = this.budgets.findIndex(
      (budgetItem) => budgetItem.NroOrc === budget.NroOrc
    );

    this.budgets[index] = budget;

    return this.budgets[index];
  }

  async findByShortId(shortId: string): Promise<BudgetHuntedDTO | undefined> {
    return this.budgets.find((budget) => budget.NroOrc === shortId);
  }

  async findAll(): Promise<BudgetHuntedDTO[]> {
    return this.budgets;
  }
}

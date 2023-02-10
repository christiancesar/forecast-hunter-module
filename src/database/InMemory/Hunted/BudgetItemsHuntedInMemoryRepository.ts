import { BudgetItemHuntedDTO } from "dtos/BudgetItemsHunterDTO";

export class BudgetItemsHuntedInMemoryRepository {
  private budgetItems: BudgetItemHuntedDTO[] = [];

  async save(budgetItem: BudgetItemHuntedDTO): Promise<void> {
    this.budgetItems.push(budgetItem);
  }

  async saveAll(budgetItems: BudgetItemHuntedDTO[]): Promise<void> {
    this.budgetItems.push(...budgetItems);
  }

  async findByShortId(
    shortId: string
  ): Promise<BudgetItemHuntedDTO | undefined> {
    return this.budgetItems.find((budgetItem) => budgetItem.Ord3 === shortId);
  }

  async findAll(): Promise<BudgetItemHuntedDTO[]> {
    return this.budgetItems;
  }
}

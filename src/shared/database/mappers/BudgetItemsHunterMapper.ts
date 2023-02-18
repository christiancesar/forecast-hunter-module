import { BudgetItemHuntedDTO } from "./../../../dtos/BudgetItemHuntedDTO";
import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";

type BudgetItems = {
  order: string;
  budgetShortId: string;
  license: number;
  description: string;
  quantity: number;
  unitValue: number;
  totalValue: number;
  totalModifiedValue: number;
  modified: boolean;
  width: number;
  height: number;
  glass: string;
};

class BudgetItemsHuntedMapper {
  toDomain(budgetItem: BudgetItemHuntedDTO): BudgetItems {
    return {
      order: budgetItem.Ord3,
      budgetShortId: budgetItem.NroOramento20,
      license: Number(budgetItem.Licenca22),
      description: budgetItem.Item26,
      quantity: amountStringToNumber(budgetItem.Qtd8),
      unitValue: amountStringToNumber(budgetItem.VlrUnt9),
      totalValue: amountStringToNumber(budgetItem.VlrTotal10),
      totalModifiedValue: amountStringToNumber(budgetItem.VlrAlterado18),
      modified:
        amountStringToNumber(budgetItem.VlrAlterado18) !==
        amountStringToNumber(budgetItem.VlrTotal10),
      width: Number(budgetItem.Largura21),
      height: Number(budgetItem.Altura23),
      glass: budgetItem.Vidro16,
    };
  }
}

export default new BudgetItemsHuntedMapper();

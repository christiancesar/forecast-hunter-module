import { BudgetItemHuntedDTO } from "../../../dtos/BudgetItemHuntedDTO";
import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";

type BudgetItems = {
  order: number;
  budget_short_id: number;
  license: number;
  description: string;
  quantity: number;
  unit_amount: number;
  total_amount: number;
  total_modified_amount: number;
  modified: boolean;
  width: number;
  height: number;
  glass: string;
};

class BudgetItemsHuntedMapper {
  toDomain(budgetItem: BudgetItemHuntedDTO): BudgetItems {
    return {
      order: Number(budgetItem.Ord3),
      budget_short_id: Number(budgetItem.NroOramento20),
      license: Number(budgetItem.Licenca22),
      description: budgetItem.Item26,
      quantity: amountStringToNumber(budgetItem.Qtd8),
      unit_amount: amountStringToNumber(budgetItem.VlrUnt9),
      total_amount: amountStringToNumber(budgetItem.VlrTotal10),
      total_modified_amount: amountStringToNumber(budgetItem.VlrAlterado18),
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

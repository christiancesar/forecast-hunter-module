import { BudgetItemHuntedDTO } from "../../../dtos/BudgetItemHuntedDTO";
import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { BudgetItemsDTO } from "src/dtos/domain/BudgetItemsDTO";

class BudgetItemsHuntedMapper {
  toDomain(budgetItem: BudgetItemHuntedDTO): BudgetItemsDTO {
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

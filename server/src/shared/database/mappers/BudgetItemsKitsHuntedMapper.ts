import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { KitsDTO } from "src/dtos/domain/KitsDTO";
import { KitsCostHuntedDTO } from "src/dtos/KitsCostHuntedDTO";

class BudgetItemsKitsHuntedMapper {
  toDomain(budgetItemsKitsHunted: KitsCostHuntedDTO): KitsDTO {
    return {
      code: budgetItemsKitsHunted.CDIGO,
      // internal_code: budgetItemsKitsHunted.SEUCDIGO,
      color: budgetItemsKitsHunted.COR,
      description: budgetItemsKitsHunted.DESCRIO,
      width: Number(budgetItemsKitsHunted.LARGURA),
      height: Number(budgetItemsKitsHunted.ALTURA),
      quantity: amountStringToNumber(budgetItemsKitsHunted.QTDE),
      unit_amount: amountStringToNumber(budgetItemsKitsHunted.VLRUNIT),
      cost_amount: amountStringToNumber(budgetItemsKitsHunted.VLRCUSTO),
      sale_amount: amountStringToNumber(budgetItemsKitsHunted.TOTAL),
      diff_amount: amountStringToNumber(budgetItemsKitsHunted.DIFERENA),
    };
  }
}

export default new BudgetItemsKitsHuntedMapper();

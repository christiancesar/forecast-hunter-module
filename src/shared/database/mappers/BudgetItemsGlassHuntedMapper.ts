import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { GlassDTO } from "src/dtos/domain/GlassDTO";
import { GlassCostHuntedDTO } from "src/dtos/GlassCostHuntedDTO";

class BudgetItemsGlassHuntedMapper {
  toDomain(glassCostHunted: GlassCostHuntedDTO): GlassDTO {
    return {
      code: glassCostHunted.CODIGO,
      color: glassCostHunted.COR,
      quantity: amountStringToNumber(glassCostHunted.QTDE),
      square_meter: amountStringToNumber(glassCostHunted.M2),
      square_meter_rounded: amountStringToNumber(glassCostHunted.M2ARR),
      weight: amountStringToNumber(glassCostHunted.PESO),
      unitary_amount: amountStringToNumber(glassCostHunted.VLRUNIT),
      cost_amount: amountStringToNumber(glassCostHunted.CUSTO),
      sale_amount: amountStringToNumber(glassCostHunted.VENDA),
      difference_amount: amountStringToNumber(glassCostHunted.DIF),
    };
  }
}

export default new BudgetItemsGlassHuntedMapper();

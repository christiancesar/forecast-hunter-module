import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { StillDTO } from "src/dtos/domain/StillDTO";
import { StillCostHuntedDTO } from "src/dtos/StillCostHuntedDTO";

class BudgetItemsStillHuntedMapper {
  toDomain(stillCostHunted: StillCostHuntedDTO): StillDTO {
    return {
      code: stillCostHunted.CDIGO,
      internal_code: stillCostHunted.SEUCDIGO,
      description: stillCostHunted.Nome,
      color: stillCostHunted.COR,
      quantity: amountStringToNumber(stillCostHunted.QTBARRAS),
      weight: amountStringToNumber(stillCostHunted.Peso),
      linear_meter: amountStringToNumber(stillCostHunted.ML),
      per_kg_per_lm_amount: amountStringToNumber(stillCostHunted.CUSTOKGML),
      cost_amount: amountStringToNumber(
        stillCostHunted.VlrCusto
          ? stillCostHunted.VlrCusto
          : stillCostHunted.VLRCUSTO
      ),
      sale_amount: amountStringToNumber(stillCostHunted.VLRVENDA),

      processing_amount: amountStringToNumber(
        stillCostHunted.VlrTrat
          ? stillCostHunted.VlrTrat
          : stillCostHunted.VLRTRAT
      ),
      cost_processing_amount: amountStringToNumber(
        stillCostHunted.VlrCustoTrat
      ),
      diff_amount: amountStringToNumber(
        stillCostHunted.Diferena
          ? stillCostHunted.Diferena
          : stillCostHunted.DIFERENA
      ),

      remnant_linear_meter: amountStringToNumber(stillCostHunted.MLSobra),
      waste_linear_meter: amountStringToNumber(stillCostHunted.MLSucata),

      remnant_weight: amountStringToNumber(stillCostHunted.PesoSobra),
      waste_weight: amountStringToNumber(stillCostHunted.PesoSucata),

      remnant_amount: amountStringToNumber(stillCostHunted.VlrSobra),
      waste_amount: amountStringToNumber(stillCostHunted.VlrSucata),
    };
  }
}

export default new BudgetItemsStillHuntedMapper();

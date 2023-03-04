import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { AttachmentCostHuntedDTO } from "src/dtos/AttachmentCostHuntedDTO";
import { AttachmentDTO } from "src/dtos/domain/AttachmentDTO";

class BudgetItemsAttchmentHuntedMapper {
  toDomain(attschmentCostHunted: AttachmentCostHuntedDTO): AttachmentDTO {
    return {
      code: attschmentCostHunted.CDIGO,
      internal_code: attschmentCostHunted.SEUCDIGO,
      description: attschmentCostHunted.NOME,
      color: attschmentCostHunted.COR,
      unitary_code: attschmentCostHunted.UN,
      quantity: amountStringToNumber(attschmentCostHunted.QTDE),
      package_quantity: amountStringToNumber(attschmentCostHunted.QTDEMB),
      unitary_amount: amountStringToNumber(attschmentCostHunted.VLRUNIT),
      cost_amount: amountStringToNumber(attschmentCostHunted.VLRCUSTO),
      sale_amount: amountStringToNumber(attschmentCostHunted.VVENDA),
      diff_amount: amountStringToNumber(attschmentCostHunted.DIF),
      cost_package_amount: amountStringToNumber(attschmentCostHunted.CUSTOEMB),
      sale_package_amount: amountStringToNumber(attschmentCostHunted.VENDAEMB),
    };
  }
}

export default new BudgetItemsAttchmentHuntedMapper();

import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { LooseItemHuntedDTO } from "src/dtos/LooseItemHuntedDTO";
import { LooseItemDTO } from "src/dtos/domain/LooseItemDTO";

class BudgetLooseItemsMapper {
  toDomain(looseItem: LooseItemHuntedDTO): LooseItemDTO {
    return {
      code: looseItem.PRODUTO7,
      internal_code: looseItem.SEUCDIGO8,
      description: looseItem.void9,
      color: looseItem.COR10,
      width: amountStringToNumber(looseItem.LARGURA11),
      height: amountStringToNumber(looseItem.ALTURA12),
      quantity: amountStringToNumber(looseItem.QTDE13),
      unit_amount: amountStringToNumber(looseItem.VLRUNT14),
      total_amount: amountStringToNumber(
        looseItem.ORCAMENTOVENDABALCAOITEMTOTAL215
      ),
      measurement: looseItem.UNIDADE16,
    };
  }
}

export default new BudgetLooseItemsMapper();

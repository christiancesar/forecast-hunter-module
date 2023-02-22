import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { ProductStockDTO } from "src/dtos/domain/ProductStockDTO";
import { ProductStockHuntedDTO } from "src/dtos/ProductStockHuntedDTO";

class ProductStockHuntedMapper {
  toDomain(productStockHUnted: ProductStockHuntedDTO): ProductStockDTO {
    return {
      license: Number(productStockHUnted.Id17),
      code: productStockHUnted.CdProd0,
      internal_code: productStockHUnted.SeuCdigo1,
      description: productStockHUnted.Descrio2,
      weight_per_linear_meter: amountStringToNumber(productStockHUnted.Peso18),
      weight_per_unit: amountStringToNumber(productStockHUnted.PesoUnt3),
      quantity: amountStringToNumber(productStockHUnted.Qtde8),
      weight_total: amountStringToNumber(productStockHUnted.PesoTotal4),
      width: amountStringToNumber(productStockHUnted.Largura5),
      height: amountStringToNumber(productStockHUnted.Altura6),
      color: productStockHUnted.Cor7,
      type_prodct: productStockHUnted.Tipo21,

      total_amount: amountStringToNumber(productStockHUnted.VlrTotal14),
      total_amount_table: amountStringToNumber(
        productStockHUnted.VlrTotalTabela15
      ),
      unit_amount: amountStringToNumber(productStockHUnted.VlrUnt24),
      table_amount: amountStringToNumber(productStockHUnted.VlrTabela25),
      total_table_amount: amountStringToNumber(
        productStockHUnted.VlrTotalTabela26
      ),
    };
  }
}

export default new ProductStockHuntedMapper();

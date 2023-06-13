import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import { dateStringToDate } from "@shared/helpers/dateStringToDate";
import { BudgetDTO } from "src/dtos/domain/BudgetDTO";
import { BudgetHuntedDTO } from "../../../dtos/BudgetHuntedDTO";
import BudgetItemsAttchmentHunted from "./BudgetItemsAttchmentHuntedMapper";
import BudgetItemsGlassHuntedMapper from "./BudgetItemsGlassHuntedMapper";
import BudgetItemsHunterMapper from "./BudgetItemsHuntedMapper";
import BudgetItemsKitsHuntedMapper from "./BudgetItemsKitsHuntedMapper";
import BudgetItemsStillHuntedMapper from "./BudgetItemsStillHuntedMapper";
import BudgetLooseItemsMapper from "./BudgetLooseItemsMapper";

export const statusBudget = {
  ORÇAMENTO: "budget",
  FATURADO: "billed",
  CANCELADO: "canceled",
  DEVOLVIDO: "returned",
  VENDA: "sold",
} as const;

class BudgetHuntedMapper {
  toDomain(budget: BudgetHuntedDTO): BudgetDTO {
    const phones = [budget.Fone, budget.Fone2, budget.Celular].filter(
      (phone) => {
        if (phone.trim() !== "") {
          return phone;
        }
      }
    );

    const items = budget.items?.map((item) => {
      return BudgetItemsHunterMapper.toDomain(item);
    });

    const costs = {
      still: budget.cost?.still?.map((stillCost) => {
        return BudgetItemsStillHuntedMapper.toDomain(stillCost);
        // try {
        //   return BudgetItemsStillHuntedMapper.toDomain(stillCost);
        // } catch (error) {
        //   console.log(`
        //     Error on ${budget.NroOrc},
        //     Still: ${JSON.stringify(stillCost, null, 2)}
        //   `);
        // }
      }),
      attachment: budget.cost?.attachment?.map((attachmentCost) => {
        return BudgetItemsAttchmentHunted.toDomain(attachmentCost);
      }),
      glass: budget.cost?.glass?.map((glassCost) => {
        return BudgetItemsGlassHuntedMapper.toDomain(glassCost);
      }),
      kits: budget.cost?.kits?.map((kitCost) => {
        return BudgetItemsKitsHuntedMapper.toDomain(kitCost);
      }),
    };

    const looseItems = budget.looseItems?.map((looseItem) => {
      return BudgetLooseItemsMapper.toDomain(looseItem);
    });

    return {
      shortId: Number(budget.NroOrc),
      license: Number(budget.Licena),
      customer: {
        name: budget.NomeRazoSocial,
        phones,
        email: budget.Email,
        address: {
          street: budget.Endereco,
          number: Number(budget.NroCasa) ? Number(budget.NroCasa) : 0,
          neighborhood: budget.Bairro,
          city: budget.Cidade,
          state: budget.UF,
        },
      },
      looseItems,
      items,
      billedAt: dateStringToDate(budget.DtFatur),
      soldAt: dateStringToDate(budget.DtVenda),
      registeredAt: dateStringToDate(budget.DtCadastro),
      amount: amountStringToNumber(budget.Vlr),
      status_budget: statusBudget[budget.Situao as keyof typeof statusBudget],
      status_producer: budget.EstagioProduo,
      salesman: budget.Vendedor,
      costs,
      captured: budget.captured,
    };
  }
}

export default new BudgetHuntedMapper();

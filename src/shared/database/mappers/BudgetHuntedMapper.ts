import { BudgetHuntedDTO } from "../../../dtos/BudgetHuntedDTO";
import { dateStringToDate } from "@shared/helpers/dateStringToDate";
import { amountStringToNumber } from "@shared/helpers/amountStringToNumber";
import BudgetItemsHunterMapper from "./BudgetItemsHuntedMapper";
import BudgetItemsStillHuntedMapper from "./BudgetItemsStillHuntedMapper";
import BudgetItemsAttchmentHunted from "./BudgetItemsAttchmentHuntedMapper";
import BudgetItemsGlassHuntedMapper from "./BudgetItemsGlassHuntedMapper";

const statusBudget = {
  ORÇAMENTO: "budget",
  FATURADO: "billed",
  CANCELADO: "canceled",
  DEVOLVIDO: "returned",
  VENDA: "sold",
} as const;

class BudgetHuntedMapper {
  toDomain(budget: BudgetHuntedDTO) {
    const customerPhones = [budget.Fone, budget.Fone2, budget.Celular];
    const items = budget.itens.map((item) => {
      return BudgetItemsHunterMapper.toDomain(item);
    });

    const costs = {
      still: budget.cost.still?.map((stillCost) => {
        return BudgetItemsStillHuntedMapper.toDomain(stillCost);
      }),
      attachment: budget.cost.attachment?.map((attachmentCost) => {
        return BudgetItemsAttchmentHunted.toDomain(attachmentCost);
      }),
      glass: budget.cost.glass?.map((glassCost) => {
        return BudgetItemsGlassHuntedMapper.toDomain(glassCost);
      }),
    };

    return {
      shortId: Number(budget.NroOrc),
      license: Number(budget.Licena),
      customer: {
        name: budget.NomeRazoSocial,
        phones: customerPhones.filter((phone) => {
          if (phone.trim() !== "") {
            return phone;
          }
        }),
        email: budget.Email,
        address: {
          street: budget.Endereco,
          number: Number(budget.NroCasa) ? Number(budget.NroCasa) : 0,
          neighborhood: budget.Bairro,
          city: budget.Cidade,
          state: budget.UF,
        },
      },
      items,
      billedAt: dateStringToDate(budget.DtFatur),
      soldAt: dateStringToDate(budget.DtVenda),
      registeredAt: dateStringToDate(budget.DtCadastro),
      amount: amountStringToNumber(budget.Vlr),
      status_budget: statusBudget[budget.Situao as keyof typeof statusBudget],
      status_producer: budget.EstagioProduo,
      salesman: budget.Vendedor,
      costs,
    };
  }
}

export default new BudgetHuntedMapper();

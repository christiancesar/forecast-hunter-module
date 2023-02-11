import { BudgetHunterDTO } from "dtos/BudgetHunterDTO";
import { dateStringToDate } from "shared/helpers/dateStringToDate";
import { amountStringToNumber } from "../../shared/helpers/amountStringToNumber";

const statusBudget = {
  ORÇAMENTO: "budget",
  FATURADO: "billed",
  CANCELADO: "canceled",
  DEVOLVIDO: "returned",
  VENDA: "sold",
};
class BudgetHunterMapper {
  toDomain(budgets: BudgetHunterDTO[]) {
    return budgets.map((budget) => {
      const customerPhones = [budget.Fone, budget.Fone2, budget.Celular];

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
        items: [],
        billedAt: dateStringToDate(budget.DtFatur),
        soldAt: dateStringToDate(budget.DtVenda),
        registered: dateStringToDate(budget.DtCadastro),
        amount: amountStringToNumber(budget.Vlr),
        status: statusBudget[budget.Situao],
        salesman: budget.Vendedor,
      };
    });
  }
}

export default new BudgetHunterMapper();

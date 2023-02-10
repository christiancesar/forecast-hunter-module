import { BudgetHunterDTO } from "dtos/BudgetHunterDTO";

export default new (class BudgetJsonToDomain {
  toDomain(budgets: BudgetHunterDTO[]) {
    return budgets.map((budget) => {
      return {
        shortId: budget.NroOrc,
        license: budget.Licena,
        customer: {
          name: budget.NomeRazoSocial,
          phone: [budget.Fone, budget.Fone2, budget.Celular],
          email: budget.Email,
          address: {
            street: budget.Endereco,
            number: budget.NroCasa,
            neighborhood: budget.Bairro,
            city: budget.Cidade,
            state: budget.UF,
          },
        },
        items: [],
        total: budget.Vlr,
        date: budget.DtCadastro,
        status: budget.Situao,
        salesman: budget.Vendedor,
        link: budget.link,
      };
    });
  }
})();

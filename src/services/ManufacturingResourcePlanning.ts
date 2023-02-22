import { BudgetDTO } from "src/dtos/domain/BudgetDTO";
import { BudgetItemsDTO } from "src/dtos/domain/BudgetItemsDTO";
import { ProductStockDTO } from "src/dtos/domain/ProductStockDTO";

type ManufacturingResourcePlanningParams = {
  budgets: BudgetDTO[];
  product_stock: ProductStockDTO[];
};

export class ManufacturingResourcePlanning {
  public execute({
    budgets,
    product_stock,
  }: ManufacturingResourcePlanningParams) {
    const budgetBilledFiltered = budgets.filter((budget) => {
      budget.status_budget === "billed";
    });

    const BudgetNotCompleted = budgetBilledFiltered.filter((budget) => {
      budget.status_producer.match(/complete/g);
    });

    const budgetItems: BudgetItemsDTO[] = [];

    BudgetNotCompleted.forEach((budget) => {
      budgetItems.push(...budget.items);
    });

    //Unir produtos iguais
    const budgetItemsFiltered = budgetItems.some((budgetItem) => {});
  }
}

import { createJsonFile } from "@shared/helpers/createJsonFile";
import { BudgetDTO } from "src/dtos/domain/BudgetDTO";
import { BudgetItemsDTO } from "src/dtos/domain/BudgetItemsDTO";
import { ProductStockDTO } from "src/dtos/domain/ProductStockDTO";
import { StillDTO } from "src/dtos/domain/StillDTO";

type ManufacturingResourcePlanningParams = {
  budgets: BudgetDTO[];
  productStock: ProductStockDTO[];
};

type StillGroup = {
  [key: string]: StillDTO[];
};

type StillCount = {
  [key: string]: {
    [key: string]: number;
  };
};
export class ManufacturingResourcePlanning {
  public execute({
    budgets,
    productStock,
  }: ManufacturingResourcePlanningParams) {
    const budgetBilledFiltered = budgets.filter(
      (budget) => budget.status_budget === "billed"
    );

    const budgetNotCompleted = budgetBilledFiltered.filter((budget) => {
      const statusProducerExist = budget.status_producer.match(/\d+/g);

      if (statusProducerExist) {
        const statusProducer = Number(statusProducerExist[0]);

        if (statusProducer < 10) {
          return budget;
        }
      }
    });

    const budgetStill: StillDTO[] = [];
    for (const budget of budgetNotCompleted) {
      if (budget.costs?.still) {
        budgetStill.push(...budget.costs.still);
      }
    }

    const stillGrouped = budgetStill.reduce((stillPrevius, stillCurrent) => {
      const key = stillCurrent["code"];
      if (!stillPrevius[key]) {
        stillPrevius[key] = [] as StillGroup[];
      }
      stillPrevius[key].push(stillCurrent);

      return stillPrevius as StillGroup;
    }, {} as StillGroup);

    const keys = Object.keys(stillGrouped);
    const stillCounted = {};
    for (const key of keys) {
      // console.log(stillGrouped[key]);
      const still = (stillGrouped[key] as StillDTO[]).reduce((acc, obj) => {
        const key = obj["code"];
        if (!acc[key]) {
          acc[key] = [];
        }
        const colorKey = obj["color"];

        if (!acc[key][colorKey]) {
          acc[key][colorKey] = 0;
        }

        acc[key][colorKey] += obj["quantity"];
        return acc;
      }, {} as StillCount);
      Object.assign(stillCounted, still);
    }
    console.log(stillCounted);

    // console.log(stillCounted);
    createJsonFile("still_counted", stillCounted);
  }
}

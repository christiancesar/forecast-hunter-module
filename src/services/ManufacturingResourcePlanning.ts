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

type StillClassified = {
  code: string;
  description: string;
  color: string;
  quantity: number;
  stock: number;
  mrp: number;
  budgets: {
    shortId: number;
    customer: string;
    quantity: number;
  }[];
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

    // const budgetStill: StillDTO[] = [];

    const stillClassified: StillClassified[] = [];
    for (const budget of budgetNotCompleted) {
      if (budget.costs?.still?.length) {
        for (const still of budget.costs.still) {
          const stillClassifiedIndex = stillClassified.findIndex(
            (stillClassified) => {
              // eslint-disable-next-line prettier/prettier
              if ((stillClassified.code === still.code) && (stillClassified.color === still.color)) {
                return stillClassified;
              }
            }
          );

          if (stillClassifiedIndex !== -1) {
            stillClassified[stillClassifiedIndex].quantity += still.quantity;
            stillClassified[stillClassifiedIndex].mrp = 0;
            stillClassified[stillClassifiedIndex].stock = 0;
            stillClassified[stillClassifiedIndex].budgets.push({
              shortId: budget.shortId,
              customer: budget.customer.name,
              quantity: still.quantity,
            });
          } else {
            stillClassified.push({
              code: still.code,
              description: still.description,
              color: still.color,
              quantity: still.quantity,
              stock: 0,
              mrp: 0,
              budgets: [
                {
                  shortId: budget.shortId,
                  customer: budget.customer.name,
                  quantity: still.quantity,
                },
              ],
            });
          }
        }
      }
    }
    const producStockFiltered = productStock.filter((stock) => {
      return stock.type_prodct === "Perfil";
    });

    for (const stock of producStockFiltered) {
      const stillClassifiedIndex = stillClassified.findIndex((still) => {
        // eslint-disable-next-line prettier/prettier
        if ((still.code === stock.code) && (still.color === stock.color)) {
          return still;
        }
      });

      if (stillClassifiedIndex !== -1) {
        const stock_need =
          stillClassified[stillClassifiedIndex].quantity - stock.quantity;

        stillClassified[stillClassifiedIndex].stock = stock.quantity;
        stillClassified[stillClassifiedIndex].mrp =
          stock_need < 0 ? 0 : stock_need;
      }
    }

    createJsonFile(
      "stillClassified",
      stillClassified.sort((a, b) => a.code.localeCompare(b.code))
    );
  }
}

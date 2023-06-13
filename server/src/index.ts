import path from "node:path";
import { BudgetHunter } from "./services/BudgetHunter";
import "dotenv/config";
import fs from "fs";
import BudgetHuntedMapper from "@shared/database/mappers/BudgetHuntedMapper";
import { createJsonFile } from "@shared/helpers/createJsonFile";
import ProductStockHuntedMapper from "@shared/database/mappers/ProductStockHuntedMapper";
import { ProductStockHuntedDTO } from "./dtos/ProductStockHuntedDTO";
import { ManufacturingResourcePlanning } from "./services/ManufacturingResourcePlanning";
import { ProductStockDTO } from "./dtos/domain/ProductStockDTO";
import { BudgetDTO } from "./dtos/domain/BudgetDTO";
import { BudgetHuntedNormalizedService } from "./services/BudgetHuntedNormalizedService";

(async () => {
  // const url = "https://sistema.wvetro.com.br/wvetro/app.wvetro.login";
  // const budgetHunter = new BudgetHunter({
  //   user: process.env.WVETRO_USER,
  //   password: process.env.WVETRO_PASSWORD,
  //   license: process.env.WVETRO_LICENSE,
  //   url,
  // });

  // await budgetHunter.load();
  // await budgetHunter.getBudgets({
  //   filter: {
  //     budgetStatus: "F",
  //     finalDate: "",
  //     initialDate: "",
  //     budgetId: 0,
  //   },
  //   huntPagesQuantity: 1,
  // });

  // const budgetsHunted = await budgetHunter.getBudgetItems();

  const budgetsHuntedFile = fs.readFileSync(
    path.resolve("src", "files", "repositories", "budgets.json"),
    {
      encoding: "utf8",
    }
  );
  const budgetsHunted = JSON.parse(budgetsHuntedFile);

  const budgetHuntedNormalizedService = new BudgetHuntedNormalizedService();
  const budgetsNormalized = await budgetHuntedNormalizedService.execute(
    budgetsHunted
  );

  // const budgetsNormalized = budgetsHunted.map((budget: any) => {
  //   return BudgetHuntedMapper.toDomain(budget);
  // });
  createJsonFile("budgets_normalized", budgetsNormalized);

  // const productStockHunted = await budgetHunter.getProductStock();
  // createJsonFile("product_stock", productStockHunted);

  // const producStockFile = fs.readFileSync("product_stock.json", {
  //   encoding: "utf8",
  // });
  // const producStock = JSON.parse(producStockFile);
  // const producStockNormalized = producStock.map(
  //   (productStock: ProductStockHuntedDTO) => {
  //     return ProductStockHuntedMapper.toDomain(productStock);
  //   }
  // );
  // createJsonFile("product_stock_normalized", producStockNormalized);

  // const mrpService = new ManufacturingResourcePlanning();
  // const budgets = JSON.parse(
  //   fs.readFileSync(
  //     path.resolve("src", "files", "repositories", "budgets_normalized.json"),
  //     {
  //       encoding: "utf8",
  //     }
  //   )
  // ) as BudgetDTO[];

  // const productStock = JSON.parse(
  //   fs.readFileSync(
  //     path.resolve(
  //       "src",
  //       "files",
  //       "repositories",
  //       "product_stock_normalized.json"
  //     ),
  //     {
  //       encoding: "utf8",
  //     }
  //   )
  // ) as ProductStockDTO[];

  // mrpService.execute({
  //   budgets,
  //   productStock,
  // });
})();

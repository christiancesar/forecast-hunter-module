import { BudgetHunter } from "./services/BudgetHunter";
import "dotenv/config";
import fs from "fs";
import BudgetHuntedMapper from "@shared/database/mappers/BudgetHuntedMapper";
import { createJsonFile } from "@shared/helpers/createJsonFile";
import ProductStockHuntedMapper from "@shared/database/mappers/ProductStockHuntedMapper";
import { ProductStockHuntedDTO } from "./dtos/ProductStockHuntedDTO";

(async () => {
  const url = "https://sistema.wvetro.com.br/wvetro/app.wvetro.login";
  const budgetHunter = new BudgetHunter({
    user: process.env.WVETRO_USER,
    password: process.env.WVETRO_PASSWORD,
    license: process.env.WVETRO_LICENSE,
    url,
  });
  await budgetHunter.load();
  // await budgetHunter.getBudgets();
  // await budgetHunter.getBudgetItems();

  // const budgetsHuntedFile = fs.readFileSync("budgets.json", {
  //   encoding: "utf8",
  // });
  // const budgetsHunted = JSON.parse(budgetsHuntedFile);
  // const budgetsNormalize = budgetsHunted.map((budget: any) => {
  //   return BudgetHuntedMapper.toDomain(budget);
  // });
  // createJsonFile("budgets_normalize", budgetsNormalize);

  const productStockHunted = await budgetHunter.getProductStock();
  createJsonFile("product_stock", productStockHunted);

  const producStockFile = fs.readFileSync("product_stock.json", {
    encoding: "utf8",
  });
  const producStock = JSON.parse(producStockFile);
  const producStockNormalized = producStock.map(
    (productStock: ProductStockHuntedDTO) => {
      return ProductStockHuntedMapper.toDomain(productStock);
    }
  );
  createJsonFile("product_stock_normalized", producStockNormalized);
})();

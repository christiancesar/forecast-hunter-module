import { BudgetHunter } from "./services/BudgetHunter";
import "dotenv/config";
import fs from "fs";
import BudgetHuntedMapper from "@shared/database/mappers/BudgetHuntedMapper";
import { createJsonFile } from "@shared/helpers/createJsonFile";

(async () => {
  // const url = "https://sistema.wvetro.com.br/wvetro/app.wvetro.login";
  // const budgetHunter = new BudgetHunter({
  //   user: process.env.WVETRO_USER,
  //   password: process.env.WVETRO_PASSWORD,
  //   license: process.env.WVETRO_LICENSE,
  //   url,
  // });
  // await budgetHunter.load();
  // await budgetHunter.getBudgets();
  // await budgetHunter.getBudgetItems();

  const budgetsHuntedFile = fs.readFileSync("budgets.json", {
    encoding: "utf8",
  });
  const budgetsHunted = JSON.parse(budgetsHuntedFile);

  const budgetsNormalize = budgetsHunted.map((budget: any) => {
    return BudgetHuntedMapper.toDomain(budget);
  });

  createJsonFile("budgetsNormalize", budgetsNormalize);
})();

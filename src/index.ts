import { BudgetHunter } from "./BudgetHunter";
import "dotenv/config";

(async () => {
  const url = "https://sistema.wvetro.com.br/wvetro/app.wvetro.login";
  const budgetHunter = new BudgetHunter({
    user: process.env.WVETRO_USER,
    password: process.env.WVETRO_PASSWORD,
    license: process.env.WVETRO_LICENSE,
    url,
  });
  await budgetHunter.load();
  await budgetHunter.getBudgets();
  await budgetHunter.getBudgetItems();
})();

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

// (async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();

//   // await page.waitForNavigation();
//   await page.goto("https://sistema.wvetro.com.br/wvetro/app.wvetro.login", {
//     waitUntil: "networkidle2",
//   });

//   await page.setJavaScriptEnabled(false);

//   await page.type("#vLOGIN", process.env.WVETRO_USER! || "INPUT YOUR SETTINGS");

//   await page.type(
//     "#vSENHA",
//     process.env.WVETRO_PASSWORD! || "INPUT YOUR SETTINGS"
//   );

//   await page.type(
//     "#vLICENCAIDAUX",
//     process.env.WVETRO_LICENSE! || "INPUT YOUR SETTINGS"
//   );

//   await page.setJavaScriptEnabled(true);

//   await page.click("#ENTRAR");

//   await page.waitForNavigation({
//     waitUntil: "networkidle0",
//   });

//   await page.waitForSelector("#btn_orcamentoview");

//   await page.click("#btn_orcamentoview");

//   await page.waitForNavigation({
//     waitUntil: "networkidle2",
//   });

//   await page.waitForSelector(".first");

//   await page.click(".first");

//   // get pages number
//   await page.waitForSelector(".btn.btn-primary.dropdown-toggle");

//   const pagesTotal = await page.evaluate(() => {
//     const buttonElementTextValue = (
//       document.querySelector(".btn.btn-primary.dropdown-toggle") as HTMLElement
//     ).innerText.match(/(\d+)(?!.*\d)/g);

//     return buttonElementTextValue ? Number(buttonElementTextValue[0]) : 0;
//   });

//   const budgetsRepository = [];

//   for (let pageNumber = 0; pageNumber < 1; pageNumber++) {
//     // get budgets in table and normalize data
//     let budgets = [];

//     budgets = await page.evaluate(() => {
//       //GET HEADERS VALUES
//       const tHead = document.querySelector("thead");
//       const tRow = tHead!.childNodes;

//       const headValuesArray = [];

//       for (
//         let headIndex = 0;
//         headIndex < tRow[0].childNodes.length;
//         headIndex++
//       ) {
//         headValuesArray.push(
//           (tRow[0].childNodes[headIndex] as HTMLElement).innerText
//         );
//       }

//       headValuesArray.push("link");

//       const newValues = headValuesArray.map((value) => {
//         return value.replace(/[^A-Z0-9]+/gi, "");
//       });

//       //GET TABLE BODY VALUES
//       const budgetValuesArray = [];

//       const tBody = document.querySelector("#GridContainerTbl tbody");
//       const tRowBody = tBody!.childNodes;

//       let customerCaunt = 0;

//       for (
//         let rowBodyIndex = 0;
//         rowBodyIndex < tRowBody.length;
//         rowBodyIndex++
//       ) {
//         const tCollumnBody = tRowBody[rowBodyIndex].childNodes;
//         const collumnData = [];

//         for (
//           let collumnBodyIndex = 0;
//           collumnBodyIndex < tCollumnBody.length;
//           collumnBodyIndex++
//         ) {
//           collumnData.push(
//             (tCollumnBody[collumnBodyIndex] as HTMLElement).innerText
//           );
//         }

//         customerCaunt++;

//         const linkElement = (
//           document.querySelector(
//             `td>p>span#span_CLIENTENOMERAZAO_${customerCaunt
//               .toString()
//               .padStart(4, "0")}>a`
//           ) as HTMLAnchorElement
//         ).href;

//         collumnData.push(linkElement);

//         budgetValuesArray.push(collumnData);
//       }

//       //eslint-disable-next-line
//       let budgetsValuesFmt = [];

//       for (
//         let bodyValuesIndex = 0;
//         bodyValuesIndex < budgetValuesArray.length;
//         bodyValuesIndex++
//       ) {
//         let budget = {};

//         for (
//           let index = 0;
//           index < budgetValuesArray[bodyValuesIndex].length;
//           index++
//         ) {
//           const valuesFmt = {
//             [newValues[index]]: budgetValuesArray[bodyValuesIndex][index],
//           };

//           budget = {
//             ...budget,
//             ...valuesFmt,
//           };
//         }

//         budgetsValuesFmt.push(budget);
//       }

//       return budgetsValuesFmt;
//     });

//     budgetsRepository.push(...budgets);

//     await page.waitForSelector(".next");
//     await page.click(".next", { delay: 2000 });

//     await page.waitForSelector("#GridContainerDiv");
//   }

//   console.log(budgetsRepository);
//   console.log(budgetsRepository.length);

//   fs.writeFile(
//     "budgets.json",
//     JSON.stringify(budgetsRepository),
//     { encoding: "utf8" },
//     (err) => {
//       console.log(err);
//     }
//   );

//   // await browser.close();
// })();

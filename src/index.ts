import puppeteer from "puppeteer";
import "dotenv/config";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // await page.waitForNavigation();
  await page.goto("https://sistema.wvetro.com.br/wvetro/app.wvetro.login", {
    waitUntil: "networkidle2",
  });

  await page.setJavaScriptEnabled(false);

  await page.type("#vLOGIN", process.env.WVETRO_USER!);

  await page.type("#vSENHA", process.env.WVETRO_PASSWORD!);

  await page.type("#vLICENCAIDAUX", process.env.WVETRO_LICENCE!);

  await page.setJavaScriptEnabled(true);

  await page.click("#ENTRAR");

  await page.waitForNavigation({
    waitUntil: "networkidle0",
  });

  await page.waitForSelector("#btn_orcamentoview");

  await page.click("#btn_orcamentoview");

  await page.waitForNavigation({
    waitUntil: "networkidle2",
  });

  await page.waitForSelector(".first");

  await page.click(".first");

  // get pages number
  await page.waitForSelector(".btn.btn-primary.dropdown-toggle");

  const pagesTotal = await page.evaluate(() => {
    const buttonElementTextValue = (
      document.querySelector(".btn.btn-primary.dropdown-toggle") as HTMLElement
    ).innerText.match(/(\d+)(?!.*\d)/g);

    console.log(buttonElementTextValue ? Number(buttonElementTextValue[0]) : 0);

    return buttonElementTextValue ? Number(buttonElementTextValue[0]) : 0;
  });

  const budgetsRepository = [];

  for (let pageNumber = 0; pageNumber < 5; pageNumber++) {
    // get budgets in table and normalize data
    let budgets = [];

    budgets = await page.evaluate(() => {
      const tHead = document.querySelector("thead");
      const tRow = tHead!.childNodes;

      const headValuesArray = [];

      for (
        let headIndex = 0;
        headIndex < tRow[0].childNodes.length;
        headIndex++
      ) {
        headValuesArray.push(
          (tRow[0].childNodes[headIndex] as HTMLElement).innerText
        );
      }
      const newValues = headValuesArray.map((value) => {
        return value.replace(/[^A-Z0-9]+/gi, "");
      });

      const budgetValuesArray = [];

      const tBody = document.querySelector("#GridContainerTbl tbody");
      const tRowBody = tBody!.childNodes;

      for (
        let rowBodyIndex = 0;
        rowBodyIndex < tRowBody.length;
        rowBodyIndex++
      ) {
        const tCollumnBody = tRowBody[rowBodyIndex].childNodes;
        const collumnData = [];
        for (
          let collumnBodyIndex = 0;
          collumnBodyIndex < tCollumnBody.length;
          collumnBodyIndex++
        ) {
          collumnData.push(
            (tCollumnBody[collumnBodyIndex] as HTMLElement).innerText
          );
        }
        budgetValuesArray.push(collumnData);
      }

      //eslint-disable-next-line
      let budgetsValuesFmt = [];

      for (
        let bodyValuesIndex = 0;
        bodyValuesIndex < budgetValuesArray.length;
        bodyValuesIndex++
      ) {
        let budget = {};

        for (
          let index = 0;
          index < budgetValuesArray[bodyValuesIndex].length;
          index++
        ) {
          const valuesFmt = {
            [newValues[index]]: budgetValuesArray[bodyValuesIndex][index],
          };
          budget = {
            ...budget,
            ...valuesFmt,
          };
        }

        budgetsValuesFmt.push(budget);
      }

      return budgetsValuesFmt;
    });

    budgetsRepository.push(...budgets);

    await page.waitForSelector(".next");
    await page.click(".next", { delay: 2000 });

    await page.waitForSelector("#GridContainerDiv");
  }

  console.log(budgetsRepository);
  console.log(budgetsRepository.length);

  fs.writeFile(
    "budgets.json",
    JSON.stringify(budgetsRepository),
    { encoding: "utf8" },
    (err) => {
      console.log(err);
    }
  );

  // await browser.close();
})();

import puppeteer from "puppeteer";
import "dotenv/config";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // await page.waitForNavigation();
  await page.goto("https://sistema.wvetro.com.br/wvetro/app.wvetro.login", {
    waitUntil: "networkidle2",
  });

  console.log(process.env.WVETRO_USER);

  await page.setJavaScriptEnabled(false);

  await page.type("#vLOGIN", process.env.WVETRO_USER!);

  await page.type("#vSENHA", process.env.WVETRO_PASSWORD!);

  await page.type("#vLICENCAIDAUX", process.env.WVETRO_LICENCE!);

  await page.setJavaScriptEnabled(true);

  await page.click("#ENTRAR");

  await page.waitForNavigation({
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#btn_orcamentoview");

  await page.click("#btn_orcamentoview");

  await page.waitForNavigation({
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#GridContainerDiv");

  const budgets = await page.evaluate(() => {
    const tHead = document.querySelector("thead");
    const tRow = tHead!.childNodes;

    // console.log(tRow[0].childNodes.length)
    const headValuesArray = [];

    for (
      let headIndex = 0;
      headIndex < tRow[0].childNodes.length;
      headIndex++
    ) {
      //     console.log(tRow[0].childNodes[headIndex].innerText)
      headValuesArray.push(
        (tRow[0].childNodes[headIndex] as HTMLElement).innerText
      );
    }
    const newValues = headValuesArray.map((value) => {
      return value.replace(/[^A-Z0-9]+/gi, "");
      //   console.log(value.replace('.', ''))
    });

    // console.log(headValuesArray);

    const budgetValuesArray = [];
    const tBody = document.querySelector("#GridContainerTbl tbody");
    const tRowBody = tBody!.childNodes;
    // console.log(tRowBody)

    for (let rowBodyIndex = 0; rowBodyIndex < tRowBody.length; rowBodyIndex++) {
      const tCollumnBody = tRowBody[rowBodyIndex].childNodes;
      //   console.log(tCollumnBody)
      const collumnData = [];
      for (
        let collumnBodyIndex = 0;
        collumnBodyIndex < tCollumnBody.length;
        collumnBodyIndex++
      ) {
        //     console.log(tCollumnBody[collumnBodyIndex].innerText)

        collumnData.push(
          (tCollumnBody[collumnBodyIndex] as HTMLElement).innerText
        );
        //     console.log(collumnData)
      }
      //   console.log(collumnData)
      budgetValuesArray.push(collumnData);
    }

    // console.log(budgetValuesArray);
    const budgets = [];

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

      budgets.push(budget);
    }

    // console.log(budgets);
    return budgets;
  });

  console.log(budgets);

  // await browser.close();
})();

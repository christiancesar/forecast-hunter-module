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

  await page.waitForNavigation();

  await page.click("#btn_orcamentoview");

  // // Type into search box.
  // await page.type(".devsite-search-field", "Headless Chrome");

  // // Wait for suggest overlay to appear and click "show all results".
  // const allResultsSelector = ".devsite-suggest-all-results";
  // await page.waitForSelector(allResultsSelector);
  // await page.click(allResultsSelector);

  // // Wait for the results page to load and display the results.
  // const resultsSelector = ".gsc-results .gs-title";
  // await page.waitForSelector(resultsSelector);

  // // Extract the results from the page.
  // const links = await page.evaluate((resultsSelector) => {
  //   return [...document.querySelectorAll(resultsSelector)].map((anchor) => {
  //     const title = anchor.textContent.split("|")[0].trim();
  //     return `${title} - ${anchor.href}`;
  //   });
  // }, resultsSelector);

  // // Print all the files.
  // console.log(links.join("\n"));

  // await browser.close();
})();

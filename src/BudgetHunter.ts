import { BudgetItemsHuntedInMemoryRepository } from "./database/InMemory/Hunted/BudgetItemsHuntedInMemoryRepository";
import { BudgetsHuntedInMemoryRepository } from "./database/InMemory/Hunted/BudgetsHuntedInMemoryRepository";
import "dotenv/config";
import { BudgetItemHuntedDTO } from "./dtos/BudgetItemsHunterDTO";
import puppeteer, { Browser, Page } from "puppeteer";
import { BudgetHunterDTO } from "./dtos/BudgetHunterDTO";

type BudgetHunterParams = {
  user: string | undefined;
  password: string | undefined;
  license: string | undefined;
  url: string;
};

export class BudgetHunter {
  private user: string | undefined;
  private password: string | undefined;
  private license: string | undefined;
  private url: string;
  private browser: Browser;
  private page: Page;

  private budgetsHuntedInMemoryRepository: BudgetsHuntedInMemoryRepository;
  private budgetItemsHuntedInMemoryRepository: BudgetItemsHuntedInMemoryRepository;

  constructor({ user, password, license, url }: BudgetHunterParams) {
    this.user = user;
    this.password = password;
    this.license = license;
    this.url = url;
    this.browser = {} as Browser;
    this.page = {} as Page;

    this.budgetsHuntedInMemoryRepository =
      new BudgetsHuntedInMemoryRepository();
    this.budgetItemsHuntedInMemoryRepository =
      new BudgetItemsHuntedInMemoryRepository();
  }

  public async load(): Promise<void> {
    this.browser = await puppeteer.launch({ headless: false, devtools: true });
    this.page = await this.browser.newPage();
  }

  public async getBudgets(): Promise<void> {
    // await page.waitForNavigation();
    await this.page.goto(this.url, {
      waitUntil: "networkidle2",
    });

    await this.page.setJavaScriptEnabled(false);

    await this.page.type("#vLOGIN", this.user || "INPUT YOUR SETTINGS");

    await this.page.type("#vSENHA", this.password || "INPUT YOUR SETTINGS");

    await this.page.type(
      "#vLICENCAIDAUX",
      this.license || "INPUT YOUR SETTINGS"
    );

    await this.page.setJavaScriptEnabled(true);

    await this.page.click("#ENTRAR");

    await this.page.waitForNavigation({
      waitUntil: "networkidle0",
    });

    await this.page.waitForSelector("#btn_orcamentoview");

    await this.page.click("#btn_orcamentoview");

    await this.page.waitForNavigation({
      waitUntil: "networkidle2",
    });

    await this.page.waitForSelector(".first");

    await this.page.click(".first");

    // get pages number
    await this.page.waitForSelector(".btn.btn-primary.dropdown-toggle");

    const pagesTotal = await this.page.evaluate(() => {
      const buttonElementTextValue = (
        document.querySelector(
          ".btn.btn-primary.dropdown-toggle"
        ) as HTMLElement
      ).innerText.match(/(\d+)(?!.*\d)/g);

      return buttonElementTextValue ? Number(buttonElementTextValue[0]) : 0;
    });

    const budgetsHunted: BudgetHunterDTO[] = [];

    for (let pageNumber = 0; pageNumber < 1; pageNumber++) {
      // get budgets in table and normalize data
      let budgets: BudgetHunterDTO[] = [];

      budgets = await this.page.evaluate((): BudgetHunterDTO[] => {
        //GET HEADERS VALUES
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

        headValuesArray.push("link");

        const newValues = headValuesArray.map((value) => {
          return value.replace(/[^A-Z0-9]+/gi, "");
        });

        //GET TABLE BODY VALUES
        const budgetValuesArray = [];

        const tBody = document.querySelector("#GridContainerTbl tbody");
        const tRowBody = tBody!.childNodes;

        let customerCaunt = 0;

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

          customerCaunt++;

          const linkElement = (
            document.querySelector(
              `td>p>span#span_CLIENTENOMERAZAO_${customerCaunt
                .toString()
                .padStart(4, "0")}>a`
            ) as HTMLAnchorElement
          ).href;

          collumnData.push(linkElement);

          budgetValuesArray.push(collumnData);
        }

        //eslint-disable-next-line
        let budgetsValuesFmt: BudgetHunterDTO[] = [];

        for (
          let bodyValuesIndex = 0;
          bodyValuesIndex < budgetValuesArray.length;
          bodyValuesIndex++
        ) {
          let budget = {} as BudgetHunterDTO;

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

      budgetsHunted.push(...budgets);

      await this.page.waitForSelector(".next");
      await this.page.click(".next", { delay: 2000 });

      await this.page.waitForSelector("#GridContainerDiv");
    }

    await this.budgetsHuntedInMemoryRepository.saveAll(budgetsHunted);

    // console.log(budgetsHunted);
    // console.log(budgetsHunted.length);

    // fs.writeFile(
    //   "budgets.json",
    //   JSON.stringify(budgetsHunted),
    //   { encoding: "utf8" },
    //   (err) => {
    //     console.log(err);
    //   }
    // );

    // await browser.close();
  }

  public async getBudgetItems(): Promise<void> {
    const budgetsHunter = await this.budgetsHuntedInMemoryRepository.findAll();

    console.log("Start hunting budget items...");

    const budgetItemsHuntedRepository = [] as BudgetItemHuntedDTO[];

    for (let index = 0; index < budgetsHunter.length; index++) {
      await this.page.goto(budgetsHunter[index].link, {
        waitUntil: "networkidle0",
      });

      await this.page.waitForSelector("#W0085W0002GridContainerTbl");

      const budgetsItemsHunted = await this.page
        .evaluate(() => {
          // eslint-disable-next-line no-debugger
          // debugger;

          const budgetItemsTableHeadElement = document.querySelectorAll(
            ".Table table#W0085W0002GridContainerTbl thead>tr>th"
          );

          const budgetItemsTableHeadNames = [] as string[];

          budgetItemsTableHeadElement.forEach((spanElement, index) => {
            let value;

            if ((spanElement as HTMLElement).innerText.trim() === "") {
              value = "void";
            } else {
              value = (spanElement as HTMLElement).innerText.replace(
                /[^A-Z0-9]+/gi,
                ""
              );
            }

            budgetItemsTableHeadNames.push(`${value}${index}`);
          });

          const budgetItems = (
            document.querySelector(
              "#W0085W0002GridContainerDataV"
            ) as HTMLInputElement
          ).value;

          const budgetItemsData = JSON.parse(budgetItems);

          const budgetItemsHunted: BudgetItemHuntedDTO[] = [];

          budgetItemsData.forEach((budgetItemsArray: BudgetItemHuntedDTO[]) => {
            let budgetItemsNormalizedData = {} as BudgetItemHuntedDTO;

            budgetItemsArray.forEach((element, index) => {
              const budgetItemsNormalizedValue = {
                [budgetItemsTableHeadNames[index]]: element,
              };

              budgetItemsNormalizedData = {
                ...budgetItemsNormalizedData,
                ...budgetItemsNormalizedValue,
              };
            });

            budgetItemsHunted.push(budgetItemsNormalizedData);
          });

          return budgetItemsHunted;
        })
        .catch((err) => {
          console.log(err);
        });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      budgetItemsHuntedRepository.push(...budgetsItemsHunted!);
    }
    console.log("Finished hunting budget items...");

    await this.budgetItemsHuntedInMemoryRepository.saveAll(
      budgetItemsHuntedRepository
    );

    console.log("Save budget items on database...");
  }

  public async getCost() {
    //Acessando conferir valores
    const cardGreen = document.querySelector(".panel.panel-green>a");

    //Pegando valores de "Custo"
    const costs = document.querySelectorAll(
      "#W0046TBLFINANCEIROR_0002 .row span"
    );
    const costsObeject = {
      sold: (costs[0] as HTMLElement).innerText,
      cost: (costs[1] as HTMLElement).innerText,
      difference: (costs[2] as HTMLElement).innerText,
      percent: (costs[3] as HTMLElement).innerText,
    };

    //Valores dos Materiais Utilizados
    //Perfil
    const still = document.querySelectorAll(
      "#W0046W0096TBLFINANCEIRO_0001 span"
    );
    const stillCost = {
      sold: (still[0] as HTMLElement).innerText,
      cost: (still[1] as HTMLElement).innerText,
      difference: (still[2] as HTMLElement).innerText,
      percent: (still[3] as HTMLElement).innerText,
    };

    //Acessorios
    const attachment = document.querySelectorAll(
      "#W0046W0096TBLFINANCEIRO_0002 span"
    );
    const attachmentCost = {
      sold: (attachment[0] as HTMLElement).innerText,
      cost: (attachment[1] as HTMLElement).innerText,
      difference: (attachment[2] as HTMLElement).innerText,
      percent: (attachment[3] as HTMLElement).innerText,
    };

    //Vidros
    const glass = document.querySelectorAll(
      "#W0046W0096TBLFINANCEIRO_0003 span"
    );
    const glassCost = {
      sold: (glass[0] as HTMLElement).innerText,
      cost: (glass[1] as HTMLElement).innerText,
      difference: (glass[2] as HTMLElement).innerText,
      percent: (glass[3] as HTMLElement).innerText,
    };
  }

  public async getStill() {
    const stillTableHeadElement = document.querySelectorAll(
      ".Table table#W0054GridContainerTbl thead>tr>th>span"
    );

    const stillTableHeadNames = [] as string[];

    stillTableHeadElement.forEach((spanElement) => {
      if ((spanElement as HTMLElement).innerText !== "") {
        stillTableHeadNames.push(
          (spanElement as HTMLElement).innerText.replace(/[^A-Z0-9]+/gi, "")
        );
      }
    });

    const stillRowsElement = document.querySelectorAll(
      ".Table table#W0054GridContainerTbl tbody>tr.GridWithTotalizer"
    );

    const stillData = [] as any[];

    stillRowsElement.forEach((rowElement) => {
      const stillValues = [] as any[];
      const stillSpanElement = rowElement.querySelectorAll("td>p>span");

      stillSpanElement.forEach((element) => {
        stillValues.push((element as HTMLElement).innerText);
      });

      stillData.push(stillValues);
    });

    const stillRepository = [] as any;

    stillData.forEach((stillArray) => {
      let stillNormalizedData = {};

      stillArray.forEach((element: HTMLElement, index: number) => {
        const stillNormalizedValue = {
          [stillTableHeadNames[index]]: element,
        };

        stillNormalizedData = {
          ...stillNormalizedData,
          ...stillNormalizedValue,
        };
      });

      stillRepository.push(stillNormalizedData);
    });

    /*
    [
      {
        "Id": "62",
        "CDIGO": "SU271",
        "SEUCDIGO": "",
        "NOME": "TRILHO PORTA",
        "COR": "BRANCO",
        "PESO": "2,588PESO",
        "Peso": "2,588",
        "ML": "7,438",
        "CUSTOKGML": "42,01",
        "VLRCUSTO": "108,71",
        "VLRVENDA": "206,56",
        "DIFERENA": "97,85",
        "VLRTRAT": "0,00",
        "MLSOBRA": "4,552",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "1,584",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "126,41",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "2",
        "ID": "23865699",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "32",
        "CDIGO": "SU245",
        "SEUCDIGO": "",
        "NOME": "MONTANTE LATERAL DA FOLHA",
        "COR": "BRANCO",
        "PESO": "3,242PESO",
        "Peso": "3,242",
        "ML": "4,712",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "136,16",
        "VLRVENDA": "258,70",
        "DIFERENA": "122,54",
        "VLRTRAT": "0,00",
        "MLSOBRA": "1,278",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,879",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "70,17",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "1",
        "ID": "23865685",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "33",
        "CDIGO": "SU280",
        "SEUCDIGO": "",
        "NOME": "MONTANTE LATERAL DA FOLHA | REFORÇO ABA",
        "COR": "BRANCO",
        "PESO": "4,740PESO",
        "Peso": "4,740",
        "ML": "4,712",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "199,09",
        "VLRVENDA": "378,27",
        "DIFERENA": "179,18",
        "VLRTRAT": "0,00",
        "MLSOBRA": "0,000",
        "MLSUCATA": "1,278",
        "PESOSOBRA": "0,000",
        "PESOSUCATA": "1,286",
        "VLRSOBRA": "0,00",
        "VLRSUCATA": "102,60",
        "QTBARRAS": "1",
        "ID": "23865688",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "34",
        "CDIGO": "SU291",
        "SEUCDIGO": "",
        "NOME": "MATA JUNTA CENTRAL",
        "COR": "BRANCO",
        "PESO": "21,123PESO",
        "Peso": "21,123",
        "ML": "86,212",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "887,13",
        "VLRVENDA": "1.685,54",
        "DIFERENA": "798,41",
        "VLRTRAT": "0,00",
        "MLSOBRA": "15,518",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,802",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "303,39",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "17",
        "ID": "23865689",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "35",
        "CDIGO": "SU242",
        "SEUCDIGO": "",
        "NOME": "MONTANTE MÃO DE AMIGO EXTERNO",
        "COR": "BRANCO",
        "PESO": "3,501PESO",
        "Peso": "3,501",
        "ML": "4,712",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "147,04",
        "VLRVENDA": "279,38",
        "DIFERENA": "132,34",
        "VLRTRAT": "0,00",
        "MLSOBRA": "1,278",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,950",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "75,77",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "1",
        "ID": "23865697",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "36",
        "CDIGO": "SU243",
        "SEUCDIGO": "",
        "NOME": "MONTANTE MÃO DE AMIGO INTERNO",
        "COR": "BRANCO",
        "PESO": "3,355PESO",
        "Peso": "3,355",
        "ML": "4,712",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "140,91",
        "VLRVENDA": "267,72",
        "DIFERENA": "126,81",
        "VLRTRAT": "0,00",
        "MLSOBRA": "1,278",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,910",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "72,61",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "1",
        "ID": "23865698",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "39",
        "CDIGO": "SU250",
        "SEUCDIGO": "",
        "NOME": "MONTANTE CENTRAL FOLHA / CORRER",
        "COR": "BRANCO",
        "PESO": "38,540PESO",
        "Peso": "38,540",
        "ML": "52,364",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.618,68",
        "VLRVENDA": "3.075,49",
        "DIFERENA": "1.456,81",
        "VLRTRAT": "0,00",
        "MLSOBRA": "7,466",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "5,495",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "438,50",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "10",
        "ID": "23865710",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "44",
        "CDIGO": "SU004",
        "SEUCDIGO": "",
        "NOME": "MARCO BANDEIRA E PEITORIL / CORRER 2",
        "COR": "BRANCO",
        "PESO": "6,862PESO",
        "Peso": "6,862",
        "ML": "13,614",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "288,18",
        "VLRVENDA": "547,55",
        "DIFERENA": "259,37",
        "VLRTRAT": "0,00",
        "MLSOBRA": "4,356",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "2,195",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "175,19",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "3",
        "ID": "23865622",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "46",
        "CDIGO": "SU079",
        "SEUCDIGO": "",
        "NOME": "MARCO",
        "COR": "BRANCO",
        "PESO": "4,204PESO",
        "Peso": "4,204",
        "ML": "12,328",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "176,57",
        "VLRVENDA": "335,47",
        "DIFERENA": "158,90",
        "VLRTRAT": "0,00",
        "MLSOBRA": "5,597",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "1,909",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "152,30",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "3",
        "ID": "23865648",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "49",
        "CDIGO": "SU111",
        "SEUCDIGO": "",
        "NOME": "MONTANTE FOLHA DE GIRO",
        "COR": "BRANCO",
        "PESO": "12,783PESO",
        "Peso": "12,783",
        "ML": "19,974",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "536,90",
        "VLRVENDA": "1.020,11",
        "DIFERENA": "483,21",
        "VLRTRAT": "0,00",
        "MLSOBRA": "3,885",
        "MLSUCATA": "0,081",
        "PESOSOBRA": "2,486",
        "PESOSUCATA": "0,052",
        "VLRSOBRA": "198,41",
        "VLRSUCATA": "4,14",
        "QTBARRAS": "4",
        "ID": "23865667",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "51",
        "CDIGO": "SU081",
        "SEUCDIGO": "",
        "NOME": "MONTANTE / FOLHA",
        "COR": "BRANCO",
        "PESO": "3,402PESO",
        "Peso": "3,402",
        "ML": "8,256",
        "CUSTOKGML": "41,99",
        "VLRCUSTO": "142,86",
        "VLRVENDA": "271,44",
        "DIFERENA": "128,58",
        "VLRTRAT": "0,00",
        "MLSOBRA": "3,684",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "1,518",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "121,12",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "2",
        "ID": "23865650",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "52",
        "CDIGO": "SU082",
        "SEUCDIGO": "",
        "NOME": "TRAVESSA / FOLHA",
        "COR": "BRANCO",
        "PESO": "1,359PESO",
        "Peso": "1,359",
        "ML": "3,556",
        "CUSTOKGML": "41,98",
        "VLRCUSTO": "57,05",
        "VLRVENDA": "108,40",
        "DIFERENA": "51,35",
        "VLRTRAT": "0,00",
        "MLSOBRA": "2,424",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,926",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "73,89",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "1",
        "ID": "23865651",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "54",
        "CDIGO": "SU083",
        "SEUCDIGO": "",
        "NOME": "PINGADEIRA DO MARCO MAXIM-AR",
        "COR": "BRANCO",
        "PESO": "0,510PESO",
        "Peso": "0,510",
        "ML": "3,780",
        "CUSTOKGML": "42,02",
        "VLRCUSTO": "21,43",
        "VLRVENDA": "40,72",
        "DIFERENA": "19,29",
        "VLRTRAT": "0,00",
        "MLSOBRA": "2,200",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,297",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "23,70",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "1",
        "ID": "24464359",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "58",
        "CDIGO": "ME013",
        "SEUCDIGO": "",
        "NOME": "REMATE DE PISO",
        "COR": "BRANCO",
        "PESO": "1,017PESO",
        "Peso": "1,017",
        "ML": "3,794",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "42,71",
        "VLRVENDA": "81,14",
        "DIFERENA": "38,43",
        "VLRTRAT": "0,00",
        "MLSOBRA": "2,201",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,590",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "47,07",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "1",
        "ID": "23865601",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "60",
        "CDIGO": "SU225",
        "SEUCDIGO": "",
        "NOME": "TRAVESSA INFERIOR DA FOLHA",
        "COR": "BRANCO",
        "PESO": "6,749PESO",
        "Peso": "6,749",
        "ML": "6,824",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "283,46",
        "VLRVENDA": "538,57",
        "DIFERENA": "255,11",
        "VLRTRAT": "0,00",
        "MLSOBRA": "5,136",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "5,080",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "405,34",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "2",
        "ID": "23865681",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "30",
        "CDIGO": "SU102",
        "SEUCDIGO": "",
        "NOME": "BAGUETE",
        "COR": "BRANCO",
        "PESO": "34,149PESO",
        "Peso": "34,149",
        "ML": "307,662",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.434,32",
        "VLRVENDA": "2.725,20",
        "DIFERENA": "1.290,88",
        "VLRTRAT": "0,00",
        "MLSOBRA": "8,758",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,972",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "77,58",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "53",
        "ID": "23865662",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "29",
        "CDIGO": "SU053",
        "SEUCDIGO": "",
        "NOME": "TRAVESSA DA FOLHA",
        "COR": "BRANCO",
        "PESO": "29,763PESO",
        "Peso": "29,763",
        "ML": "58,704",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.250,04",
        "VLRVENDA": "2.375,08",
        "DIFERENA": "1.125,04",
        "VLRTRAT": "0,00",
        "MLSOBRA": "6,616",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,354",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "267,67",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "11",
        "ID": "23865644",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "24",
        "CDIGO": "SU041",
        "SEUCDIGO": "",
        "NOME": "MONTANTE MÃO DE AMIGO",
        "COR": "BRANCO",
        "PESO": "26,549PESO",
        "Peso": "26,549",
        "ML": "52,364",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.115,04",
        "VLRVENDA": "2.118,58",
        "DIFERENA": "1.003,54",
        "VLRTRAT": "0,00",
        "MLSOBRA": "7,466",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,785",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "302,06",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "10",
        "ID": "23865637",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "23",
        "CDIGO": "SU040",
        "SEUCDIGO": "",
        "NOME": "MONTANTE MAO-DE-AMIGO INTERNO",
        "COR": "BRANCO",
        "PESO": "25,135PESO",
        "Peso": "25,135",
        "ML": "52,364",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.055,65",
        "VLRVENDA": "2.005,75",
        "DIFERENA": "950,10",
        "VLRTRAT": "0,00",
        "MLSOBRA": "7,466",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,584",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "285,98",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "10",
        "ID": "23865636",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "22",
        "CDIGO": "SU039",
        "SEUCDIGO": "",
        "NOME": "MONTANTE DE FOLHA",
        "COR": "BRANCO",
        "PESO": "27,229PESO",
        "Peso": "27,229",
        "ML": "52,364",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.143,63",
        "VLRVENDA": "2.172,90",
        "DIFERENA": "1.029,27",
        "VLRTRAT": "0,00",
        "MLSOBRA": "7,466",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,882",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "309,81",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "10",
        "ID": "23865635",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "21",
        "CDIGO": "SU007",
        "SEUCDIGO": "",
        "NOME": "MARCO LATERAL / CORRER 2",
        "COR": "BRANCO",
        "PESO": "24,995PESO",
        "Peso": "24,995",
        "ML": "65,432",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.049,79",
        "VLRVENDA": "1.994,61",
        "DIFERENA": "944,82",
        "VLRTRAT": "0,00",
        "MLSOBRA": "6,358",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "2,429",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "193,81",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "12",
        "ID": "23865625",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "19",
        "CDIGO": "SU002",
        "SEUCDIGO": "",
        "NOME": "MARCO INFERIOR 2 PLANOS",
        "COR": "BRANCO",
        "PESO": "22,818PESO",
        "Peso": "22,818",
        "ML": "32,973",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "958,33",
        "VLRVENDA": "1.820,83",
        "DIFERENA": "862,50",
        "VLRTRAT": "0,00",
        "MLSOBRA": "2,942",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "2,036",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "162,46",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "6",
        "ID": "23865620",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "18",
        "CDIGO": "SU001",
        "SEUCDIGO": "",
        "NOME": "MARCO SUPERIOR / CORRER 2",
        "COR": "BRANCO",
        "PESO": "27,960PESO",
        "Peso": "27,960",
        "ML": "36,692",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.174,28",
        "VLRVENDA": "2.231,15",
        "DIFERENA": "1.056,87",
        "VLRTRAT": "0,00",
        "MLSOBRA": "5,218",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,976",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "317,29",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "7",
        "ID": "23865619",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "17",
        "CDIGO": "MP347",
        "SEUCDIGO": "",
        "NOME": "ARREMATE / FACE INTERNA",
        "COR": "BRANCO",
        "PESO": "33,707PESO",
        "Peso": "33,707",
        "ML": "166,862",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.415,66",
        "VLRVENDA": "2.689,74",
        "DIFERENA": "1.274,08",
        "VLRTRAT": "0,00",
        "MLSOBRA": "6,643",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "1,342",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "107,08",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "29",
        "ID": "23865618",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "2",
        "CDIGO": "CL011",
        "SEUCDIGO": "",
        "NOME": "CUNHA",
        "COR": "NATURAL",
        "PESO": "31,425PESO",
        "Peso": "31,425",
        "ML": "98,512",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.319,85",
        "VLRVENDA": "2.507,73",
        "DIFERENA": "1.187,88",
        "VLRTRAT": "0,00",
        "MLSOBRA": "1,608",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,513",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "40,93",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "38",
        "ID": "23865589",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "15",
        "CDIGO": "CM200",
        "SEUCDIGO": "",
        "NOME": "CONTRAMARCO",
        "COR": "NATURAL",
        "PESO": "36,255PESO",
        "Peso": "36,255",
        "ML": "164,806",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "1.522,82",
        "VLRVENDA": "2.893,34",
        "DIFERENA": "1.370,52",
        "VLRTRAT": "0,00",
        "MLSOBRA": "8,699",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "1,914",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "152,72",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "29",
        "ID": "23865595",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "1",
        "CDIGO": "CL006",
        "SEUCDIGO": "CL006",
        "NOME": "CONEXÃO CANTONEIRA",
        "COR": "NATURAL",
        "PESO": "54,773PESO",
        "Peso": "54,773",
        "ML": "49,256",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "2.300,45",
        "VLRVENDA": "4.370,88",
        "DIFERENA": "2.070,43",
        "VLRTRAT": "0,00",
        "MLSOBRA": "0,804",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "0,894",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "71,35",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "19",
        "ID": "23865588",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "12",
        "CDIGO": "FC-227",
        "SEUCDIGO": "FC-227",
        "NOME": "PINGADEIRA QUADRO MOVEL",
        "COR": "PRETO",
        "PESO": "137,374PESO",
        "Peso": "137,374",
        "ML": "216,678",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "5.769,71",
        "VLRVENDA": "10.962,44",
        "DIFERENA": "5.192,73",
        "VLRTRAT": "0,00",
        "MLSOBRA": "10,077",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "6,389",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "509,83",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "38",
        "ID": "24524508",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "11",
        "CDIGO": "FC-261",
        "SEUCDIGO": "",
        "NOME": "FOLHA STRUTURAL GLAZING",
        "COR": "PRETO",
        "PESO": "560,186PESO",
        "Peso": "560,186",
        "ML": "1009,344",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "23.527,82",
        "VLRVENDA": "44.702,84",
        "DIFERENA": "21.175,02",
        "VLRTRAT": "0,00",
        "MLSOBRA": "89,976",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "49,937",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "3.984,95",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "184",
        "ID": "23866728",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "10",
        "CDIGO": "FC-243",
        "SEUCDIGO": "",
        "NOME": "COLUNA LATERAL",
        "COR": "PRETO",
        "PESO": "53,517PESO",
        "Peso": "53,517",
        "ML": "48,300",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "2.247,69",
        "VLRVENDA": "4.270,60",
        "DIFERENA": "2.022,91",
        "VLRTRAT": "0,00",
        "MLSOBRA": "5,660",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "6,271",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "500,45",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "9",
        "ID": "23866727",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "6",
        "CDIGO": "FC-228",
        "SEUCDIGO": "",
        "NOME": "FOLHA COM ABA",
        "COR": "PRETO",
        "PESO": "159,710PESO",
        "Peso": "159,710",
        "ML": "268,872",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "6.707,82",
        "VLRVENDA": "12.744,85",
        "DIFERENA": "6.037,03",
        "VLRTRAT": "0,00",
        "MLSOBRA": "5,568",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "3,307",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "263,93",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "46",
        "ID": "23866723",
        "VLRCUSTOTRAT": "0,00"
      },
      {
        "Id": "4",
        "CDIGO": "FC-202",
        "SEUCDIGO": "",
        "NOME": "COLUNA",
        "COR": "PRETO",
        "PESO": "636,713PESO",
        "Peso": "636,713",
        "ML": "349,650",
        "CUSTOKGML": "42,00",
        "VLRCUSTO": "26.741,93",
        "VLRVENDA": "50.809,68",
        "DIFERENA": "24.067,75",
        "VLRTRAT": "0,00",
        "MLSOBRA": "4,055",
        "MLSUCATA": "0,000",
        "PESOSOBRA": "7,384",
        "PESOSUCATA": "0,000",
        "VLRSOBRA": "589,26",
        "VLRSUCATA": "0,00",
        "QTBARRAS": "59",
        "ID": "23866719",
        "VLRCUSTOTRAT": "0,00"
      }
    ]
    */
  }

  public async getAttachment() {
    const attachmentTableHeadElement = document.querySelectorAll(
      ".Table table#W0062GridContainerTbl thead>tr>th>span"
    );

    const attachmentTableHeadNames = [] as any[];

    attachmentTableHeadElement.forEach((spanElement) => {
      if ((spanElement as HTMLElement).innerText !== "") {
        attachmentTableHeadNames.push(
          (spanElement as HTMLElement).innerText.replace(/[^A-Z0-9]+/gi, "")
        );
      }
    });

    const attachmentRowsElement = document.querySelectorAll(
      ".Table table#W0062GridContainerTbl tbody>tr.GridWithTotalizer"
    );

    const attachmentData = [] as any[];

    attachmentRowsElement.forEach((rowElement) => {
      const attachmentValues = [] as any[];
      const attachmentSpanElement = rowElement.querySelectorAll("td>p>span");

      attachmentSpanElement.forEach((element) => {
        attachmentValues.push((element as HTMLElement).innerText);
      });

      attachmentData.push(attachmentValues);
    });

    const attachmentRepository = [];

    attachmentData.forEach((attachmentArray) => {
      let attachmentNormalizedData = {};

      attachmentArray.forEach((element: HTMLElement, index: number) => {
        const attachmentNormalizedValue = {
          [attachmentTableHeadNames[index]]: element,
        };

        attachmentNormalizedData = {
          ...attachmentNormalizedData,
          ...attachmentNormalizedValue,
        };
      });

      attachmentRepository.push(attachmentNormalizedData);
    });

    /*
    [
      {
        "ID": "23865740",
        "CDIGO": "BUC755",
        "SEUCDIGO": "",
        "NOME": "BUCHA DE NYLON P/ FIXAÇÃO S-8",
        "UN": "UN",
        "COR": "FOSCO",
        "QTDE": "376,00000",
        "QTDEMB": "376,00000",
        "VLRUNIT": "0,20",
        "VLRCUSTO": "75,20",
        "VVENDA": "142,88",
        "DIF": "67,68",
        "CUSTOEMB": "75,20",
        "VENDAEMB": "142,88",
        "undefined": "/static/fotos/00001/BUC_755.PNG"
      },
      {
        "ID": "23865768",
        "CDIGO": "GUA007",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO DA PINGADEIRA 11 X 14 - EPDM PRETO",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "84,35000",
        "QTDEMB": "84,35000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/static/fotos/00001/GUA_007.PNG"
      },
      {
        "ID": "23865856",
        "CDIGO": "PAR1037",
        "SEUCDIGO": "",
        "NOME": "PARAFUSO AA CP 4,8 X 50 MM INOX - FENDA PHILIPS",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "1.008,00000",
        "QTDEMB": "1.008,00000",
        "VLRUNIT": "0,45",
        "VLRCUSTO": "453,60",
        "VVENDA": "861,84",
        "DIF": "408,24",
        "CUSTOEMB": "453,60",
        "VENDAEMB": "861,84",
        "undefined": "/static/fotos/00001/PAR_CP_PHS.PNG"
      },
      {
        "ID": "23866491",
        "CDIGO": "SILA01",
        "SEUCDIGO": "",
        "NOME": "SILICONE ACÉTICO",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "27,00000",
        "QTDEMB": "3,00000",
        "VLRUNIT": "30,00",
        "VLRCUSTO": "810,00",
        "VVENDA": "1.539,00",
        "DIF": "729,00",
        "CUSTOEMB": "1.080,00",
        "VENDAEMB": "2.052,00",
        "undefined": "/srv/apps/fotos/04448/SILI.JPG"
      },
      {
        "ID": "23866628",
        "CDIGO": "VHB-4972",
        "SEUCDIGO": "",
        "NOME": "FITA DUPLA FACE (30MM X 20M) 3M PARA COLAR VIDRO (GLAZING)",
        "UN": "MT",
        "COR": "COR UNICA",
        "QTDE": "1.291,80000",
        "QTDEMB": "65,00000",
        "VLRUNIT": "13,25",
        "VLRCUSTO": "17.116,35",
        "VVENDA": "32.521,07",
        "DIF": "15.404,72",
        "CUSTOEMB": "17.225,00",
        "VENDAEMB": "32.727,51",
        "undefined": "/srv/apps/fotos/04448/FT.JPG"
      },
      {
        "ID": "23866732",
        "CDIGO": "ANC-964",
        "SEUCDIGO": "ANCORAGEM INFERIOR",
        "NOME": "ANCORAGEM INFERIOR P/ COLUNA",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "59,00000",
        "QTDEMB": "59,00000",
        "VLRUNIT": "16,15",
        "VLRCUSTO": "952,85",
        "VVENDA": "1.810,42",
        "DIF": "857,57",
        "CUSTOEMB": "952,85",
        "VENDAEMB": "1.810,42",
        "undefined": "/static/fotos/00001/anc964.PNG"
      },
      {
        "ID": "23866733",
        "CDIGO": "ANC-965",
        "SEUCDIGO": "",
        "NOME": "ANCORAGEM TELESCÓPICA CHAPA AZ 100X2",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "59,00000",
        "QTDEMB": "59,00000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/static/fotos/ANC-965"
      },
      {
        "ID": "23866737",
        "CDIGO": "BRA591",
        "SEUCDIGO": "",
        "NOME": "BRAÇO MAXIM-AR C/ 1200MM",
        "UN": "PR",
        "COR": "PRETO",
        "QTDE": "29,00000",
        "QTDEMB": "15,00000",
        "VLRUNIT": "177,00",
        "VLRCUSTO": "5.133,00",
        "VVENDA": "9.752,70",
        "DIF": "4.619,70",
        "CUSTOEMB": "5.310,00",
        "VENDAEMB": "10.089,00",
        "undefined": "/static/fotos/BRA-591"
      },
      {
        "ID": "23866738",
        "CDIGO": "CHU795",
        "SEUCDIGO": "",
        "NOME": "PARABOLT COM PORCA, ARRUELA E PRISIONEIRO 9,5 X 80 MM",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "118,00000",
        "QTDEMB": "118,00000",
        "VLRUNIT": "3,41",
        "VLRCUSTO": "402,38",
        "VVENDA": "764,53",
        "DIF": "362,15",
        "CUSTOEMB": "402,38",
        "VENDAEMB": "764,53",
        "undefined": "/static/fotos/00001/CHU_795.PNG"
      },
      {
        "ID": "23866739",
        "CDIGO": "FEC-152",
        "SEUCDIGO": "",
        "NOME": "FECHO MAXIM-AR DIR. PELE DE VIDRO II",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "29,00000",
        "QTDEMB": "29,00000",
        "VLRUNIT": "26,07",
        "VLRCUSTO": "756,03",
        "VVENDA": "1.436,47",
        "DIF": "680,44",
        "CUSTOEMB": "756,03",
        "VENDAEMB": "1.436,47",
        "undefined": "/srv/apps/fotos/04448/FEC152.JPG"
      },
      {
        "ID": "23866740",
        "CDIGO": "GUA160",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO DA COLUNA",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "349,65000",
        "QTDEMB": "350,00000",
        "VLRUNIT": "1,50",
        "VLRCUSTO": "524,48",
        "VVENDA": "996,50",
        "DIF": "472,02",
        "CUSTOEMB": "525,01",
        "VENDAEMB": "997,50",
        "undefined": "/static/fotos/00001/GUA_160.PNG"
      },
      {
        "ID": "23866741",
        "CDIGO": "GUA161",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO PARA VEDAÇÃO DA FOLHA",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "1.070,55000",
        "QTDEMB": "1.071,00000",
        "VLRUNIT": "1,50",
        "VLRCUSTO": "1.605,83",
        "VVENDA": "3.051,07",
        "DIF": "1.445,24",
        "CUSTOEMB": "1.606,51",
        "VENDAEMB": "3.052,35",
        "undefined": "/static/fotos/00001/GUA_161.PNG"
      },
      {
        "ID": "23866742",
        "CDIGO": "GUA162",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO DA COLUNA 90º",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "286,90000",
        "QTDEMB": "287,00000",
        "VLRUNIT": "1,50",
        "VLRCUSTO": "430,35",
        "VVENDA": "817,68",
        "DIF": "387,33",
        "CUSTOEMB": "430,50",
        "VENDAEMB": "817,97",
        "undefined": "/static/fotos/00001/GUA_162.PNG"
      },
      {
        "ID": "23866743",
        "CDIGO": "LUV-974",
        "SEUCDIGO": "",
        "NOME": "LUVA PARA COLUNA FC-202",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "38,00000",
        "QTDEMB": "38,00000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/srv/apps/fotos/00001/LUV_974.PNG"
      },
      {
        "ID": "23866745",
        "CDIGO": "PRE-950",
        "SEUCDIGO": "",
        "NOME": "PRESILHA DA FOLHA FIXA",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "1.954,00000",
        "QTDEMB": "1.954,00000",
        "VLRUNIT": "1,50",
        "VLRCUSTO": "2.931,00",
        "VVENDA": "5.568,90",
        "DIF": "2.637,90",
        "CUSTOEMB": "2.931,00",
        "VENDAEMB": "5.568,90",
        "undefined": "/srv/apps/fotos/04448/PRE950.JPG"
      },
      {
        "ID": "23866746",
        "CDIGO": "PRE-951",
        "SEUCDIGO": "",
        "NOME": "PRESILHA DA COLUNA",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "1.954,00000",
        "QTDEMB": "1.954,00000",
        "VLRUNIT": "2,20",
        "VLRCUSTO": "4.298,80",
        "VVENDA": "8.167,72",
        "DIF": "3.868,92",
        "CUSTOEMB": "4.298,80",
        "VENDAEMB": "8.167,72",
        "undefined": "/srv/apps/fotos/04448/PRE951.JPG"
      },
      {
        "ID": "23865361",
        "CDIGO": "PAR435",
        "SEUCDIGO": "",
        "NOME": "PARAFUSO AA CP PP 4,8 X 32 MM INOX - FENDA PHILIPS",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "468,00000",
        "QTDEMB": "468,00000",
        "VLRUNIT": "0,45",
        "VLRCUSTO": "210,60",
        "VVENDA": "400,14",
        "DIF": "189,54",
        "CUSTOEMB": "210,60",
        "VENDAEMB": "400,14",
        "undefined": "/srv/apps/fotos/00001/PAR435.PNG"
      },
      {
        "ID": "23865741",
        "CDIGO": "CAL948",
        "SEUCDIGO": "",
        "NOME": "CALÇO DA FOLHA FIXA",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "72,00000",
        "QTDEMB": "72,00000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/static/fotos/00001/CAL_948.PNG"
      },
      {
        "ID": "23865742",
        "CDIGO": "CHU838",
        "SEUCDIGO": "",
        "NOME": "CHUMBADOR DE ALUMÍNIO MULTIUSO",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "394,00000",
        "QTDEMB": "394,00000",
        "VLRUNIT": "0,48",
        "VLRCUSTO": "189,12",
        "VVENDA": "359,34",
        "DIF": "170,22",
        "CUSTOEMB": "189,12",
        "VENDAEMB": "359,34",
        "undefined": "/static/fotos/00001/CHU_838.PNG"
      },
      {
        "ID": "23865743",
        "CDIGO": "CON370",
        "SEUCDIGO": "",
        "NOME": "CONTRAFECHO LATERAL SUPREMA",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "17,00000",
        "QTDEMB": "17,00000",
        "VLRUNIT": "3,00",
        "VLRCUSTO": "51,00",
        "VVENDA": "96,90",
        "DIF": "45,90",
        "CUSTOEMB": "51,00",
        "VENDAEMB": "96,90",
        "undefined": "/srv/apps/fotos/04448/CON370.JPG"
      },
      {
        "ID": "23865753",
        "CDIGO": "FEC1045",
        "SEUCDIGO": "",
        "NOME": "FECHO CONCHA SEM CHAVE 161 MM / JANELA",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "34,00000",
        "QTDEMB": "34,00000",
        "VLRUNIT": "11,48",
        "VLRCUSTO": "390,32",
        "VVENDA": "741,61",
        "DIF": "351,29",
        "CUSTOEMB": "390,32",
        "VENDAEMB": "741,61",
        "undefined": "/srv/apps/fotos/04448/10451.JPG"
      },
      {
        "ID": "23865760",
        "CDIGO": "FIT210",
        "SEUCDIGO": "FIT5X7",
        "NOME": "FITA DE VEDAÇÃO SEM BARREIRA PLÁSTICA 5 X 7 MM",
        "UN": "MT",
        "COR": "COR UNICA",
        "QTDE": "149,00000",
        "QTDEMB": "149,00000",
        "VLRUNIT": "1,00",
        "VLRCUSTO": "149,00",
        "VVENDA": "283,10",
        "DIF": "134,10",
        "CUSTOEMB": "149,00",
        "VENDAEMB": "283,10",
        "undefined": "/srv/apps/fotos/04448/FIT5X7.jpg"
      },
      {
        "ID": "23865772",
        "CDIGO": "GUA171",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO ESPUMA ADESIVA 11 X 3,2 - PRETO",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "302,64800",
        "QTDEMB": "303,00000",
        "VLRUNIT": "1,80",
        "VLRCUSTO": "544,77",
        "VVENDA": "1.035,06",
        "DIF": "490,29",
        "CUSTOEMB": "545,40",
        "VENDAEMB": "1.036,26",
        "undefined": "/static/fotos/00001/GUA_171.PNG"
      },
      {
        "ID": "23865777",
        "CDIGO": "GUA259",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO CUNHA DO VIDRO 12 X 4,2 - EPDM PRETO",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "342,27100",
        "QTDEMB": "343,00000",
        "VLRUNIT": "1,50",
        "VLRCUSTO": "513,41",
        "VVENDA": "975,47",
        "DIF": "462,06",
        "CUSTOEMB": "514,50",
        "VENDAEMB": "977,55",
        "undefined": "/srv/apps/fotos/04448/GUA259.JPG"
      },
      {
        "ID": "23865783",
        "CDIGO": "NYL190",
        "SEUCDIGO": "NYL190",
        "NOME": "BOTÃO DE NYL FIXAÇÃO DO ARREMATE",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "394,00000",
        "QTDEMB": "394,00000",
        "VLRUNIT": "0,17",
        "VLRCUSTO": "66,98",
        "VVENDA": "127,25",
        "DIF": "60,27",
        "CUSTOEMB": "66,98",
        "VENDAEMB": "127,25",
        "undefined": "/srv/apps/fotos/04448/NYL190.JPG"
      },
      {
        "ID": "23865784",
        "CDIGO": "NYL329",
        "SEUCDIGO": "",
        "NOME": "CAIXA DE DRENO / VEDAÇÃO INFERIOR",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "34,00000",
        "QTDEMB": "34,00000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/static/fotos/00001/NYL_329.PNG"
      },
      {
        "ID": "23865785",
        "CDIGO": "NYL332",
        "SEUCDIGO": "NYL396",
        "NOME": "GUIA DESLIZANTE NYL - SUPREMA",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "288,00000",
        "QTDEMB": "288,00000",
        "VLRUNIT": "1,17",
        "VLRCUSTO": "336,96",
        "VVENDA": "640,23",
        "DIF": "303,27",
        "CUSTOEMB": "336,96",
        "VENDAEMB": "640,23",
        "undefined": "/srv/apps/fotos/04448/Capturar53.JPG"
      },
      {
        "ID": "23865786",
        "CDIGO": "NYL335",
        "SEUCDIGO": "",
        "NOME": "VEDAÇÃO SUPERIOR",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "36,00000",
        "QTDEMB": "36,00000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/static/fotos/00001/NYL__335.PNG"
      },
      {
        "ID": "23865804",
        "CDIGO": "ROL439",
        "SEUCDIGO": "",
        "NOME": "ROLDANA DUPLA COM ROLAMENTO E REGULAGEM | CARGA 80 KG/FOLHA - SUPREMA",
        "UN": "UN",
        "COR": "COR UNICA",
        "QTDE": "68,00000",
        "QTDEMB": "68,00000",
        "VLRUNIT": "15,00",
        "VLRCUSTO": "1.020,00",
        "VVENDA": "1.938,00",
        "DIF": "918,00",
        "CUSTOEMB": "1.020,00",
        "VENDAEMB": "1.938,00",
        "undefined": "/static/fotos/00001/ROL_439.PNG"
      },
      {
        "ID": "23865810",
        "CDIGO": "PAR1025",
        "SEUCDIGO": "",
        "NOME": "PARAFUSO AA CP 4,2 X 16 MM INOX - FENDA PHILIPS",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "394,00000",
        "QTDEMB": "394,00000",
        "VLRUNIT": "0,45",
        "VLRCUSTO": "177,30",
        "VVENDA": "336,87",
        "DIF": "159,57",
        "CUSTOEMB": "177,30",
        "VENDAEMB": "336,87",
        "undefined": "/static/fotos/00001/PAR_CP_PHS.PNG"
      },
      {
        "ID": "23865851",
        "CDIGO": "PAR1013",
        "SEUCDIGO": "",
        "NOME": "PARAFUSO AA CP 4,2 X 25 MM INOX - FENDA PHILIPS",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "324,00000",
        "QTDEMB": "324,00000",
        "VLRUNIT": "0,45",
        "VLRCUSTO": "145,80",
        "VVENDA": "277,02",
        "DIF": "131,22",
        "CUSTOEMB": "145,80",
        "VENDAEMB": "277,02",
        "undefined": "/static/fotos/00001/PAR_094.PNG"
      },
      {
        "ID": "23865853",
        "CDIGO": "PAR1023",
        "SEUCDIGO": "",
        "NOME": "PARAFUSO AA CP 3,9 X 9,5 MM INOX - FENDA PHILIPS",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "172,00000",
        "QTDEMB": "172,00000",
        "VLRUNIT": "0,20",
        "VLRCUSTO": "34,40",
        "VVENDA": "65,36",
        "DIF": "30,96",
        "CUSTOEMB": "34,40",
        "VENDAEMB": "65,36",
        "undefined": "/static/fotos/00001/PAR_094.PNG"
      },
      {
        "ID": "23865861",
        "CDIGO": "TRA009",
        "SEUCDIGO": "TRA009",
        "NOME": "LINGUETA INOX 33 MM",
        "UN": "UN",
        "COR": "NATURAL FOSCO",
        "QTDE": "17,00000",
        "QTDEMB": "17,00000",
        "VLRUNIT": "1,31",
        "VLRCUSTO": "22,27",
        "VVENDA": "42,32",
        "DIF": "20,05",
        "CUSTOEMB": "22,27",
        "VENDAEMB": "42,32",
        "undefined": "/srv/apps/fotos/04448/TRA.JPG"
      },
      {
        "ID": "23866321",
        "CDIGO": "FIT201",
        "SEUCDIGO": "FIT5X5",
        "NOME": "FITA DE VEDAÇÃO SEM BARREIRA PLÁSTICA 5 X 5 MM",
        "UN": "MT",
        "COR": "COR UNICA",
        "QTDE": "58,91200",
        "QTDEMB": "59,00000",
        "VLRUNIT": "1,00",
        "VLRCUSTO": "58,91",
        "VVENDA": "111,93",
        "DIF": "53,02",
        "CUSTOEMB": "59,00",
        "VENDAEMB": "112,10",
        "undefined": "/srv/apps/fotos/04448/FIT5X5.jpg"
      },
      {
        "ID": "23866491",
        "CDIGO": "SILA01",
        "SEUCDIGO": "",
        "NOME": "SILICONE ACÉTICO",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "46,00000",
        "QTDEMB": "4,00000",
        "VLRUNIT": "30,00",
        "VLRCUSTO": "1.380,00",
        "VVENDA": "2.622,00",
        "DIF": "1.242,00",
        "CUSTOEMB": "1.440,00",
        "VENDAEMB": "2.736,00",
        "undefined": "/srv/apps/fotos/04448/SILI.JPG"
      },
      {
        "ID": "25281737",
        "CDIGO": "FIT7X7",
        "SEUCDIGO": "FIT7X7",
        "NOME": "FITA DE VEDAÇÃO SEM BARREIRA PLÁSTICA 7 X 7 MM",
        "UN": "MT",
        "COR": "COR UNICA",
        "QTDE": "176,73600",
        "QTDEMB": "177,00000",
        "VLRUNIT": "2,00",
        "VLRCUSTO": "353,47",
        "VVENDA": "671,60",
        "DIF": "318,13",
        "CUSTOEMB": "354,00",
        "VENDAEMB": "672,60",
        "undefined": "/srv/apps/fotos/04448/FIT7X7.jpg"
      },
      {
        "ID": "23865771",
        "CDIGO": "GUA157",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO ESPUMA ADESIVA 11 X 6,4 - PRETO",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "32,80000",
        "QTDEMB": "33,00000",
        "VLRUNIT": "1,10",
        "VLRCUSTO": "36,08",
        "VVENDA": "68,56",
        "DIF": "32,48",
        "CUSTOEMB": "36,30",
        "VENDAEMB": "68,98",
        "undefined": "/static/fotos/00001/GUA_157.PNG"
      },
      {
        "ID": "23865737",
        "CDIGO": "BRA702",
        "SEUCDIGO": "",
        "NOME": "BRAÇO MAXIM-AR 500 MM - SUPREMA",
        "UN": "PR",
        "COR": "BRANCO",
        "QTDE": "4,00000",
        "QTDEMB": "2,00000",
        "VLRUNIT": "38,92",
        "VLRCUSTO": "155,68",
        "VVENDA": "295,79",
        "DIF": "140,11",
        "CUSTOEMB": "155,68",
        "VENDAEMB": "295,79",
        "undefined": "/static/fotos/00001/BRA_702_03_05.PNG"
      },
      {
        "ID": "23865751",
        "CDIGO": "FEC009D",
        "SEUCDIGO": "",
        "NOME": "FECHO PUNHO DIREITO - MAXIM-AR",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "4,00000",
        "QTDEMB": "4,00000",
        "VLRUNIT": "25,00",
        "VLRCUSTO": "100,00",
        "VVENDA": "190,00",
        "DIF": "90,00",
        "CUSTOEMB": "100,00",
        "VENDAEMB": "190,00",
        "undefined": "/srv/apps/fotos/04448/009D.JPG"
      },
      {
        "ID": "23865774",
        "CDIGO": "GUA239",
        "SEUCDIGO": "",
        "NOME": "GUARNIÇÃO PARA MARCO 10 X 7 - EPDM PRETO",
        "UN": "MT",
        "COR": "PRETO",
        "QTDE": "12,40000",
        "QTDEMB": "13,00000",
        "VLRUNIT": "1,80",
        "VLRCUSTO": "22,32",
        "VVENDA": "42,40",
        "DIF": "20,08",
        "CUSTOEMB": "23,40",
        "VENDAEMB": "44,45",
        "undefined": "/static/fotos/00001/GUA_239.PNG"
      },
      {
        "ID": "23865800",
        "CDIGO": "REBACA4X10",
        "SEUCDIGO": "",
        "NOME": "REBITE POP DE ALUMÍNIO 4,0 X 10 MM CAB. ABAULADA",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "12,00000",
        "QTDEMB": "12,00000",
        "VLRUNIT": "0,53",
        "VLRCUSTO": "6,36",
        "VVENDA": "12,08",
        "DIF": "5,72",
        "CUSTOEMB": "6,36",
        "VENDAEMB": "12,08",
        "undefined": "/static/fotos/00001/REB_079.GIF"
      },
      {
        "ID": "23865864",
        "CDIGO": "FEC009E",
        "SEUCDIGO": "",
        "NOME": "FECHO PUNHO ESQUERDO - MAXIM-AR",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "1,00000",
        "QTDEMB": "1,00000",
        "VLRUNIT": "0,00",
        "VLRCUSTO": "0,00",
        "VVENDA": "0,00",
        "DIF": "0,00",
        "CUSTOEMB": "0,00",
        "VENDAEMB": "0,00",
        "undefined": "/static/fotos/00001/FEC__009.PNG"
      },
      {
        "ID": "23865745",
        "CDIGO": "CON409",
        "SEUCDIGO": "",
        "NOME": "CONTRAFECHO LATERAL DA FECHADURA SUPREMA",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "1,00000",
        "QTDEMB": "1,00000",
        "VLRUNIT": "5,00",
        "VLRCUSTO": "5,00",
        "VVENDA": "9,50",
        "DIF": "4,50",
        "CUSTOEMB": "5,00",
        "VENDAEMB": "9,50",
        "undefined": "/srv/apps/fotos/04448/CON409.jpg"
      },
      {
        "ID": "23865782",
        "CDIGO": "NYL042",
        "SEUCDIGO": "",
        "NOME": "BOTÃO TAMPA FURO 3/8 NYLON",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "24,00000",
        "QTDEMB": "24,00000",
        "VLRUNIT": "1,00",
        "VLRCUSTO": "24,00",
        "VVENDA": "45,60",
        "DIF": "21,60",
        "CUSTOEMB": "24,00",
        "VENDAEMB": "45,60",
        "undefined": "/srv/apps/fotos/04448/NYL042.JPG"
      },
      {
        "ID": "23865799",
        "CDIGO": "PUX006",
        "SEUCDIGO": "",
        "NOME": "PUXADOR 200 MM PARA PORTA DE CORRER",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "2,00000",
        "QTDEMB": "2,00000",
        "VLRUNIT": "15,00",
        "VLRCUSTO": "30,00",
        "VVENDA": "57,00",
        "DIF": "27,00",
        "CUSTOEMB": "30,00",
        "VENDAEMB": "57,00",
        "undefined": "/srv/apps/fotos/04448/PUX.JPG"
      },
      {
        "ID": "23865817",
        "CDIGO": "NYL-10002",
        "SEUCDIGO": "",
        "NOME": "CONEXÃO DE NYLON PARA CONTRAMARCO CM-200",
        "UN": "UN",
        "COR": "PRETO",
        "QTDE": "2,00000",
        "QTDEMB": "2,00000",
        "VLRUNIT": "1,00",
        "VLRCUSTO": "2,00",
        "VVENDA": "3,80",
        "DIF": "1,80",
        "CUSTOEMB": "2,00",
        "VENDAEMB": "3,80",
        "undefined": "/static/fotos/00001/CON_CM.PNG"
      },
      {
        "ID": "23865857",
        "CDIGO": "PAR1142",
        "SEUCDIGO": "",
        "NOME": "PARAFUSO AA CP 4,8 X 38 MM INOX - FENDA PHILIPS",
        "UN": "UN",
        "COR": "NATURAL",
        "QTDE": "16,00000",
        "QTDEMB": "16,00000",
        "VLRUNIT": "0,10",
        "VLRCUSTO": "1,60",
        "VVENDA": "3,04",
        "DIF": "1,44",
        "CUSTOEMB": "1,60",
        "VENDAEMB": "3,04",
        "undefined": "/static/fotos/00001/PAR_CP_PHS.PNG"
      },
      {
        "ID": "23866116",
        "CDIGO": "FRA823",
        "SEUCDIGO": "FRA823",
        "NOME": "FECHADURA BICO DE PAPAGAIO",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "1,00000",
        "QTDEMB": "1,00000",
        "VLRUNIT": "80,00",
        "VLRCUSTO": "80,00",
        "VVENDA": "152,00",
        "DIF": "72,00",
        "CUSTOEMB": "80,00",
        "VENDAEMB": "152,00",
        "undefined": "/srv/apps/fotos/04448/FRA823.JPG"
      },
      {
        "ID": "23866124",
        "CDIGO": "NYL398",
        "SEUCDIGO": "",
        "NOME": "BATEDEIRA DA FOLHA",
        "UN": "UN",
        "COR": "BRANCO",
        "QTDE": "4,00000",
        "QTDEMB": "1,00000",
        "VLRUNIT": "4,00",
        "VLRCUSTO": "16,00",
        "VVENDA": "30,40",
        "DIF": "14,40",
        "CUSTOEMB": "80,00",
        "VENDAEMB": "152,00",
        "undefined": "/srv/apps/fotos/04448/nyl398.JPG"
      },
      {
        "ID": "24388899",
        "CDIGO": "ROL-83",
        "SEUCDIGO": "ROL-83",
        "NOME": "ROLDANA UDIPLUS 100KG L. SUPREMA",
        "UN": "UN",
        "COR": "COR UNICA",
        "QTDE": "4,00000",
        "QTDEMB": "4,00000",
        "VLRUNIT": "44,00",
        "VLRCUSTO": "176,00",
        "VVENDA": "334,40",
        "DIF": "158,40",
        "CUSTOEMB": "176,00",
        "VENDAEMB": "334,40",
        "undefined": "/srv/apps/fotos/04448/ROL83.jpg"
      }
    ]
     */
  }

  public async getGlass() {
    const glassTableHeadElement = document.querySelectorAll(
      ".Table table#W0070GridContainerTbl thead>tr>th>span"
    );

    const glassTableHeadNames = [] as any[];

    glassTableHeadElement.forEach((spanElement) => {
      if ((spanElement as HTMLElement).innerText !== "") {
        glassTableHeadNames.push(
          (spanElement as HTMLElement).innerText.replace(/[^A-Z0-9]+/gi, "")
        );
      }
    });

    const glassRowsElement = document.querySelectorAll(
      ".Table table#W0070GridContainerTbl tbody>tr.GridWithTotalizer"
    );

    const glassData = [] as any[];

    glassRowsElement.forEach((rowElement) => {
      const glassValues = [] as any[];
      const glassSpanElement = rowElement.querySelectorAll("td>p>span");

      glassSpanElement.forEach((element) => {
        glassValues.push((element as HTMLElement).innerText);
      });

      glassData.push(glassValues);
    });

    const glassRepository = [];

    glassData.forEach((glassArray) => {
      let glassNormalizedData = {};

      glassArray.forEach((element: HTMLElement, index: number) => {
        const glassNormalizedValue = {
          [glassTableHeadNames[index]]: element,
        };

        glassNormalizedData = {
          ...glassNormalizedData,
          ...glassNormalizedValue,
        };
      });

      glassRepository.push(glassNormalizedData);
    });

    /*
    [
      {
        "Licena": "4448",
        "NroOramento": "950",
        "OrcamentoValorVidroId": "1",
        "CODIGO": "VIDRO",
        "COR": "LAMINADO HABITAT CINZA REFLETIVO 4+4 8MM",
        "QTDE": "316",
        "M2": "307,90000",
        "M2ARR": "319,66000",
        "PESO": "0,000",
        "VLRUNIT": "465,24",
        "CUSTO": "148.718,63",
        "VENDA": "282.565,37",
        "DIF": "133.846,74",
        "AC": "0,00"
      },
      {
        "Licena": "4448",
        "NroOramento": "950",
        "OrcamentoValorVidroId": "2",
        "CODIGO": "VIDRO",
        "COR": "INCOLOR 06MM - TEMPERADO",
        "QTDE": "75",
        "M2": "50,38000",
        "M2ARR": "53,86000",
        "PESO": "755,700",
        "VLRUNIT": "196,88",
        "CUSTO": "10.603,95",
        "VENDA": "20.147,51",
        "DIF": "9.543,56",
        "AC": "0,00"
      }
    ]
    */
  }
}

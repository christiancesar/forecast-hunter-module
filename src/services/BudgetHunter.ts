import { BudgetItemsHuntedInMemoryRepository } from "@shared/database/inMemory/hunted/BudgetItemsHuntedInMemoryRepository";
import { BudgetsHuntedInMemoryRepository } from "@shared/database/inMemory/hunted/BudgetsHuntedInMemoryRepository";
import "dotenv/config";
import { BudgetItemHuntedDTO } from "../dtos/BudgetItemHuntedDTO";
import puppeteer, { Browser, Page } from "puppeteer";
import { BudgetHuntedDTO } from "../dtos/BudgetHuntedDTO";
import { createJsonFile } from "../shared/helpers/createJsonFile";

type BudgetHunterParams = {
  user: string | undefined;
  password: string | undefined;
  license: string | undefined;
  url: string;
};

type StillCostHunted = {
  Id: string;
  CDIGO: string;
  SEUCDIGO: string;
  Nome: string;
  COR: string;
  PESO: string;
  Peso: string;
  ML: string;
  CUSTOKGML: string;
  VlrCusto: string;
  VLRVENDA: string;
  Diferena: string;
  VlrTrat: string;
  MLSobra: string;
  MLSucata: string;
  PesoSobra: string;
  PesoSucata: string;
  VlrSobra: string;
  VlrSucata: string;
  QTBARRAS: string;
  ID: string;
  VLRCUSTOTRAT: string;
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
    console.log("\n[SETTINGS LOADING]");
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
    });
    this.page = await this.browser.newPage();
  }

  public async getBudgets(): Promise<void> {
    console.log("\n[BUDGET]");
    console.log("Starting to get budgets...");
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

    await this.page.waitForSelector("#page-wrapper");

    await this.page.goto(
      "https://sistema.wvetro.com.br/wvetro/app.wvetro.home"
    );

    // await this.page.waitForNavigation({
    //   waitUntil: "networkidle0",
    // });

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

    const budgetsHunted: BudgetHuntedDTO[] = [];

    for (let pageNumber = 0; pageNumber < 1; pageNumber++) {
      // get budgets in table and normalize data
      let budgets: BudgetHuntedDTO[] = [];

      budgets = await this.page.evaluate((): BudgetHuntedDTO[] => {
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
        let budgetsValuesFmt: BudgetHuntedDTO[] = [];

        for (
          let bodyValuesIndex = 0;
          bodyValuesIndex < budgetValuesArray.length;
          bodyValuesIndex++
        ) {
          let budget = {} as BudgetHuntedDTO;

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
    console.log("Finished to get budgets");

    console.log("Start saving budgets in database...");

    const budgets = await this.budgetsHuntedInMemoryRepository.saveAll(
      budgetsHunted
    );

    console.log(`Saving ${budgets.length} budgets in database...`);
  }

  public async getBudgetItems(): Promise<void> {
    console.log("\n[BUDGET ITEMS]");
    console.log("Start hunting budget items...");

    let budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    // const budgetItemsHuntedRepository = [] as BudgetItemHuntedDTO[];

    for (let index = 0; index < 1; index++) {
      await this.page.goto(budgetsHunted[index].link, {
        waitUntil: "networkidle0",
      });

      await this.page.waitForSelector("#W0085W0002GridContainerTbl");

      const values = await this.page
        .evaluate(async () => {
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

          const cardHeader = [
            "itenscesta",
            "vendaitens",
            "valorbruto",
            "valordesconto",
            "valorliquido",
          ];

          const cardsValue = [] as string[];

          document.querySelectorAll(".huge").forEach((element) => {
            cardsValue.push((element as HTMLElement).innerText);
          });

          let cardAmountRepository = {} as { [key: string]: string };

          cardHeader.forEach((header, index) => {
            cardAmountRepository = {
              ...cardAmountRepository,
              [header]: cardsValue[index],
            };
          });

          return { cardAmountRepository, budgetItemsHunted };
        })
        .catch((err) => {
          console.log(err);
        });

      budgetsHunted[index] = {
        ...budgetsHunted[index],
        ...values!.cardAmountRepository,
        itens: values!.budgetItemsHunted,
      };

      await this.budgetsHuntedInMemoryRepository.update(budgetsHunted[index]);

      console.log(
        `Updated budget ${budgetsHunted[index].NroOrc} in database ✔`
      );
    }

    budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    createJsonFile("budgets", budgetsHunted);
  }

  public async getCost() {
    const budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    console.log("Start hunting cost ...");

    const budgetCost = [] as any[];

    for (let index = 0; index < budgetsHunted.length; index++) {
      await this.page.goto(budgetsHunted[index].link, {
        waitUntil: "networkidle0",
      });

      await this.page.waitForSelector(".panel.panel-green>a");

      await this.page.click(".panel.panel-green>a", { delay: 2000 });

      await this.page.waitForSelector("#W0046DVPANEL_PNLVIDROSContainer");

      await this.page.evaluate(async () => {
        //Pegando valores de "Custo"

        // eslint-disable-next-line no-debugger
        debugger;

        const costs = document.querySelectorAll(
          "#W0046TBLFINANCEIROR_0002 .row span"
        );

        const costsGeneral = {
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

        console.log("Cost: ", costsGeneral);
        console.log("Strill: ", stillCost);
        console.log("Attachment: ", attachmentCost);
        console.log("Glass: ", glassCost);
      });
    }
    console.log("Finished hunting cost ...");
  }

  public async getStill() {
    console.log("\n[BUDGET STILL COST]");

    console.log("Start hunting budget still cost...");

    let budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    for (let index = 0; index < 10; index++) {
      await this.page.goto(budgetsHunted[index].link, {
        waitUntil: "networkidle0",
      });

      await this.page.waitForSelector("#W0085W0002GridContainerTbl");

      const linkElementExist = await this.page.evaluate(async () => {
        const linkElement = document.querySelector(
          ".panel.panel-green>a"
        ) as HTMLElement;

        if (linkElement) {
          return true;
        }
      });

      if (linkElementExist) {
        await this.page.click(".panel.panel-green>a", { delay: 2000 });

        await this.page.waitForSelector(
          "#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel2"
        );

        await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel2");

        // await this.page.waitForSelector("#W0054GridContainerTbl");

        const stillCostHunted = await this.page.evaluate(async () => {
          // eslint-disable-next-line no-debugger
          // debugger;
          const stillTableHeadElement = document.querySelectorAll(
            ".Table table#W0054GridContainerTbl thead>tr>th>span"
          );

          const stillTableHeadNames = [] as string[];

          stillTableHeadElement.forEach((spanElement) => {
            if ((spanElement as HTMLElement).innerText !== "") {
              stillTableHeadNames.push(
                (spanElement as HTMLElement).innerText.replace(
                  /[^A-Z0-9]+/gi,
                  ""
                )
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

          const stillRepository = [] as StillCostHunted[];
          //eslint-disable-next-line no-debugger
          debugger;
          stillData.forEach((stillArray) => {
            let stillNormalizedData = {} as StillCostHunted;

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

          return stillRepository;
        });

        console.log("Finished hunting still ...");

        const budgetsHuntedUpdated = {
          ...budgetsHunted[index],
          cost: {
            still: stillCostHunted,
          },
        };

        await this.budgetsHuntedInMemoryRepository.update(budgetsHuntedUpdated);

        console.log(
          `Updated budget ${budgetsHunted[index].NroOrc} in database ✔`
        );
      }
    }

    budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();
    createJsonFile("budgets", budgetsHunted);
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
  }
}

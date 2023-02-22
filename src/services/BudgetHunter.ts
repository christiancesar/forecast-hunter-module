import "dotenv/config";
import puppeteer, { Browser, Page } from "puppeteer";

import { BudgetItemsHuntedInMemoryRepository } from "@shared/database/inMemory/hunted/BudgetItemsHuntedInMemoryRepository";
import { BudgetsHuntedInMemoryRepository } from "@shared/database/inMemory/hunted/BudgetsHuntedInMemoryRepository";
import { unionDataHunted } from "@shared/helpers/unionDataHunted";
import { AttachmentCostHuntedDTO } from "src/dtos/AttachmentCostHuntedDTO";
import { GlassCostHuntedDTO } from "src/dtos/GlassCostHuntedDTO";
import { KitsCostHuntedDTO } from "src/dtos/KitsCostHuntedDTO";
import { ProductStockHuntedDTO } from "src/dtos/ProductStockHuntedDTO";
import { StillCostHuntedDTO } from "src/dtos/StillCostHuntedDTO";
import { BudgetHuntedDTO } from "../dtos/BudgetHuntedDTO";
import { BudgetItemHuntedDTO } from "../dtos/BudgetItemHuntedDTO";
import { createJsonFile } from "../shared/helpers/createJsonFile";

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
    console.log("\n[SETTINGS LOADING]");
    this.browser = await puppeteer.launch({
      headless: false,
      devtools: true,
    });
    this.page = await this.browser.newPage();

    // await page.waitForNavigation();
    await this.page.goto(this.url, {
      waitUntil: "domcontentloaded",
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

    await this.page.waitForSelector("#btn_orcamentoview");
  }

  public async getBudgets(): Promise<void> {
    console.log("\n[BUDGET]");
    console.log("Starting to get budgets...");

    await this.page.click("#btn_orcamentoview");

    await this.page.waitForNavigation({
      waitUntil: "networkidle2",
    });

    await this.page.waitForSelector(".first");

    await this.page.click(".first");

    // get pages number
    await this.page.waitForSelector(".btn.btn-primary.dropdown-toggle");

    const paginationLenght = await this.page.evaluate(async () => {
      function getPaginationLenght(selector: string): number {
        const buttonElementExist = document.querySelector(
          selector
        ) as HTMLElement;

        let paginationLenght = 0;

        if (buttonElementExist) {
          const buttonElementText =
            buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

          paginationLenght = buttonElementText
            ? Number(buttonElementText[0])
            : 0;
        }

        return paginationLenght;
      }

      return getPaginationLenght(".btn.btn-primary.dropdown-toggle");
    });

    console.log(`Total pages: ${paginationLenght}`);

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

      console.log(`
        Page ${pageNumber + 1} of ${paginationLenght},
        Budgets found: ${budgets.length}
      `);

      await this.page.waitForTimeout(5000);
      await this.page.click(".next");

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

    for (let index = 0; index < budgetsHunted.length; index++) {
      await this.page.goto(budgetsHunted[index].link, {
        waitUntil: "networkidle0",
      });

      await this.page.waitForSelector("#W0085W0002GridContainerTbl");

      const values = await this.page.evaluate(async () => {
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
      });

      let stillCostHunted: StillCostHuntedDTO[] = [];
      let attachmentCostHunted: AttachmentCostHuntedDTO[] = [];
      let glassCostHunted: GlassCostHuntedDTO[] = [];
      let kitsCostHunted: KitsCostHuntedDTO[] = [];

      const linkElementExist = await this.page.evaluate(async () => {
        const linkElement = document.querySelector(
          ".panel.panel-green>a"
        ) as HTMLElement;

        if (linkElement) {
          return true;
        }
      });

      if (linkElementExist) {
        await this.page.click(".panel.panel-green>a", { delay: 5000 });

        await this.page.waitForSelector(
          "#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel2"
        );

        stillCostHunted = await this.getStill();
        attachmentCostHunted = await this.getAttachment();
        glassCostHunted = await this.getGlass();
        kitsCostHunted = await this.getKits();
      }

      const budgetsHuntedUpdated = {
        ...budgetsHunted[index],
        ...values!.cardAmountRepository,
        itens: values!.budgetItemsHunted,
        cost: {
          still: stillCostHunted,
          attachment: attachmentCostHunted,
          glass: glassCostHunted,
          kits: kitsCostHunted,
        },
      };

      await this.budgetsHuntedInMemoryRepository.update(budgetsHuntedUpdated);

      console.log(
        `
        Still Cost: ${stillCostHunted.length},
        Attachment Cost: ${attachmentCostHunted.length},
        Glass Cost: ${glassCostHunted.length},
        Kits Cost: ${kitsCostHunted.length}
        Updated new hunting on budget ${budgetsHunted[index].NroOrc} in database ✔
        `
      );
    }

    budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    createJsonFile("budgets", budgetsHunted);
  }

  public async getStill(): Promise<StillCostHuntedDTO[]> {
    console.log("\n[BUDGET STILL COST]");

    console.log("Start hunting budget still cost...");

    this.page.waitForTimeout(5000);

    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel2");

    await this.page.waitForSelector("#W0054GridContainerTbl");

    const stillHeaderNames = await this.page.evaluate(async () => {
      function getHeaderNames(selector: string): string[] {
        const spanElements = document.querySelectorAll(selector);

        const headerNames = [] as string[];

        spanElements.forEach((span) => {
          if ((span as HTMLElement).innerText !== "") {
            headerNames.push(
              (span as HTMLElement).innerText.replace(/[^A-Z0-9]+/gi, "")
            );
          }
        });

        return headerNames;
      }

      return getHeaderNames(
        ".Table table#W0054GridContainerTbl thead>tr>th>span"
      );
    });

    const paginationLenght = await this.page.evaluate(async () => {
      function getPaginationLenght(selector: string): number {
        const buttonElementExist = document.querySelector(
          selector
        ) as HTMLElement;

        let paginationLenght = 0;

        if (buttonElementExist) {
          const buttonElementText =
            buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

          paginationLenght = buttonElementText
            ? Number(buttonElementText[0])
            : 0;
        }

        return paginationLenght;
      }

      return getPaginationLenght(".btn.btn-primary.dropdown-toggle");
    });

    let stillRowsValues: string[][] = [];

    for (let index = 0; index < paginationLenght; index++) {
      stillRowsValues = await this.page.evaluate(async () => {
        function getDataTable(selector: string): string[][] {
          const rowsElements = document.querySelectorAll(selector);

          const rowDataHunted: string[][] = [];

          rowsElements.forEach((rowElement) => {
            const values: string[] = [];
            const spansElement = rowElement.querySelectorAll("td>p>span");

            spansElement.forEach((span) => {
              values.push((span as HTMLElement).innerText);
            });

            rowDataHunted.push(values);
          });

          return rowDataHunted;
        }

        return getDataTable(
          ".Table table#W0054GridContainerTbl tbody>tr.GridWithTotalizer"
        );
      });

      await this.page.waitForTimeout(5000);
      await this.page.click(".next");
    }

    const stillRepository = unionDataHunted<StillCostHuntedDTO>(
      stillHeaderNames,
      stillRowsValues
    );

    return stillRepository;
  }

  public async getAttachment(): Promise<AttachmentCostHuntedDTO[]> {
    console.log("\n[BUDGET ATTACHMENT COST]");

    console.log("Start hunting budget attachment cost...");

    this.page.waitForTimeout(5000);
    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel3");

    await this.page.waitForSelector("#W0062GridContainerTbl");

    const attachmentHeaderNames = await this.page.evaluate(async () => {
      function getHeaderNames(selector: string): string[] {
        const spanElements = document.querySelectorAll(selector);

        const headerNames = [] as string[];

        spanElements.forEach((span) => {
          if ((span as HTMLElement).innerText !== "") {
            headerNames.push(
              (span as HTMLElement).innerText.replace(/[^A-Z0-9]+/gi, "")
            );
          }
        });

        return headerNames;
      }

      return getHeaderNames(
        ".Table table#W0054GridContainerTbl thead>tr>th>span"
      );
    });

    const attachmentCostHunted = await this.page.evaluate(async () => {
      const attachmentTableHeadElement = document.querySelectorAll(
        ".Table table#W0062GridContainerTbl thead>tr>th>span"
      );

      const attachmentTableHeadNames = [] as string[];

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

      const buttonElementExist = document.querySelector(
        ".btn.btn-primary.dropdown-toggle"
      ) as HTMLElement;

      let paginationLenght = 0;

      if (buttonElementExist) {
        const buttonElementText =
          buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

        paginationLenght = buttonElementText ? Number(buttonElementText[0]) : 0;
      }

      for (let index = 0; index < paginationLenght; index++) {
        attachmentRowsElement.forEach((rowElement) => {
          const attachmentValues = [] as any[];
          const attachmentSpanElement =
            rowElement.querySelectorAll("td>p>span");

          attachmentSpanElement.forEach((element) => {
            attachmentValues.push((element as HTMLElement).innerText);
          });

          attachmentData.push(attachmentValues);
        });
      }

      const attachmentRepository: AttachmentCostHuntedDTO[] = [];

      attachmentData.forEach((attachmentArray) => {
        let attachmentNormalizedData = {} as AttachmentCostHuntedDTO;

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
      return attachmentRepository;
    });

    return attachmentCostHunted;
  }

  public async getGlass(): Promise<GlassCostHuntedDTO[]> {
    console.log("\n[BUDGET GLASS COST]");

    console.log("Start hunting budget glass cost...");

    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel4");

    await this.page.waitForSelector("#W0070GridContainerTbl");

    const glassCostHunted = await this.page.evaluate(async () => {
      const glassTableHeadElement = document.querySelectorAll(
        ".Table table#W0070GridContainerTbl thead>tr>th>span"
      );

      const glassTableHeadNames = [] as string[];

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

      const buttonElementExist = document.querySelector(
        ".btn.btn-primary.dropdown-toggle"
      ) as HTMLElement;

      let paginationLenght = 0;

      if (buttonElementExist) {
        const buttonElementText =
          buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

        paginationLenght = buttonElementText ? Number(buttonElementText[0]) : 0;
      }

      for (let index = 0; index < paginationLenght; index++) {
        glassRowsElement.forEach((rowElement) => {
          const glassValues = [] as any[];
          const glassSpanElement = rowElement.querySelectorAll("td>p>span");

          glassSpanElement.forEach((element) => {
            glassValues.push((element as HTMLElement).innerText);
          });

          glassData.push(glassValues);
        });
      }

      const glassRepository: GlassCostHuntedDTO[] = [];

      glassData.forEach((glassArray) => {
        let glassNormalizedData = {} as GlassCostHuntedDTO;

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

      return glassRepository;
    });

    return glassCostHunted;
  }

  public async getKits(): Promise<KitsCostHuntedDTO[]> {
    console.log("\n[BUDGET KITS COST]");

    console.log("Start hunting budget kits cost...");

    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel5");

    await this.page.waitForSelector("#W0078GridContainerTbl");

    const kitsCostHunted = await this.page.evaluate(async () => {
      const kitsTableHeadElement = document.querySelectorAll(
        "table#W0078GridContainerTbl thead>tr>th>span"
      );

      const kitsTableHeadNames = [] as string[];

      kitsTableHeadElement.forEach((spanElement) => {
        if ((spanElement as HTMLElement).innerText !== "") {
          kitsTableHeadNames.push(
            (spanElement as HTMLElement).innerText.replace(/[^A-Z0-9]+/gi, "")
          );
        }
      });

      const kitsRowsElement = document.querySelectorAll(
        "table#W0078GridContainerTbl tbody>tr.GridWithTotalizer"
      );

      const kitsData = [] as any[];

      const buttonElementExist = document.querySelector(
        ".btn.btn-primary.dropdown-toggle"
      ) as HTMLElement;

      let paginationLenght = 0;

      if (buttonElementExist) {
        const buttonElementText =
          buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

        paginationLenght = buttonElementText ? Number(buttonElementText[0]) : 0;
      }

      for (let index = 0; index < paginationLenght; index++) {
        kitsRowsElement.forEach((rowElement) => {
          const kitsValues = [] as any[];
          const kitsSpanElement = rowElement.querySelectorAll("td>p>span");

          kitsSpanElement.forEach((element) => {
            kitsValues.push((element as HTMLElement).innerText);
          });

          kitsData.push(kitsValues);
        });
      }

      const kitsRepository: KitsCostHuntedDTO[] = [];

      kitsData.forEach((kitsArray) => {
        let kitsNormalizedData = {} as KitsCostHuntedDTO;

        kitsArray.forEach((element: HTMLElement, index: number) => {
          const kitsNormalizedValue = {
            [kitsTableHeadNames[index]]: element,
          };

          kitsNormalizedData = {
            ...kitsNormalizedData,
            ...kitsNormalizedValue,
          };
        });

        kitsRepository.push(kitsNormalizedData);
      });

      return kitsRepository;
    });

    return kitsCostHunted;
  }

  public async getProductStock(): Promise<ProductStockHuntedDTO[]> {
    console.log("\n[PRODUCT STOCK]");

    console.log("Start hunting product stock...");
    const productStockUrl =
      "https://sistema.wvetro.com.br/wvetro/app.wvetro.wwsaldoestoque";

    await this.page.goto(productStockUrl, {
      waitUntil: "networkidle2",
    });

    await this.page.waitForSelector("#GridContainerDiv");

    await this.page.click(".first");

    const paginationLenght = await this.page.evaluate(() => {
      const buttonElementExist = document.querySelector(
        ".btn.btn-primary.dropdown-toggle"
      ) as HTMLElement;

      let paginationLenght = 0;

      if (buttonElementExist) {
        const buttonElementText =
          buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

        paginationLenght = buttonElementText ? Number(buttonElementText[0]) : 0;
      }

      return paginationLenght;
    });

    console.log("Pagination lenght: ", paginationLenght);

    const productStockHunted: ProductStockHuntedDTO[] = [];

    for (let index = 0; index < paginationLenght; index++) {
      const productStock = await this.page.evaluate(async () => {
        const productStockTableHeadElement = document.querySelectorAll(
          "table#GridContainerTbl thead>tr>th>span"
        );

        const productStockTableHeadNames = [] as string[];

        productStockTableHeadElement.forEach((spanElement, index) => {
          let value;

          if ((spanElement as HTMLElement).innerText.trim() === "") {
            value = "void";
          } else {
            value = (spanElement as HTMLElement).innerText.replace(
              /[^A-Z0-9]+/gi,
              ""
            );
          }
          productStockTableHeadNames.push(`${value}${index}`);
        });

        const productStockRowsElement = document.querySelectorAll(
          "table#GridContainerTbl tbody>tr.GridWithPaginationBar.WorkWithSelectionOdd"
        );

        const productStockData = [] as any[];

        productStockRowsElement.forEach((rowElement) => {
          const productStockValues = [] as any[];
          const productStockSpanElement =
            rowElement.querySelectorAll("td>p>span");

          productStockSpanElement.forEach((element) => {
            productStockValues.push((element as HTMLElement).innerText);
          });

          productStockData.push(productStockValues);
        });

        const productStockRepository: ProductStockHuntedDTO[] = [];

        productStockData.forEach((productStockArray) => {
          let productStockNormalizedData = {} as ProductStockHuntedDTO;

          productStockArray.forEach((element: HTMLElement, index: number) => {
            const productStockNormalizedValue = {
              [productStockTableHeadNames[index]]: element,
            };

            productStockNormalizedData = {
              ...productStockNormalizedData,
              ...productStockNormalizedValue,
            };
          });

          productStockRepository.push(productStockNormalizedData);
        });

        return productStockRepository;
      });

      productStockHunted.push(...productStock);

      console.log(`
        ${index + 1} of ${paginationLenght}
        Getting ${productStock.length} product stock...,
        Content: ${JSON.stringify(productStock, null, 2)}
      `);

      await this.page.waitForTimeout(10000);
      await this.page.click(".next");
    }

    console.log("Product Stock Hunted Count: ", productStockHunted.length);

    return productStockHunted;
  }
}

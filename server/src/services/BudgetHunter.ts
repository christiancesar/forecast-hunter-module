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
import { LooseItemHuntedDTO } from "src/dtos/LooseItemHuntedDTO";

type BudgetHunterParams = {
  user: string | undefined;
  password: string | undefined;
  license: string | undefined;
  url: string;
};
// <>
// <select id="vORCAMENTOSITUACAO" name = "vORCAMENTOSITUACAO" class="Attribute250 form-control" data - gxoch0="if(!(gx.evt.jsEvent(this))) return false;" onfocus = "gx.evt.onfocus(this, 48,'',false,'0001',0)" onchange = ";gx.evt.onchange(this, event)" onblur = ";gx.evt.onblur(this,48);" data - gx - tpl - applied - atts - vars="" >
//   <option value="" selected = "selected" > Todos < /option>
//   <option value="O">ORÇAMENTO</option >
//   <option value="A" > AGENDADO < /option>
//   <option value="V">VENDA</option >
//   <option value="F" > FATURADO < /option>
//   <option value="C">CANCELADO</option >
// </select>
// </>

type SetFilterParams = {
  initialDate: string;
  finalDate: string;
  budgetStatus: string;
  budgetId: number;
};
type GetBudgetHunterParams = {
  filter: SetFilterParams;
  huntPagesQuantity: number;
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

    // await this.page.waitForSelector("#page-wrapper");

    // await this.page.goto(
    //   "https://sistema.wvetro.com.br/wvetro/app.wvetro.home",
    //   { waitUntil: "domcontentloaded" }
    // );
  }

  private async setFilter(filter: SetFilterParams): Promise<void> {
    console.log("Apply filter...");

    await this.page.evaluate((filter) => {
      console.log("filter", filter);

      if (filter.budgetId !== 0) {
        (
          document.querySelector(
            "#TABLEDYNAMICFILTERS input"
          ) as HTMLInputElement
        ).value = filter.budgetId.toString();
      }

      //Change status to "Faturado"
      (
        document.querySelector("#vORCAMENTOSITUACAO") as HTMLSelectElement
      ).value = filter.budgetStatus;

      //Input data de cadastro
      const initialDate = document.querySelector(
        "#vORCAMENTODATACADASTRO"
      ) as HTMLInputElement;
      const finalDate = document.querySelector(
        "#vORCAMENTODATACADASTRO_TO"
      ) as HTMLInputElement;

      if (initialDate) {
        initialDate.value = filter.initialDate ? filter.initialDate : "";
        // initialDate.dispatchEvent(new Event("change"));

        initialDate?.onchange();
      }

      if (finalDate) {
        finalDate.value = filter.finalDate ? filter.finalDate : "";
        // finalDate.dispatchEvent(new Event("change"));

        finalDate?.onchange();
      }
    }, filter);
  }

  public async getBudgets(params: GetBudgetHunterParams): Promise<void> {
    console.log("\n[BUDGET]");

    await this.page.waitForSelector("#btn_orcamentoview");
    await this.page.click("#btn_orcamentoview");

    await this.page.waitForTimeout(3000);

    await this.setFilter(params.filter);

    console.log("Starting to get budgets...");

    await this.page.waitForTimeout(3000);

    let paginationLenght = await this.page.evaluate(async () => {
      function navegatedOnFirstPage() {
        const firstButtonElementIsDisabled =
          document.querySelector(".first.disabled");

        if (!firstButtonElementIsDisabled) {
          const firstButtonElement = document.querySelector(".first a");
          (firstButtonElement as HTMLElement).click();
        }
      }

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

          navegatedOnFirstPage();
        }

        return paginationLenght;
      }

      return getPaginationLenght(
        ".PaginationBarCaption.dropdown .btn.btn-primary.dropdown-toggle"
      );
    });

    const budgetsHunted: BudgetHuntedDTO[] = [];

    paginationLenght =
      params.huntPagesQuantity > 0
        ? params.huntPagesQuantity
        : paginationLenght;

    for (let index = 0; index < paginationLenght; index++) {
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
        Page ${index + 1} of ${paginationLenght},
        Budgets found: ${budgets.length}
      `);

      // eslint-disable-next-line prettier/prettier
      if (index < (paginationLenght - 1)) {
        await this.page.waitForTimeout(3000);
        await this.page.click(
          "#GRIDPAGINATIONBARContainer_DVPaginationBar .next"
        );
      }

      await this.page.waitForSelector("#GridContainerDiv");
    }

    console.log("Finished to get budgets");

    console.log("Start saving budgets in database...");

    const budgets = await this.budgetsHuntedInMemoryRepository.saveAll(
      budgetsHunted
    );

    console.log(`Saving ${budgets.length} budgets in database...`);
    console.log(
      "Budgets",
      budgets.map((budget) => budget.NroOrc)
    );
  }

  public async getBudgetItems(): Promise<void> {
    console.log("\n[BUDGET ITEMS]");
    console.log("Start hunting budget items...");

    let budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    /* Verificar no banco de dados e remover os pedidos do Array que já foram capturados.
       Desta maneira irá capturar apenas os orçamentos necessarios.
    */

    // const budgetItemsHuntedRepository = [] as BudgetItemHuntedDTO[];

    for (let index = 0; index < budgetsHunted.length; index++) {
      try {
        await this.page.goto(budgetsHunted[index].link, {
          waitUntil: "networkidle0",
        });

        await this.page.waitForSelector("#W0088W0002GridContainerTbl");

        const budgetItemsHunted = await this.page.evaluate(async () => {
          const budgetItemsTableHeadElement = document.querySelectorAll(
            ".Table table#W0088W0002GridContainerTbl thead>tr>th"
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
              "#W0088W0002GridContainerDataV"
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

          const cardHeaderNames = [
            "itenscesta",
            "vendaitens",
            "valorbruto",
            "valordesconto",
            "valorliquido",
          ];

          const cardsHeaderValue = [] as string[];

          document.querySelectorAll(".huge").forEach((element) => {
            cardsHeaderValue.push((element as HTMLElement).innerText);
          });

          let cardAmountRepository = {} as { [key: string]: string };

          cardHeaderNames.forEach((header, index) => {
            cardAmountRepository = {
              ...cardAmountRepository,
              [header]: cardsHeaderValue[index],
            };
          });

          return { cardAmountRepository, budgetItemsHunted };
        });

        let getLooseItems: LooseItemHuntedDTO[] = [];
        let stillCostHunted: StillCostHuntedDTO[] = [];
        let attachmentCostHunted: AttachmentCostHuntedDTO[] = [];
        let glassCostHunted: GlassCostHuntedDTO[] = [];
        let kitsCostHunted: KitsCostHuntedDTO[] = [];

        await this.page.waitForTimeout(3000);

        const linkElementExist = await this.page.evaluate(async () => {
          const linkElement = document.querySelector(
            ".panel.panel-green>a"
          ) as HTMLElement;

          if (linkElement) {
            return true;
          }
        });

        if (linkElementExist) {
          getLooseItems = await this.getLooseItems();

          await this.page.waitForTimeout(3000);

          await this.page.click(".panel.panel-green>a");

          await this.page.waitForTimeout(3000);
          stillCostHunted = await this.getStill();
          attachmentCostHunted = await this.getAttachment();
          glassCostHunted = await this.getGlass();
          kitsCostHunted = await this.getKits();
        }

        const budgetsHuntedUpdated = {
          ...budgetsHunted[index],
          ...budgetItemsHunted!.cardAmountRepository,
          items: budgetItemsHunted!.budgetItemsHunted,
          looseItems: getLooseItems,
          cost: {
            still: stillCostHunted,
            attachment: attachmentCostHunted,
            glass: glassCostHunted,
            kits: kitsCostHunted,
          },
          captured: true,
        } as BudgetHuntedDTO;

        await this.budgetsHuntedInMemoryRepository.update(budgetsHuntedUpdated);

        console.log(
          `
          Loose Items: ${getLooseItems.length},
          Still Cost: ${stillCostHunted.length},
          Attachment Cost: ${attachmentCostHunted.length},
          Glass Cost: ${glassCostHunted.length},
          Kits Cost: ${kitsCostHunted.length}
          Updated new hunting on budget ${budgetsHunted[index].NroOrc} in database ✔
          `
        );
      } catch (error) {
        console.log(`
          Error on budget ${budgetsHunted[index].NroOrc},
          Error: ${error}
        `);
      }
    }

    budgetsHunted = await this.budgetsHuntedInMemoryRepository.findAll();

    createJsonFile("budgets", budgetsHunted);
  }

  public async getLooseItems(): Promise<LooseItemHuntedDTO[]> {
    //get loose items
    await this.page.evaluate(async () => {
      (document.querySelector("#TABLEICONS_0002") as HTMLElement).click();
    });

    await this.page.waitForTimeout(3000);

    const looseItemsCount = await this.page.evaluate(async () => {
      return document.querySelectorAll("#W0088GridContainerTbl tbody>tr")
        .length;
    });

    if (looseItemsCount > 0) {
      const looseItemsHeaderNames = await this.page.evaluate(async () => {
        const tableHeaderNames = document.querySelectorAll(
          "#W0088GridContainerTbl thead>tr>th"
        );

        const headNamesValues: string[] = [];
        let index = 0;
        for (const headName of tableHeaderNames) {
          index++;
          if ((headName as HTMLElement).innerText.trim() === "") {
            headNamesValues.push(`void${index}`);
          } else {
            headNamesValues.push(
              `${(headName as HTMLElement).innerText.replace(
                /[^A-Z0-9]+/gi,
                ""
              )}${index}`
            );
          }
        }

        return headNamesValues;
      });

      const looseItemsRowData = await this.page.evaluate(async () => {
        const tableBodyRowElements = document.querySelectorAll(
          "#W0088GridContainerTbl tbody>tr"
        );

        const tableBodyData: string[][] = [];

        for (const tableBodyRowElement of tableBodyRowElements) {
          const collumnsElements = tableBodyRowElement.querySelectorAll("td");
          const collumnData = [];
          for (const collumnElement of collumnsElements) {
            collumnData.push(collumnElement.innerText);
          }
          tableBodyData.push(collumnData);
        }

        return tableBodyData;
      });

      const looseItemsRepository = unionDataHunted<LooseItemHuntedDTO>(
        looseItemsHeaderNames,
        looseItemsRowData
      );

      return looseItemsRepository;
    }

    return [];
  }

  public async getStill(): Promise<StillCostHuntedDTO[]> {
    console.log("\n[BUDGET STILL COST]");

    console.log("Start hunting budget still cost...");

    await this.page.waitForSelector(
      "#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel2"
    );

    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel2");

    await this.page.waitForTimeout(3000);

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
      function navegatedOnFirstPage() {
        const firstButtonElementIsDisabled = document.querySelector(
          "#W0054GRIDPAGINATIONBARContainer_DVPaginationBar .first.disabled"
        );

        if (!firstButtonElementIsDisabled) {
          const firstButtonElement = document.querySelector(
            "#W0054GRIDPAGINATIONBARContainer_DVPaginationBar .first a"
          );
          (firstButtonElement as HTMLElement).click();
        }
      }

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

          navegatedOnFirstPage();
        }

        return paginationLenght;
      }

      return getPaginationLenght(
        "#W0054GRIDPAGINATIONBARContainer_DVPaginationBar .btn.btn-primary.dropdown-toggle"
      );
    });

    const stillRowsData: string[][] = [];

    for (let index = 0; index < paginationLenght; index++) {
      await this.page.waitForTimeout(3000);
      const stillRowsValues = await this.page.evaluate(async () => {
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

      // eslint-disable-next-line prettier/prettier
      if (index < (paginationLenght - 1)) {
        await this.page.waitForTimeout(3000);
        await this.page.click(
          "#W0054GRIDPAGINATIONBARContainer_DVPaginationBar .next"
        );
      }

      stillRowsData.push(...stillRowsValues);
    }

    const stillRepository = unionDataHunted<StillCostHuntedDTO>(
      stillHeaderNames,
      stillRowsData
    );

    return stillRepository;
  }

  public async getAttachment(): Promise<AttachmentCostHuntedDTO[]> {
    console.log("\n[BUDGET ATTACHMENT COST]");

    console.log("Start hunting budget attachment cost...");

    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel3");

    await this.page.waitForTimeout(3000);

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
        ".Table table#W0062GridContainerTbl thead>tr>th>span"
      );
    });

    const paginationLenght = await this.page.evaluate(async () => {
      function navegatedOnFirstPage() {
        const firstButtonElementIsDisabled = document.querySelector(
          "#W0062GRIDPAGINATIONBARContainer_DVPaginationBar .first.disabled"
        );

        if (!firstButtonElementIsDisabled) {
          const firstButtonElement = document.querySelector(
            "#W0062GRIDPAGINATIONBARContainer_DVPaginationBar .first a"
          );
          (firstButtonElement as HTMLElement).click();
        }
      }

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

          navegatedOnFirstPage();
        }

        return paginationLenght;
      }

      return getPaginationLenght(
        "#W0062GRIDPAGINATIONBARContainer_DVPaginationBar .btn.btn-primary.dropdown-toggle"
      );
    });
    await this.page.waitForTimeout(3000);

    const attachmentRowsData: string[][] = [];

    for (let index = 0; index < paginationLenght; index++) {
      const attachmentRowsValues = await this.page.evaluate(async () => {
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
          ".Table table#W0062GridContainerTbl tbody>tr.GridWithTotalizer"
        );
      });

      // eslint-disable-next-line prettier/prettier
      if (index < (paginationLenght - 1)) {
        await this.page.waitForTimeout(3000);
        await this.page.click(
          "#W0062GRIDPAGINATIONBARContainer_DVPaginationBar .next"
        );
      }

      attachmentRowsData.push(...attachmentRowsValues);
    }

    const attachmentRepository = unionDataHunted<AttachmentCostHuntedDTO>(
      attachmentHeaderNames,
      attachmentRowsData
    );

    return attachmentRepository;
  }

  public async getGlass(): Promise<GlassCostHuntedDTO[]> {
    console.log("\n[BUDGET GLASS COST]");

    console.log("Start hunting budget glass cost...");

    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel4");

    await this.page.waitForTimeout(3000);

    const glassHeaderNames = await this.page.evaluate(async () => {
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
        ".Table table#W0070GridContainerTbl thead>tr>th>span"
      );
    });

    const paginationLenght = await this.page.evaluate(async () => {
      function navegatedOnFirstPage() {
        const firstButtonElementIsDisabled = document.querySelector(
          "#W0070GRIDPAGINATIONBARContainer_DVPaginationBar .first.disabled"
        );

        if (!firstButtonElementIsDisabled) {
          const firstButtonElement = document.querySelector(
            "#W0070GRIDPAGINATIONBARContainer_DVPaginationBar .first a"
          );
          (firstButtonElement as HTMLElement).click();
        }
      }

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

          navegatedOnFirstPage();
        }

        return paginationLenght;
      }

      return getPaginationLenght(
        "#W0070GRIDPAGINATIONBARContainer_DVPaginationBar .btn.btn-primary.dropdown-toggle"
      );
    });
    await this.page.waitForTimeout(3000);

    const glassRowsData: string[][] = [];

    for (let index = 0; index < paginationLenght; index++) {
      const glassRowsValues = await this.page.evaluate(async () => {
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
          ".Table table#W0070GridContainerTbl tbody>tr.GridWithTotalizer"
        );
      });

      // eslint-disable-next-line prettier/prettier
      if (index < (paginationLenght - 1)) {
        await this.page.waitForTimeout(3000);
        await this.page.click(
          "#W0070GRIDPAGINATIONBARContainer_DVPaginationBar .next"
        );
      }

      glassRowsData.push(...glassRowsValues);
    }

    const glassRepository = unionDataHunted<GlassCostHuntedDTO>(
      glassHeaderNames,
      glassRowsData
    );

    return glassRepository;
  }

  public async getKits(): Promise<KitsCostHuntedDTO[]> {
    console.log("\n[BUDGET KITS COST]");

    console.log("Start hunting budget kits cost...");
    await this.page.waitForSelector(
      "#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel5"
    );
    await this.page.click("#Tab_GXUITABSPANEL_TABPRINCIPALContainerpanel5");

    await this.page.waitForTimeout(3000);

    const kitsHeaderNames = await this.page.evaluate(async () => {
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
        ".Table table#W0078GridContainerTbl thead>tr>th>span"
      );
    });

    const paginationLenght = await this.page.evaluate(async () => {
      function navegatedOnFirstPage() {
        const firstButtonElementIsDisabled = document.querySelector(
          "#W0078GRIDPAGINATIONBARContainer_DVPaginationBar .first.disabled"
        );

        if (!firstButtonElementIsDisabled) {
          const firstButtonElement = document.querySelector(
            "#W0078GRIDPAGINATIONBARContainer_DVPaginationBar .first a"
          );
          (firstButtonElement as HTMLElement).click();
        }
      }

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

          navegatedOnFirstPage();
        }

        return paginationLenght;
      }

      return getPaginationLenght(
        "#W0078GRIDPAGINATIONBARContainer_DVPaginationBar .btn.btn-primary.dropdown-toggle"
      );
    });

    await this.page.waitForTimeout(3000);

    const kitsRowsData: string[][] = [];

    for (let index = 0; index < paginationLenght; index++) {
      const kitsRowsValues = await this.page.evaluate(async () => {
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
          ".Table table#W0078GridContainerTbl tbody>tr.GridWithTotalizer"
        );
      });

      // eslint-disable-next-line prettier/prettier
      if (index < (paginationLenght - 1)) {
        await this.page.waitForTimeout(3000);
        await this.page.click(
          "#W0078GRIDPAGINATIONBARContainer_DVPaginationBar .next"
        );
      }

      kitsRowsData.push(...kitsRowsValues);
    }

    const kitsRepository = unionDataHunted<KitsCostHuntedDTO>(
      kitsHeaderNames,
      kitsRowsData
    );

    return kitsRepository;
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

    const paginationLenght = await this.page.evaluate(async () => {
      function navegatedOnFirstPage() {
        const firstButtonElementIsDisabled = document.querySelector(
          "#GRIDPAGINATIONBARContainer_DVPaginationBar .first.disabled"
        );

        if (!firstButtonElementIsDisabled) {
          const firstButtonElement = document.querySelector(
            "#GRIDPAGINATIONBARContainer_DVPaginationBar .first a"
          );
          (firstButtonElement as HTMLElement).click();
        }
      }

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

          navegatedOnFirstPage();
        }

        return paginationLenght;
      }

      return getPaginationLenght(
        "#GRIDPAGINATIONBARContainer_DVPaginationBar .btn.btn-primary.dropdown-toggle"
      );
    });

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
      `);

      // eslint-disable-next-line prettier/prettier
      if (index < (paginationLenght - 1)) {
        await this.page.waitForTimeout(2000);
        await this.page.click(
          "#GRIDPAGINATIONBARContainer_DVPaginationBar .next"
        );
      }
    }

    console.log("Product Stock Hunted Count: ", productStockHunted.length);

    return productStockHunted;
  }
}

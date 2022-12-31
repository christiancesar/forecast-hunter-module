//eslint-disable-next-line no-undef
const tHead = document.querySelector("thead");
const tRow = tHead.childNodes;

// console.log(tRow[0].childNodes.length)
let headValuesArray = [];

for (let headIndex = 0; headIndex < tRow[0].childNodes.length; headIndex++) {
  //     console.log(tRow[0].childNodes[headIndex].innerText)
  headValuesArray.push(tRow[0].childNodes[headIndex].innerText);
}
const headValuesFmtArray = headValuesArray.map((value) => {
  return value.replace(/[^A-Z0-9]+/gi, "");
});
// console.log(headValuesArray);

const budgetValuesArray = [];
//eslint-disable-next-line no-undef
const tBody = document.querySelector("#GridContainerTbl tbody");
const tRowBody = tBody.childNodes;
// console.log(tRowBody)

for (let rowBodyIndex = 0; rowBodyIndex < tRowBody.length; rowBodyIndex++) {
  let tCollumnBody = tRowBody[rowBodyIndex].childNodes;
  //   console.log(tCollumnBody)
  let collumnData = [];
  for (
    let collumnBodyIndex = 0;
    collumnBodyIndex < tCollumnBody.length;
    collumnBodyIndex++
  ) {
    //     console.log(tCollumnBody[collumnBodyIndex].innerText)

    collumnData.push(tCollumnBody[collumnBodyIndex].innerText);
    //     console.log(collumnData)
  }
  //   console.log(collumnData)
  budgetValuesArray.push(collumnData);
}

// console.log(budgetValuesArray);
let budgets = [];

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
    let valuesFmt = {
      [headValuesFmtArray[index]]: budgetValuesArray[bodyValuesIndex][index],
    };
    budget = {
      ...budget,
      ...valuesFmt,
    };
  }

  budgets.push(budget);
}

console.log(budgets);

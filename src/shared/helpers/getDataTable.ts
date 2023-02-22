type DataHunted = any[];

export function getDataTable(selector: string): DataHunted[] {
  const rowsElements = document.querySelectorAll(selector);

  const dataHunted: DataHunted[] = [];

  rowsElements.forEach((rowElement) => {
    const values: string[] = [];
    const spansElement = rowElement.querySelectorAll("td>p>span");

    spansElement.forEach((span) => {
      values.push((span as HTMLElement).innerText);
    });

    dataHunted.push(values);
  });

  return dataHunted;
}

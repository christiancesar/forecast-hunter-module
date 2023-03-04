export function getHeaderNames(selector: string): string[] {
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

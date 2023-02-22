export function getPaginationLenght(selector: string): number {
  const buttonElementExist = document.querySelector(selector) as HTMLElement;

  let paginationLenght = 0;

  if (buttonElementExist) {
    const buttonElementText =
      buttonElementExist.innerText.match(/(\d+)(?!.*\d)/g);

    paginationLenght = buttonElementText ? Number(buttonElementText[0]) : 0;
  }

  return paginationLenght;
}

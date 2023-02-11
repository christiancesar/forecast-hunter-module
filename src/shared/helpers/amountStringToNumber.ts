export function amountStringToNumber(amount: string): number {
  const amountFmt = amount.replace(".", "").replace(",", ".");
  return Number(amountFmt);
}

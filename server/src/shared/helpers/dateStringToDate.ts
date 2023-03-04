export function dateStringToDate(dateString: string): Date | null {
  return Date.parse(dateString) ? new Date(dateString) : null;
}

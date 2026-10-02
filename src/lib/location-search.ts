export function normalizeLocationQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ").replace(/([가-힣]+(?:대로|로|길))\s+(\d+(?:번길|길))/g, "$1$2");
}

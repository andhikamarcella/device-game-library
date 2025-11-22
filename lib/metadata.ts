export function extractDevelopers(involved: any[]) {
  return involved
    ?.filter((i) => i?.developer)
    .map((i) => i?.company?.name)
    .filter(Boolean);
}

export function extractPublishers(involved: any[]) {
  return involved
    ?.filter((i) => i?.publisher)
    .map((i) => i?.company?.name)
    .filter(Boolean);
}

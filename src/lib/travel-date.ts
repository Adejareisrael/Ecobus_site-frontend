export function getDefaultTravelDate() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export function normalizeTravelDate(date?: string | null) {
  const value = date?.trim();
  return value || getDefaultTravelDate();
}

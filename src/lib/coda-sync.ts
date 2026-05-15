export function parseDuration(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length !== 2) return null;
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return (hours * 60 + minutes) * 60 * 1000;
  }

  const hMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h$/i);
  if (hMatch) {
    const hours = parseFloat(hMatch[1]);
    if (isNaN(hours) || hours < 0) return null;
    return hours * 3600000;
  }

  const mMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*m$/i);
  if (mMatch) {
    const minutes = parseFloat(mMatch[1]);
    if (isNaN(minutes) || minutes < 0) return null;
    return minutes * 60000;
  }

  const num = parseFloat(trimmed);
  if (isNaN(num) || num < 0) return null;
  return num < 24 ? num * 3600000 : num * 60000;
}

export function parseLogDate(raw: string): { dayStartMs: number; dayEndMs: number } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (isNaN(date.getTime())) return null;

  const dayStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { dayStartMs: dayStart.getTime(), dayEndMs: dayEnd.getTime() };
}

export async function fetchCodaRows(
  token: string,
  docId: string,
  tableId: string
): Promise<{ rows: Record<string, unknown>[]; error?: string }> {
  const allRows: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  const maxPages = 10;

  for (let page = 0; page < maxPages; page++) {
    let url = `https://coda.io/apis/v1/docs/${encodeURIComponent(docId)}/tables/${encodeURIComponent(tableId)}/rows?useColumnNames=true`;
    if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

    let res: Response | undefined;
    let retries = 0;
    const maxRetries = 3;

    while (retries <= maxRetries) {
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 429) {
        if (retries === maxRetries) {
          return { rows: allRows, error: "Coda API Rate-Limit nach Wiederholungen überschritten" };
        }
        const retryAfterHeader = res.headers.get("Retry-After");
        const waitMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : Math.pow(2, retries) * 1000;
        await new Promise((r) => setTimeout(r, waitMs));
        retries++;
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      return { rows: allRows, error: `Coda API error fetching rows: ${res?.status ?? "unknown"}` };
    }

    const data = (await res.json()) as { items: { values: Record<string, unknown> }[]; nextPageToken?: string };
    for (const item of data.items) allRows.push(item.values);
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  return { rows: allRows };
}

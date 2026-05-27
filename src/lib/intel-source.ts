import { MOCK_INTEL } from "./mock-data";
import { computeFacets, filterAndSort, paginate } from "./query";
import type { IntelQuery, IntelResult } from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  DATA SOURCE SEAM
 * ─────────────────────────────────────────────────────────────────────────
 * Today this returns mock data and does the filtering/faceting in-process.
 *
 * The resource center's real data lives in the community Next.js app (AWS,
 * owned by another dev). When that app exposes a read API, swap the body of
 * `getIntel` to call it. Two viable shapes:
 *
 *  A) Thin proxy — the community API does the filtering/faceting/paging and
 *     returns an IntelResult-shaped payload. Best if the community already
 *     has a search backend (recommended at 6k+ records):
 *
 *       const url = new URL("/intel", process.env.COMMUNITY_API_URL);
 *       url.searchParams.set("q", query.q ?? "");
 *       // ...map selections / sort / page...
 *       const res = await fetch(url, {
 *         headers: { Authorization: `Bearer ${process.env.COMMUNITY_API_KEY}` },
 *         next: { revalidate: 300 }, // ISR-style edge cache
 *       });
 *       return (await res.json()) as IntelResult;
 *
 *  B) Hydrate-then-compute — fetch raw items and reuse the local
 *     filter/facet/paginate helpers below. Fine only for small datasets.
 *
 * Env vars are declared in cloudflare-env.d.ts and supplied via .dev.vars
 * (local) or Webflow Cloud env settings (production). On the Cloudflare
 * runtime, OpenNext exposes them on process.env; for binding-scoped access
 * use getCloudflareContext().env instead.
 * ─────────────────────────────────────────────────────────────────────────
 */
export async function getIntel(query: IntelQuery): Promise<IntelResult> {
  const all = MOCK_INTEL;
  const filtered = filterAndSort(all, query);
  const facets = computeFacets(all, query);
  const { items, total, page, pageSize } = paginate(filtered, query);
  return { items, total, page, pageSize, facets };
}

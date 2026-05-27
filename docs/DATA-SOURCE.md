# Wiring production data

The resource center does **not** copy or "sync" intel into its own database. It
reads through to the **community app's API at request time** and caches the
response at Cloudflare's edge (ISR). That keeps a single source of truth (the
community app) and means there is no sync pipeline to run or monitor.

```
Browser ──▶ /intel-exchange (this app, Webflow Cloud / Workers)
                 │  getIntel(query)            ← the one seam you change
                 ▼
            Community read API (AWS)            ← single source of truth
                 ▲
            edge cache (revalidate: 300s)       ← staleness control
```

The only file to change is **`src/lib/intel-source.ts`**. Everything else
(routing, filters, facets, pagination UI) already speaks the
`IntelResult` / `IntelQuery` types in `src/lib/types.ts`.

---

## 1. Set the environment variables

Server-side only — never exposed to the browser.

| Var | Meaning |
|-----|---------|
| `COMMUNITY_API_URL` | Base URL of the community read API, e.g. `https://community.detections.ai/api` |
| `COMMUNITY_API_KEY` | Server-side read token issued by the community app |

- **Local:** copy `.dev.vars.example` → `.dev.vars` and fill them in (git-ignored).
- **Production:** set them in the **Webflow Cloud** project → environment settings.

They're typed in `cloudflare-env.d.ts`. On the Workers runtime OpenNext exposes
them on `process.env`; for binding-scoped access use
`getCloudflareContext().env` instead.

---

## 2. Replace the body of `getIntel`

Today it returns mock data:

```ts
export async function getIntel(query: IntelQuery): Promise<IntelResult> {
  const all = MOCK_INTEL;
  const filtered = filterAndSort(all, query);
  const facets = computeFacets(all, query);
  const { items, total, page, pageSize } = paginate(filtered, query);
  return { items, total, page, pageSize, facets };
}
```

### Recommended: thin proxy (community API does the work)

Best fit at ~6k+ records — the community backend runs the search/facet/paging
and returns an `IntelResult`-shaped payload. The app just maps the query,
fetches, and returns.

```ts
import { FACET_DEFS } from "./facets";
import type { IntelQuery, IntelResult } from "./types";

export async function getIntel(query: IntelQuery): Promise<IntelResult> {
  const url = new URL("/intel", process.env.COMMUNITY_API_URL);
  if (query.q) url.searchParams.set("q", query.q);
  url.searchParams.set("sort", query.sort);
  url.searchParams.set("page", String(query.page));
  url.searchParams.set("pageSize", String(query.pageSize));
  // facet selections → query params (param names from facets.ts:
  // type, actor, cve, malware, mitre, source, by)
  for (const def of FACET_DEFS) {
    for (const value of query.selections[def.key]) {
      url.searchParams.append(def.param, value);
    }
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.COMMUNITY_API_KEY}` },
    next: { revalidate: 300 }, // edge cache; see §4
  });
  if (!res.ok) throw new Error(`Community API ${res.status}`);

  // If the API already returns the IntelResult shape, just return it.
  // Otherwise transform it here into { items, total, page, pageSize, facets }.
  return (await res.json()) as IntelResult;
}
```

### Alternative: hydrate-then-compute (small datasets only)

If the community API only returns raw items, fetch them and reuse the existing
helpers — but this pulls the whole dataset per request, so only use it for a
small/bounded list:

```ts
import { computeFacets, filterAndSort, paginate } from "./query";

const res = await fetch(new URL("/intel/all", process.env.COMMUNITY_API_URL), {
  headers: { Authorization: `Bearer ${process.env.COMMUNITY_API_KEY}` },
  next: { revalidate: 300 },
});
const all: IntelItem[] = await res.json();
const filtered = filterAndSort(all, query);
return { ...paginate(filtered, query), facets: computeFacets(all, query) };
```

When you go live, delete `src/lib/mock-data.ts`. `src/lib/query.ts` is only
needed if you keep the hydrate-then-compute path.

---

## 3. The response contract

`getIntel` must return an `IntelResult` (`src/lib/types.ts`):

```ts
interface IntelResult {
  items: IntelItem[];   // the current page of rows
  total: number;        // total matches across all pages
  page: number;         // 1-based, clamped to range
  pageSize: number;     // 20 (DEFAULT_PAGE_SIZE)
  facets: Facets;       // value+count per facet, reflecting active filters
}
```

Each `IntelItem` needs: `id`, `slug`, `title`, `description`, `type`, `source`,
`contributor`, `updatedAt` (ISO 8601), and optional `aiEnriched`,
`threatActors[]`, `vulnerabilities[]` (CVE ids), `malware[]`, `mitre[]`
(technique ids). `Facets` is `{ type, threatActor, vulnerability, malware,
mitre, source, contributor }`, each an array of `{ value, count }`.

Counts should reflect the other active filters (standard faceted-search
behaviour). If the API can't compute counts, the sidebar still works but the
numbers won't narrow as filters are applied.

---

## 4. Freshness / caching

- **`next: { revalidate: N }`** on the `fetch`, plus `export const revalidate`
  in `src/app/page.tsx`, control staleness. Lower = fresher but more origin
  hits; higher = cheaper but staler. 300s (5 min) is a reasonable default for an
  intel feed.
- **Near-instant updates (optional):** have the community app call an on-demand
  revalidation route (`revalidatePath('/intel-exchange')` or a tagged
  `revalidateTag`) via webhook when content changes, instead of waiting for the
  timer.
- Use `cache: 'no-store'` only for truly real-time needs — it disables edge
  caching and hits the origin on every request.

---

## 5. Constraints & good practice

- **Edge runtime:** only HTTP `fetch` to the community API — no direct DB
  drivers. The community app must expose the data over HTTP(S).
- **Secrets stay server-side:** `COMMUNITY_API_KEY` is read inside `getIntel`
  (a server component path) and never shipped to the browser.
- **Fail soft (optional):** wrap the fetch in try/catch and return an empty
  `IntelResult` (or fall back to `MOCK_INTEL` behind an env flag) so an API
  outage degrades gracefully instead of erroring the page.

---

## If you ever DO want a real sync

Only needed if the community API can't do faceted search at this scale and you
want this app to own a fast index. Then: run a scheduled job (Cloudflare Cron
Trigger / Worker) that pulls from the community API into a store **this app
owns** — Cloudflare D1/KV/R2, or a search service like Algolia/Typesense — and
point `getIntel` at that index. This is a real sync (with the usual freshness
lag and reconciliation cost), so prefer the live read-through above unless
search performance forces it. Note this is still **not** Webflow CMS — none of
the CMS item/field limits apply.

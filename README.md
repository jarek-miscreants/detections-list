# detections.ai — Resource Center (Public Intel)

Public-facing, faceted threat-intel resource center for detections.ai. Built as
a **Next.js app deployed to Webflow Cloud** (Cloudflare Workers via the OpenNext
adapter), mounted as a subpath of the main marketing site.

## Why a Webflow Cloud app instead of Webflow CMS

The dataset (~6,500+ records, growing daily; facets across 142+ threat actors,
314+ CVEs, 89+ malware families, 87+ MITRE techniques, 64+ sources, 211+
contributors) exceeds what Webflow CMS can model — the 5-reference-field cap and
item ceiling rule it out, and the freshness/faceting needs an actual search
backend. Hosting the app on Webflow Cloud keeps it on the main domain (one nav,
consolidated SEO) with SSR/ISR for crawlability, while the data stays in its
single source of truth (the community app) rather than being mirrored into CMS.

## Architecture

```
Marketing site (Webflow)
  └─ /intel-exchange  ──►  THIS app (Next.js on Webflow Cloud / Cloudflare Workers)
                        └─ getIntel()  ──►  community intel read API (AWS, separate dev)
Community app (Next.js, AWS)  ──►  reverse-proxied at its own paths (separate concern)
```

The **data source seam** is `src/lib/intel-source.ts`. Today it serves mock data
(`src/lib/mock-data.ts`) and filters/facets in-process. When the community app
exposes a read API, swap the body of `getIntel()` — see the comment block there
for the two supported shapes (thin proxy vs. hydrate-then-compute). The thin
proxy (community backend does search/facet/paginate) is recommended at scale.

**Going to production:** there is no batch sync — the app reads through to the
community API at request time and caches at the edge. Full steps (env vars,
`getIntel` implementation, response contract, caching) are in
[docs/DATA-SOURCE.md](docs/DATA-SOURCE.md).

## Mount path

`/intel-exchange` — configured in **two** places that must stay in sync:

- `next.config.ts` → `basePath` + `assetPrefix`
- the **Mount path** set on the environment when connecting this repo in Webflow Cloud

## Project layout

```
src/app/        layout, global CSS, the page (server component, SSR)
src/components/ IntelFilters (client), SortControl (client), IntelTable, Pagination
src/lib/        types, facets config, query/filter/facet logic, url helpers, data seam, mock data
webflow.json    declares the framework to Webflow Cloud
open-next.config.ts / wrangler.jsonc / cloudflare-env.d.ts   Cloudflare/OpenNext config
```

Facets are driven entirely by `src/lib/facets.ts` — add a facet there and it
flows through filtering, counts, URL params, and the sidebar automatically.

## Scripts

```bash
npm run dev      # local Next dev server (mock data)
npm run build    # production build (what Webflow Cloud runs)
npm run preview  # build + run on the local Cloudflare (workerd) runtime
npm run deploy   # build + deploy via wrangler (Webflow Cloud normally handles deploy)
npm run cf-typegen   # regenerate cloudflare-env.d.ts binding types
```

## Environment

Local: copy `.dev.vars.example` → `.dev.vars`. Production: set in Webflow Cloud
env settings. Vars: `COMMUNITY_API_URL`, `COMMUNITY_API_KEY` (server-side only —
never exposed to the browser). Unused until the community API is wired up.

## Known setup note (Windows)

Cloud deps were installed with `--ignore-scripts` to work around an esbuild
version-check clash between Next and Wrangler. The production build (`npm run
build`) is unaffected. `npm run preview` needs the local `workerd` binary
(`@cloudflare/workerd-windows-64`); install it if you want to test the edge
runtime locally. Deployment through Webflow Cloud's own pipeline does not depend
on local workerd.

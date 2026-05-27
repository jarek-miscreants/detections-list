import { FACET_DEFS } from "./facets";
import type { IntelQuery } from "./types";

/**
 * Serialize a query (with optional overrides) into a URLSearchParams.
 * Used by server-rendered pagination/sort links. Empty/default values are
 * omitted to keep URLs clean and shareable.
 */
export function buildParams(
  query: IntelQuery,
  overrides: Partial<Pick<IntelQuery, "q" | "sort" | "page">> & {
    selections?: IntelQuery["selections"];
  } = {},
): URLSearchParams {
  const q = overrides.q ?? query.q;
  const sort = overrides.sort ?? query.sort;
  const page = overrides.page ?? query.page;
  const selections = overrides.selections ?? query.selections;

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  for (const def of FACET_DEFS) {
    for (const value of selections[def.key]) params.append(def.param, value);
  }
  if (sort && sort !== "recent") params.set("sort", sort);
  if (page && page > 1) params.set("page", String(page));
  return params;
}

export function hrefWithParams(params: URLSearchParams): string {
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

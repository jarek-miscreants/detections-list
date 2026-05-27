import { FACET_DEFS } from "./facets";
import type {
  FacetKey,
  Facets,
  FacetValue,
  IntelItem,
  IntelQuery,
  SortKey,
} from "./types";

export const DEFAULT_PAGE_SIZE = 20;

type RawParams = Record<string, string | string[] | undefined>;

const SORT_KEYS: SortKey[] = ["recent", "title", "created", "liked"];

/** Accept both repeated (?type=a&type=b) and comma (?type=a,b) param styles. */
function toValues(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Parse URL search params into a normalized, validated query. */
export function parseQuery(params: RawParams): IntelQuery {
  const selections = Object.fromEntries(
    FACET_DEFS.map((def) => [def.key, toValues(params[def.param])]),
  ) as Record<FacetKey, string[]>;

  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort: SortKey = SORT_KEYS.includes(sortRaw as SortKey)
    ? (sortRaw as SortKey)
    : "recent";

  const pageRaw = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, Number.parseInt(pageRaw ?? "1", 10) || 1);

  const qRaw = Array.isArray(params.q) ? params.q[0] : params.q;
  const q = qRaw?.trim() || undefined;

  return { q, selections, sort, page, pageSize: DEFAULT_PAGE_SIZE };
}

function matchesText(item: IntelItem, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    item.title.toLowerCase().includes(needle) ||
    item.description.toLowerCase().includes(needle)
  );
}

/** True if the item satisfies every active facet except those in `ignore`. */
function matchesSelections(
  item: IntelItem,
  selections: Record<FacetKey, string[]>,
  ignore?: FacetKey,
): boolean {
  for (const def of FACET_DEFS) {
    if (def.key === ignore) continue;
    const wanted = selections[def.key];
    if (wanted.length === 0) continue;
    const have = def.values(item);
    // OR within a facet, AND across facets.
    if (!wanted.some((w) => have.includes(w))) return false;
  }
  return true;
}

function sortItems(items: IntelItem[], sort: SortKey): IntelItem[] {
  const copy = [...items];
  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "created":
    case "recent":
      return copy.sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      );
    case "liked":
      // No like data in the mock yet; fall back to recency.
      return copy.sort(
        (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
      );
    default:
      return copy;
  }
}

/** Apply search + facets, then sort. */
export function filterAndSort(items: IntelItem[], query: IntelQuery): IntelItem[] {
  const filtered = items.filter(
    (item) =>
      (!query.q || matchesText(item, query.q)) &&
      matchesSelections(item, query.selections),
  );
  return sortItems(filtered, query.sort);
}

/**
 * Counts for each facet value. Standard faceted behavior: a facet's own
 * selection does not constrain its own counts (so you can widen it), but all
 * other active facets + the search query do.
 */
export function computeFacets(items: IntelItem[], query: IntelQuery): Facets {
  const result = {} as Facets;
  for (const def of FACET_DEFS) {
    const scope = items.filter(
      (item) =>
        (!query.q || matchesText(item, query.q)) &&
        matchesSelections(item, query.selections, def.key),
    );
    const counts = new Map<string, number>();
    for (const item of scope) {
      for (const value of def.values(item)) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      }
    }
    const values: FacetValue[] = [...counts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
    result[def.key] = values;
  }
  return result;
}

export function paginate(items: IntelItem[], query: IntelQuery) {
  const total = items.length;
  const page = Math.min(query.page, Math.max(1, Math.ceil(total / query.pageSize)));
  const start = (page - 1) * query.pageSize;
  return {
    items: items.slice(start, start + query.pageSize),
    total,
    page,
    pageSize: query.pageSize,
  };
}

import { IntelFilters } from "@/components/IntelFilters";
import { IntelTable } from "@/components/IntelTable";
import { Pagination } from "@/components/Pagination";
import { SortControl } from "@/components/SortControl";
import { getIntel } from "@/lib/intel-source";
import { parseQuery } from "@/lib/query";

// Faceted list rendered on the server for crawlability; revalidate keeps it
// fresh once wired to the community API.
export const revalidate = 300;

export default async function IntelExchangePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseQuery(await searchParams);
  const result = await getIntel(query);

  const start = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.page * result.pageSize, result.total);

  return (
    <div className="iex-shell">
      <IntelFilters facets={result.facets} query={query} />

      <main className="iex-main">
        <div className="iex-toolbar">
          <div className="iex-result-count">
            Showing{" "}
            <strong>
              {start.toLocaleString()}–{end.toLocaleString()}
            </strong>{" "}
            of <strong>{result.total.toLocaleString()}</strong> results
          </div>
          <SortControl value={query.sort} />
        </div>

        <IntelTable items={result.items} />

        <Pagination query={query} total={result.total} />
      </main>
    </div>
  );
}

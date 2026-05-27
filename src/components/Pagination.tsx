import Link from "next/link";
import { buildParams, hrefWithParams } from "@/lib/url";
import type { IntelQuery } from "@/lib/types";

function pageTokens(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const tokens: (number | "…")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) tokens.push("…");
  for (let p = start; p <= end; p++) tokens.push(p);
  if (end < total - 1) tokens.push("…");
  tokens.push(total);
  return tokens;
}

export function Pagination({
  query,
  total,
}: {
  query: IntelQuery;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  if (totalPages <= 1) return null;
  const current = Math.min(query.page, totalPages);

  const href = (page: number) =>
    hrefWithParams(buildParams(query, { page }));

  return (
    <nav className="iex-pagination" aria-label="Pagination">
      {current > 1 ? (
        <Link className="iex-page-btn" href={href(current - 1)} aria-label="Previous page">
          ←
        </Link>
      ) : (
        <span className="iex-page-btn" aria-disabled>←</span>
      )}

      {pageTokens(current, totalPages).map((token, i) =>
        token === "…" ? (
          <span className="iex-page-info" key={`gap-${i}`}>
            …
          </span>
        ) : (
          <Link
            key={token}
            className={`iex-page-btn${token === current ? " active" : ""}`}
            href={href(token)}
            aria-current={token === current ? "page" : undefined}
          >
            {token}
          </Link>
        ),
      )}

      {current < totalPages ? (
        <Link className="iex-page-btn" href={href(current + 1)} aria-label="Next page">
          →
        </Link>
      ) : (
        <span className="iex-page-btn" aria-disabled>→</span>
      )}
    </nav>
  );
}

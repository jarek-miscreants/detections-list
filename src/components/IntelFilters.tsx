"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FACET_DEFS } from "@/lib/facets";
import type { Facets, FacetValue, IntelQuery } from "@/lib/types";

const INITIAL_VISIBLE = 6;

export function IntelFilters({
  facets,
  query,
}: {
  facets: Facets;
  query: IntelQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(query.q ?? "");

  // Push a new set of params, always resetting pagination to page 1.
  function commit(next: URLSearchParams) {
    next.delete("page");
    const qs = next.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  function toggleFacet(param: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    const current = next.getAll(param);
    next.delete(param);
    if (current.includes(value)) {
      current.filter((v) => v !== value).forEach((v) => next.append(param, v));
    } else {
      [...current, value].forEach((v) => next.append(param, v));
    }
    commit(next);
  }

  // Debounce the free-text search into the URL.
  useEffect(() => {
    const term = searchTerm.trim();
    if (term === (query.q ?? "")) return;
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams.toString());
      if (term) next.set("q", term);
      else next.delete("q");
      commit(next);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  return (
    <aside className="iex-filters">
      <input
        className="iex-search"
        placeholder="Search intel..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {FACET_DEFS.map((def) => (
        <FacetGroup
          key={def.key}
          label={def.label}
          values={facets[def.key]}
          selected={query.selections[def.key]}
          onToggle={(value) => toggleFacet(def.param, value)}
        />
      ))}
    </aside>
  );
}

function FacetGroup({
  label,
  values,
  selected,
  onToggle,
}: {
  label: string;
  values: FacetValue[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (values.length === 0) return null;

  const visible = expanded ? values : values.slice(0, INITIAL_VISIBLE);
  const hidden = values.length - visible.length;

  return (
    <div className="iex-facet">
      <div className="iex-facet-header">{label}</div>
      <div className="iex-facet-items">
        {visible.map((v) => (
          <label className="iex-facet-item" key={v.value}>
            <input
              type="checkbox"
              checked={selected.includes(v.value)}
              onChange={() => onToggle(v.value)}
            />
            {v.value}
            <span className="count">{v.count.toLocaleString()}</span>
          </label>
        ))}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          className="iex-facet-more"
          onClick={() => setExpanded(true)}
        >
          Show all {values.length} →
        </button>
      )}
    </div>
  );
}

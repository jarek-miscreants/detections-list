"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { SortKey } from "@/lib/types";

const OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Recently Updated" },
  { value: "title", label: "Title (A–Z)" },
  { value: "created", label: "Created Date" },
  { value: "liked", label: "Most Liked" },
];

export function SortControl({ value }: { value: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function onChange(next: SortKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "recent") params.delete("sort");
    else params.set("sort", next);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  return (
    <div className="iex-sort">
      <label htmlFor="sort">Sort by</label>
      <select
        id="sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

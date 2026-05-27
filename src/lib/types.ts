export type IntelType =
  | "Intel Report"
  | "Article"
  | "Blog Post"
  | "Advisory"
  | "Threat Brief";

/** A single intel record as surfaced in the resource center. */
export interface IntelItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: IntelType;
  /** Publishing source, e.g. "Unit 42", "Mandiant". */
  source: string;
  /** Community handle that added the item, e.g. "sigmahq". */
  contributor: string;
  /** ISO 8601 timestamp of last update. */
  updatedAt: string;
  /** Whether the record was AI-enriched (✨ in the UI). */
  aiEnriched?: boolean;
  threatActors?: string[];
  /** CVE identifiers. */
  vulnerabilities?: string[];
  malware?: string[];
  /** MITRE ATT&CK technique ids, e.g. "T1078". */
  mitre?: string[];
}

export type SortKey = "recent" | "title" | "created" | "liked";

/** Which facets the UI exposes and how they map to URL params + item fields. */
export type FacetKey =
  | "type"
  | "threatActor"
  | "vulnerability"
  | "malware"
  | "mitre"
  | "source"
  | "contributor";

export interface FacetValue {
  value: string;
  count: number;
}

export type Facets = Record<FacetKey, FacetValue[]>;

/** Normalized query parsed from the URL search params. */
export interface IntelQuery {
  q?: string;
  selections: Record<FacetKey, string[]>;
  sort: SortKey;
  page: number;
  pageSize: number;
}

export interface IntelResult {
  items: IntelItem[];
  total: number;
  page: number;
  pageSize: number;
  facets: Facets;
}

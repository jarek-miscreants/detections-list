import type { FacetKey, IntelItem } from "./types";

/** Single source of truth for the facet UI: label, URL param, and item field. */
export interface FacetDef {
  key: FacetKey;
  /** URL query-string parameter name. */
  param: string;
  /** Heading shown in the sidebar. */
  label: string;
  /** Pulls the facet value(s) off an item, always as an array. */
  values: (item: IntelItem) => string[];
}

const one = (v: string | undefined): string[] => (v ? [v] : []);
const many = (v: string[] | undefined): string[] => v ?? [];

export const FACET_DEFS: FacetDef[] = [
  { key: "type", param: "type", label: "Intel Type", values: (i) => one(i.type) },
  { key: "threatActor", param: "actor", label: "Threat Actor", values: (i) => many(i.threatActors) },
  { key: "vulnerability", param: "cve", label: "Vulnerability", values: (i) => many(i.vulnerabilities) },
  { key: "malware", param: "malware", label: "Malware", values: (i) => many(i.malware) },
  { key: "mitre", param: "mitre", label: "MITRE ATT&CK", values: (i) => many(i.mitre) },
  { key: "source", param: "source", label: "Source", values: (i) => one(i.source) },
  { key: "contributor", param: "by", label: "Added By", values: (i) => one(i.contributor) },
];

export const FACET_BY_KEY: Record<FacetKey, FacetDef> = Object.fromEntries(
  FACET_DEFS.map((d) => [d.key, d]),
) as Record<FacetKey, FacetDef>;

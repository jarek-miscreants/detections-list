#!/usr/bin/env node
/**
 * Post-process DevLink output.
 *
 * Two fixes, applied across the generated `webflow/` tree:
 *
 * 1. STRING STYLE → OBJECT. DevLink (CLI 1.23.0) sometimes emits an inline
 *    `style` as a CSS *string* (e.g. `style={"max-width: 14rem;"}`), which React
 *    rejects ("The `style` prop expects a mapping ... not a string"). Rewritten
 *    to a style object.
 *
 * 2. NAV LOGO HREF. The Webflow nav logo link is authored with a placeholder
 *    `href: "#"`, so clicking the logo does nothing. Rewrite the `nav_logo_wrap`
 *    link's href to "/" (the marketing site root).
 *
 * Run automatically after every export via `npm run devlink:export`. Idempotent.
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "webflow");

function cssStringToObjectLiteral(css) {
  const entries = css
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((decl) => {
      const i = decl.indexOf(":");
      if (i === -1) return null;
      const prop = decl.slice(0, i).trim();
      const value = decl.slice(i + 1).trim();
      // Preserve CSS custom properties (--var) verbatim; camelCase the rest.
      const key = prop.startsWith("--")
        ? prop
        : prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return `${JSON.stringify(key)}: ${JSON.stringify(value)}`;
    })
    .filter(Boolean);
  return `{ ${entries.join(", ")} }`;
}

const STYLE_STRING = /style=\{(["'])((?:\\.|(?!\1).)*)\1\}/g;

// The nav logo Link: className `nav_logo_wrap …` followed (within a few props)
// by `href: "#"`. Rewrite the placeholder href to the site root.
const NAV_LOGO_HREF = /(className=\{`nav_logo_wrap[^`]*`\}[\s\S]{0,160}?href:\s*)"#"/g;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (/\.(jsx?|tsx?)$/.test(name)) {
      fix(full);
    }
  }
}

let changed = 0;
function fix(file) {
  const src = readFileSync(file, "utf8");
  let out = src.replace(STYLE_STRING, (_m, _q, css) => {
    return `style={${cssStringToObjectLiteral(css)}}`;
  });
  out = out.replace(NAV_LOGO_HREF, '$1"/"');
  if (out !== src) {
    writeFileSync(file, out);
    changed++;
  }
}

try {
  statSync(ROOT);
} catch {
  console.error(`No webflow/ directory at ${ROOT} — run the export first.`);
  process.exit(0);
}

walk(ROOT);
console.log(`devlink-postexport: applied fixes in ${changed} file(s).`);

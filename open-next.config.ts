import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * OpenNext → Cloudflare Workers build config.
 *
 * Defaults are fine for an SSR/ISR app that fetches data over HTTP.
 * When you wire up the community API and want to cache responses at the edge,
 * enable an incremental cache here, e.g.:
 *
 *   import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
 *   export default defineCloudflareConfig({ incrementalCache: r2IncrementalCache });
 */
export default defineCloudflareConfig({});

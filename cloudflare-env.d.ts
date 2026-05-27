// Cloudflare Workers env bindings & vars available to the app at runtime.
// Regenerate the full interface (incl. bindings) any time with:
//   npm run cf-typegen
interface CloudflareEnv {
  /** Base URL of the community intel API, e.g. https://community.detections.ai/api */
  COMMUNITY_API_URL?: string;
  /** Server-side read token for the community API. Stored as a secret, never shipped to the browser. */
  COMMUNITY_API_KEY?: string;
}

import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/**
 * Webflow Cloud mount path.
 * This MUST stay in sync with:
 *   - the "Mount path" you choose when connecting this repo in Webflow Cloud
 *   - assetPrefix below
 * Webflow Cloud serves the app from this subdirectory of the main domain
 * (e.g. https://www.detections.ai/resources). All internal links built with
 * next/link and the router automatically respect basePath.
 */
const MOUNT_PATH = "/resources";

const nextConfig: NextConfig = {
  basePath: MOUNT_PATH,
  assetPrefix: MOUNT_PATH,
};

export default nextConfig;

// Makes Cloudflare bindings / env vars available during `next dev` only.
// Guarded so it never loads workerd during the production build that
// Webflow Cloud runs.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

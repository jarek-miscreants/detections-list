import type { Metadata } from "next";
// DevLink (Webflow) global styles first — its rules live in CSS cascade
// layers, so our unlayered globals.css below still wins for the data view.
import "@webflow/css/global.css";
import "./globals.css";
// Re-adds Webflow Variable Modes (e.g. .theme-dark) that DevLink doesn't export.
import "./webflow-overrides.css";
import { DevLinkProvider } from "@webflow/DevLinkProvider";
import { CustomCode } from "@webflow/global/CustomCode";
import { NavMain } from "@webflow/nav/NavMain";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Public Intel — detections.ai",
  description:
    "Browse community-contributed threat intelligence: reports, advisories, and threat briefs filterable by actor, malware, CVE, MITRE ATT&CK, and source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Degular (Typekit) — eager load so the data view's type doesn't flash. */}
        <link rel="stylesheet" href="https://use.typekit.net/spm0rcf.css" />
      </head>
      <body>
        {/* DevLinkProvider supplies Webflow fonts + interactions to the
            exported Nav/Footer. Links keep DevLink's default <a> tags so they
            resolve against the main site, not this app's /intel-exchange base. */}
        <DevLinkProvider>
          {/* Injects the site's framework <style> (grid system, resets, root
              tokens) that the exported Webflow components depend on. */}
          <CustomCode />
          <NavMain />
          {children}
          <SiteFooter />
        </DevLinkProvider>
      </body>
    </html>
  );
}

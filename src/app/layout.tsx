import type { Metadata } from "next";
// DevLink (Webflow) global styles first — its rules live in CSS cascade
// layers, so our unlayered globals.css below still wins for the data view.
import "@webflow/css/global.css";
import "./globals.css";
import { DevLinkProvider } from "@webflow/DevLinkProvider";
import { NavMain } from "@webflow/nav/NavMain";
import { Footer } from "@webflow/layout/Footer";

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
          <NavMain />
          {children}
          <Footer />
        </DevLinkProvider>
      </body>
    </html>
  );
}

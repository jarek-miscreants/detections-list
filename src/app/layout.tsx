import type { Metadata } from "next";
import "./globals.css";

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
        {/* Degular (Typekit) — matches the detections.ai brand type. */}
        <link rel="stylesheet" href="https://use.typekit.net/spm0rcf.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://courierfraudcheckbd.com"),
  title: {
    default: "Courier Fraud Check BD",
    template: "%s | Courier Fraud Check BD"
  },
  description: "Production SaaS for Bangladeshi courier fraud intelligence, secure merchant credential handling, billing, and admin operations.",
  applicationName: "Courier Fraud Check BD",
  keywords: [
    "courier fraud checker Bangladesh",
    "Bangladesh ecommerce fraud",
    "Pathao fraud check",
    "Steadfast fraud check",
    "RedX fraud check",
    "merchant risk scoring"
  ],
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "Courier Fraud Check BD",
    title: "Courier Fraud Check BD",
    description: "Enterprise-ready courier fraud intelligence for Bangladeshi merchants.",
    url: "/"
  },
  twitter: {
    card: "summary_large_image",
    title: "Courier Fraud Check BD",
    description: "Enterprise-ready courier fraud intelligence for Bangladeshi merchants."
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

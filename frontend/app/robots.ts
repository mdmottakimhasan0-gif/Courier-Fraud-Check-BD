import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://courierfraudcheckbd.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api-keys", "/billing", "/profile", "/sessions"]
    },
    sitemap: `${baseUrl}/sitemap.xml`
  };
}

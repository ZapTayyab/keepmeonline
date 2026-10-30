export interface SiteConfig {
  productionUrl: string | null;
  contactEmail: string | null;
  adsEnabled: boolean;
}

export const siteConfig: SiteConfig = {
  productionUrl: null,
  contactEmail: null,
  adsEnabled: false,
};

export function canonicalUrl(path: string): string | null {
  if (!siteConfig.productionUrl) return null;
  const base = siteConfig.productionUrl.replace(/\/$/, '');
  return `${base}${path}`;
}

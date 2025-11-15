export const siteConfig = {
  name: 'Sinhala AI News',
  description:
    'Automated Sinhala news pipeline covering global headlines, entertainment, anime, and tech with AI summaries and visuals.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  nav: [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Pipelines', href: '/pipelines' },
    { label: 'Templates', href: '/templates' },
  ],
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/' },
    { label: 'GitHub', href: 'https://github.com/' },
  ],
};

export type SiteConfig = typeof siteConfig;


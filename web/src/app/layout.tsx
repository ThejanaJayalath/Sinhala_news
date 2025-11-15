import type { Metadata } from 'next';
import './globals.css';

import { siteConfig } from '@/config/site';
import { ThemeProvider } from '@/components/theme-provider';
import { bodyFont, displayFont } from '@/lib/fonts';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  keywords: ['Sinhala news', 'AI summaries', 'Facebook automation', 'Sri Lanka'],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>
        <ThemeProvider>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 text-base text-foreground">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}

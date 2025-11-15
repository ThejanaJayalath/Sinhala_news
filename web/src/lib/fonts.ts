import { Noto_Sans_Sinhala, Space_Grotesk } from 'next/font/google';

export const displayFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
});

export const bodyFont = Noto_Sans_Sinhala({
  subsets: ['sinhala', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
});


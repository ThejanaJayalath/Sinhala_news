import Link from 'next/link';
import { Menu } from 'lucide-react';

import { siteConfig } from '@/config/site';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

export const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-border/80 p-2 text-muted-foreground transition hover:text-foreground md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="hidden md:inline-flex">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground md:flex">
            {siteConfig.nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1 transition hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login">
            <Button variant="outline" size="sm">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">Open Console</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};


"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { validateAdminCredentials, ADMIN_EMAIL, ADMIN_PASSWORD } from '@/lib/auth';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    if (!validateAdminCredentials(email, password)) {
      setError('Invalid admin credentials');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await fetch('/api/health').then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      });
      router.push('/dashboard');
    } catch {
      setError('Connected to console but database ping failed. Check Mongo connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 py-16">
      <div className="w-full max-w-md space-y-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Button>
        </Link>

        <Card className="border border-border/80 bg-white/80 shadow-card">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <CardTitle>Admin access</CardTitle>
            <CardDescription>Use your console credentials to continue.</CardDescription>
          </CardHeader>
          <form className="space-y-4 px-6 pb-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-xl border border-border/80 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full rounded-xl border border-border/80 bg-white px-4 py-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground/80">Default admin</p>
              <p>Email: {ADMIN_EMAIL}</p>
              <p>Password: {ADMIN_PASSWORD}</p>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              This is a placeholder form. Hook it up to your auth provider in the next milestone.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}


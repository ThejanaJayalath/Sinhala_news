"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Sparkles, Shield, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      
      if (data.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4 py-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Header section */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-75 blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <h1 className="mb-2 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-4xl font-bold text-transparent">
            Sinhala AI News
          </h1>
          <p className="text-sm text-slate-400">Secure Admin Console</p>
        </div>

        {/* Login Card */}
        <div className="relative">
          {/* Glassmorphism card */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl">
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent" />
            
            {/* Content */}
            <div className="relative p-8">
              <div className="mb-6 text-center">
                <div className="mb-4 inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-4 backdrop-blur-sm">
                  <Lock className="h-6 w-6 text-purple-300" />
                </div>
                <h2 className="mb-2 text-2xl font-semibold text-white">Admin Access</h2>
                <p className="text-sm text-slate-400">Enter your credentials to continue</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Zap className="h-4 w-4 text-purple-400" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="admin@sinhala.news"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 backdrop-blur-sm transition-all focus:border-purple-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Shield className="h-4 w-4 text-blue-400" />
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white placeholder:text-slate-500 backdrop-blur-sm transition-all focus:border-blue-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Credentials hint */}
                <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-blue-500/10 px-4 py-3 backdrop-blur-sm">
                  <p className="mb-1.5 text-xs font-semibold text-purple-300">Default Credentials</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p className="font-mono">Email: {ADMIN_EMAIL}</p>
                    <p className="font-mono">Password: {ADMIN_PASSWORD}</p>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50 transition-all hover:from-purple-500 hover:to-blue-500 hover:shadow-xl hover:shadow-purple-500/50"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>
            </div>
          </div>

          {/* Decorative corner elements */}
          <div className="absolute -left-1 -top-1 h-8 w-8 rounded-tl-3xl border-l-2 border-t-2 border-purple-500/30" />
          <div className="absolute -right-1 -top-1 h-8 w-8 rounded-tr-3xl border-r-2 border-t-2 border-blue-500/30" />
          <div className="absolute -bottom-1 -left-1 h-8 w-8 rounded-bl-3xl border-b-2 border-l-2 border-purple-500/30" />
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-br-3xl border-b-2 border-r-2 border-blue-500/30" />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Protected by advanced encryption
        </p>
      </div>
    </div>
  );
}


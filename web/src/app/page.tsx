import Link from 'next/link';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

import { SiteHeader } from '@/components/site-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const pillars = [
  {
    title: 'Realtime ingestion',
    copy: 'Poll NewsAPI + curated RSS feeds every few minutes with dedupe logic.',
  },
  {
    title: 'Sinhala AI summaries',
    copy: 'LLM prompts tuned for Sinhala tone deliver headlines, blurbs, and hashtags.',
  },
  {
    title: 'Visual template system',
    copy: 'Branded canvas with Sinhala typography, watermark, and AI art pipeline.',
  },
  {
    title: 'One-click publishing',
    copy: 'Review, schedule, and post to Facebook via long-lived tokens.',
  },
];

const checklist = [
  { label: 'Repo + workspace scaffolding', status: 'Complete' },
  { label: 'Next.js + Tailwind baseline UI', status: 'Complete' },
  { label: 'Theme system & fonts', status: 'Complete' },
  { label: 'Auth shell (login + dashboard)', status: 'In progress' },
  { label: 'MongoDB connection utilities', status: 'Pending' },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-content flex-col gap-16 px-4 pb-24 pt-16">
        <section className="grid gap-12 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-8">
            <Badge variant="outline" className="w-fit border-primary/30 text-primary">
              Phase 1 · Foundations & Setup
            </Badge>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-secondary-foreground">
                <Sparkles className="h-4 w-4" />
                Sinhala AI News Ops Console
              </div>
              <h1 className="font-display text-4xl font-semibold sm:text-5xl">
                Ship the newsroom control center with zero-cost hosting.
              </h1>
              <p className="text-lg text-muted-foreground">
                This workspace boots the entire pipeline: React + Tailwind dashboard on Vercel,
                serverless Node APIs, and MongoDB Atlas with sane defaults, ready for ingestion,
                AI workflows, and scheduling.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button size="lg">
                  Go to Console
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Admin Login
                </Button>
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {pillars.map((pillar) => (
                <Card
                  key={pillar.title}
                  className="border border-border bg-white text-foreground shadow-sm"
                >
                  <CardHeader className="gap-2">
                    <CardTitle className="text-base text-foreground">{pillar.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {pillar.copy}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          <Card className="relative overflow-hidden bg-slate-900 text-white shadow-card">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-transparent" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-xl text-white">
                Launch telemetry
                <Badge variant="success">Live</Badge>
              </CardTitle>
              <CardDescription className="text-slate-200">
                Track the most critical KPIs to stay aligned with the six-month goal.
              </CardDescription>
            </CardHeader>
            <div className="relative grid gap-6 p-6">
              <div>
                <p className="text-sm text-slate-300">Followers target</p>
                <p className="text-3xl font-display font-semibold text-white">10,000</p>
                <div className="mt-2 h-2 rounded-full bg-white/20">
                  <div className="h-full rounded-full bg-white/80" style={{ width: '18%' }} />
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-300">Daily post cadence</p>
                <p className="text-3xl font-display font-semibold text-white">3–6 posts</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Foundations checklist</CardTitle>
              <CardDescription>Critical tasks to unlock ingestion + AI phases.</CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checklist.map((item) => (
                  <TableRow key={item.label}>
                    <TableCell>{item.label}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {item.status}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next build steps</CardTitle>
              <CardDescription>Line-by-line plan for the upcoming commits.</CardDescription>
            </CardHeader>
            <ol className="space-y-4 px-6 pb-6 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">01 · Auth shell</span> – scaffold login
                page and secure dashboard routes with middleware.
              </li>
              <li>
                <span className="font-medium text-foreground">02 · Data access layer</span> – create
                MongoDB client helper + base models.
              </li>
              <li>
                <span className="font-medium text-foreground">03 · Source registry</span> – UI & APIs
                to add news feeds before wiring ingestion jobs.
              </li>
            </ol>
          </Card>
        </section>
      </main>
    </>
  );
}

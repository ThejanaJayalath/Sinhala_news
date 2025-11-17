import { Suspense } from "react";
import { Activity, Bell, Calendar, Shield, TrendingUp, FileText, Sparkles, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/lib/db";
import { collections } from "@/lib/models";
import { GenerateDraftsButton } from "@/components/generate-drafts-button";

const queue = [
  { title: "Global headlines ingest", status: "Idle", eta: "3m", category: "World" },
  { title: "Anime RSS summarizer", status: "Running", eta: "45s", category: "Culture" },
  { title: "Cinema poster generator", status: "Queued", eta: "10m", category: "Entertainment" },
];

const notifications = [
  { icon: Activity, text: "New breaking news source added: BBC World.", time: "2m" },
  { icon: Shield, text: "Moderation policy updated for elections coverage.", time: "1h" },
  { icon: Calendar, text: "5 posts scheduled for tomorrow morning.", time: "3h" },
];

export default async function DashboardPage() {
  const db = await getDb();
  const { rawArticles, generatedPosts } = await collections(db);

  const articleStats = await rawArticles
    .aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    .toArray();

  const postStats = await generatedPosts
    .aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    .toArray();

  const latestArticles = await rawArticles
    .find({}, { projection: { _id: 1, title: 1, category: 1 } })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  const latestPosts = await generatedPosts
    .find({}, { projection: { _id: 1, headlineSi: 1, status: 1 } })
    .sort({ createdAt: -1 })
    .limit(5)
    .toArray();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-purple-400" />
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-purple-300">Sinhala AI Ops</p>
            </div>
            <h1 className="mb-2 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text font-display text-4xl font-bold text-transparent">
              Dashboard
            </h1>
            <p className="text-slate-400">
              Overview of your news automation system.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2 border-white/10 bg-white/5 text-slate-300 backdrop-blur-sm hover:bg-white/10 hover:text-white">
              <Bell className="h-4 w-4" />
              Alerts
            </Button>
            <GenerateDraftsButton />
          </div>
        </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-white/10 bg-slate-800/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent" />
          <CardHeader className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-600/30 p-2 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-purple-200" />
              </div>
              <CardTitle className="text-white font-semibold">Raw Articles</CardTitle>
            </div>
            <CardDescription className="text-slate-300">Total articles by category</CardDescription>
          </CardHeader>
          <div className="relative space-y-3 px-6 pb-6">
            {articleStats.map((stat: any) => (
              <div key={stat._id} className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-slate-800/30 px-3 py-2 backdrop-blur-sm">
                <Badge variant="outline" className="border-purple-400/50 bg-purple-500/20 text-purple-200 font-medium">
                  {stat._id || 'unknown'}
                </Badge>
                <span className="text-xl font-bold text-white">{stat.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="relative overflow-hidden border-white/10 bg-slate-800/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent" />
          <CardHeader className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-2 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-blue-200" />
              </div>
              <CardTitle className="text-white font-semibold">Generated Posts</CardTitle>
            </div>
            <CardDescription className="text-slate-300">Posts by status</CardDescription>
          </CardHeader>
          <div className="relative space-y-3 px-6 pb-6">
            {postStats.map((stat: any) => (
              <div key={stat._id} className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-slate-800/30 px-3 py-2 backdrop-blur-sm">
                <Badge 
                  variant={stat._id === 'published' ? 'default' : stat._id === 'rejected' ? 'destructive' : 'outline'}
                  className={stat._id === 'published' ? 'bg-green-500/30 text-green-100 border-green-400/50 font-medium' : stat._id === 'rejected' ? 'bg-red-500/30 text-red-100 border-red-400/50 font-medium' : 'border-blue-400/50 bg-blue-500/20 text-blue-200 font-medium'}
                >
                  {stat._id || 'unknown'}
                </Badge>
                <span className="text-xl font-bold text-white">{stat.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="relative overflow-hidden border-white/10 bg-slate-800/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent" />
          <CardHeader className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-indigo-500/30 to-indigo-600/30 p-2 backdrop-blur-sm">
                <BarChart3 className="h-5 w-5 text-indigo-200" />
              </div>
              <CardTitle className="text-white font-semibold">Pipeline Queue</CardTitle>
            </div>
            <CardDescription className="text-slate-300">Track ingestion, AI, and publish job states.</CardDescription>
          </CardHeader>
          <div className="relative px-6 pb-6">
            <div className="space-y-2">
              {queue.map((job) => (
                <div key={job.title} className="flex items-center justify-between rounded-lg border border-indigo-500/20 bg-slate-800/30 px-3 py-2 text-sm backdrop-blur-sm">
                  <span className="text-slate-200 font-medium">{job.title}</span>
                  <Badge variant="outline" className="border-indigo-400/50 bg-indigo-500/20 text-indigo-200 font-medium">
                    {job.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden border-white/10 bg-slate-800/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-transparent" />
          <CardHeader className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-600/30 p-2 backdrop-blur-sm">
                <FileText className="h-5 w-5 text-purple-200" />
              </div>
              <CardTitle className="text-white font-semibold">Latest Articles</CardTitle>
            </div>
            <CardDescription className="text-slate-300">Most recent ingested items.</CardDescription>
          </CardHeader>
          <div className="relative space-y-2 px-6 pb-6">
            {latestArticles.map((a) => (
              <div key={a._id.toString()} className="flex items-center justify-between rounded-lg border border-purple-500/20 bg-slate-800/30 px-3 py-2.5 text-sm backdrop-blur-sm transition-all hover:bg-slate-700/40">
                <span className="truncate flex-1 text-slate-100 font-medium">{a.title}</span>
                <Badge variant="outline" className="ml-2 border-purple-400/50 bg-purple-500/20 text-purple-200 font-medium">
                  {a.category}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="relative overflow-hidden border-white/10 bg-slate-800/40 backdrop-blur-xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent" />
          <CardHeader className="relative">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-gradient-to-br from-blue-500/30 to-blue-600/30 p-2 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-blue-200" />
              </div>
              <CardTitle className="text-white font-semibold">Latest Posts</CardTitle>
            </div>
            <CardDescription className="text-slate-300">Newest Sinhala drafts.</CardDescription>
          </CardHeader>
          <div className="relative space-y-2 px-6 pb-6">
            {latestPosts.map((p) => (
              <div key={p._id.toString()} className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-slate-800/30 px-3 py-2.5 text-sm backdrop-blur-sm transition-all hover:bg-slate-700/40">
                <span className="truncate flex-1 text-slate-100 font-medium">{p.headlineSi}</span>
                <Badge 
                  variant={p.status === 'published' ? 'default' : 'outline'} 
                  className={`ml-2 font-medium ${
                    p.status === 'published' 
                      ? 'bg-green-500/30 text-green-100 border-green-400/50' 
                      : 'border-blue-400/50 bg-blue-500/20 text-blue-200'
                  }`}
                >
                  {p.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </section>
      </div>
    </div>
  );
}

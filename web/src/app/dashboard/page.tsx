import { Suspense } from "react";
import { Activity, Bell, Calendar, LayoutPanelLeft, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDb } from "@/lib/db";
import { collections, type GeneratedPost, type SourceCategory } from "@/lib/models";
import { GenerateDraftsButton } from "@/components/generate-drafts-button";
import { PostsFilter } from "@/components/posts-filter";

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

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string }> }) {
  const db = await getDb();
  const { rawArticles, generatedPosts } = await collections(db);
  const params = await searchParams;

  const query: Record<string, unknown> = {};
  if (params.status) query.status = params.status as GeneratedPost['status'];
  if (params.category) query.category = params.category as SourceCategory;

  const latestArticles = await rawArticles
    .find({}, { projection: { _id: 1, title: 1, sourceName: 1, createdAt: 1, url: 1 } })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const latestGenerated = await generatedPosts
    .find(query, { projection: { _id: 1, headlineSi: 1, category: 1, status: 1, createdAt: 1, sourceAttribution: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const statusCounts = await generatedPosts
    .aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    .toArray();
  
  const categoryCounts = await generatedPosts
    .aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    .toArray();

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-muted-foreground">Sinhala AI Ops</p>
          <h1 className="font-display text-3xl font-semibold">Command dashboard</h1>
          <p className="text-muted-foreground">
            Review ingestion jobs, AI pipelines, and scheduled posts at a glance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </Button>
          <GenerateDraftsButton />
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline queue</CardTitle>
            <CardDescription>Track ingestion, AI, and publish job states.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((job) => (
                <TableRow key={job.title}>
                  <TableCell>{job.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{job.category}</Badge>
                  </TableCell>
                  <TableCell>{job.status}</TableCell>
                  <TableCell>{job.eta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ops notifications</CardTitle>
            <CardDescription>Real-time feed from moderation + scheduling services.</CardDescription>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            {notifications.map(({ icon: Icon, text, time }) => (
              <div key={text} className="flex items-center justify-between rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/10 p-2 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-foreground/90">{text}</p>
                </div>
                <span className="text-xs text-muted-foreground">{time}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Latest 10 Raw Articles</CardTitle>
            <CardDescription>Most recent ingested items.</CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestArticles.map((a) => (
                <TableRow key={a._id.toString()}>
                  <TableCell className="max-w-[360px] truncate">
                    <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {a.title || a.url}
                    </a>
                  </TableCell>
                  <TableCell>{a.sourceName}</TableCell>
                  <TableCell>{new Date(a.createdAt as unknown as string).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Posts</CardTitle>
                <CardDescription>Review and manage Sinhala drafts.</CardDescription>
              </div>
              <Suspense fallback={<div className="h-9 w-32" />}>
                <PostsFilter />
              </Suspense>
            </div>
          </CardHeader>
          <div className="px-6 pb-4">
            <div className="mb-4 flex flex-wrap gap-4 text-sm">
              {statusCounts.map((s: any) => (
                <div key={s._id} className="flex items-center gap-2">
                  <Badge variant="outline">{s._id || 'unknown'}</Badge>
                  <span className="text-muted-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {latestGenerated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No posts found. {Object.keys(query).length > 0 ? 'Try adjusting your filters.' : 'Generate some drafts to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                latestGenerated.map((g) => (
                  <TableRow key={g._id.toString()}>
                    <TableCell className="max-w-[360px] truncate">
                      <a
                        href={`/dashboard/posts/${g._id.toString()}`}
                        className="hover:underline font-medium"
                      >
                        {g.headlineSi}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{g.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          g.status === 'published'
                            ? 'default'
                            : g.status === 'approved'
                              ? 'default'
                              : g.status === 'rejected'
                                ? 'destructive'
                                : 'outline'
                        }
                      >
                        {g.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(g.createdAt as unknown as string).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}


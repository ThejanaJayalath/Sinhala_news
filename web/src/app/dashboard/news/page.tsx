import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { collections, type RawArticle, type SourceCategory } from "@/lib/models";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArticlesFilter } from "@/components/articles-filter";
import { ArticleActions } from "@/components/article-actions";
import { FetchNewsButton } from "@/components/fetch-news-button";

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ articleCategory?: string; articleStatus?: string }> }) {
  const db = await getDb();
  const { rawArticles } = await collections(db);
  const params = await searchParams;

  // Query for raw articles
  const articleQuery: Record<string, unknown> = {};
  if (params.articleCategory) articleQuery.category = params.articleCategory as SourceCategory;
  if (params.articleStatus) articleQuery.status = params.articleStatus as RawArticle['status'];

  const latestArticles = await rawArticles
    .find(articleQuery, { projection: { _id: 1, title: 1, sourceName: 1, category: 1, status: 1, createdAt: 1, url: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const articleCategoryCounts = await rawArticles
    .aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
    .toArray();
  
  const articleStatusCounts = await rawArticles
    .aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    .toArray();

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">News</h1>
          <p className="text-muted-foreground">
            Manage raw articles from news sources. Filter, view, and process articles.
          </p>
        </div>
        <div className="flex gap-2">
          <FetchNewsButton type="rss" />
          <FetchNewsButton type="newsapi" />
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Raw Articles</CardTitle>
              <CardDescription>Ingested news articles from configured sources.</CardDescription>
            </div>
            <Suspense fallback={<div className="h-9 w-64" />}>
              <ArticlesFilter />
            </Suspense>
          </div>
        </CardHeader>
        <div className="px-6 pb-4">
          <div className="mb-4 flex flex-wrap gap-4 text-sm">
            {articleCategoryCounts.map((c: any) => (
              <div key={c._id} className="flex items-center gap-2">
                <Badge variant="outline">{c._id || 'unknown'}</Badge>
                <span className="text-muted-foreground">{c.count}</span>
              </div>
            ))}
            {articleStatusCounts.map((s: any) => (
              <div key={s._id} className="flex items-center gap-2">
                <Badge variant={s._id === 'queued' ? 'default' : s._id === 'failed' ? 'destructive' : 'outline'}>
                  {s._id || 'unknown'}
                </Badge>
                <span className="text-muted-foreground">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {latestArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No articles found. {Object.keys(articleQuery).length > 0 ? 'Try adjusting your filters.' : 'Fetch some news to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              latestArticles.map((a) => (
                <TableRow key={a._id.toString()}>
                  <TableCell className="max-w-[360px] truncate">
                    <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline font-medium">
                      {a.title || a.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.category || 'unknown'}</Badge>
                  </TableCell>
                  <TableCell>{a.sourceName}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        a.status === 'queued'
                          ? 'default'
                          : a.status === 'failed'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {a.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.createdAt as unknown as string).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <ArticleActions
                      articleId={a._id.toString()}
                      articleUrl={a.url}
                      currentStatus={a.status}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


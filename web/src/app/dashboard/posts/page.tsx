import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { collections, type GeneratedPost, type SourceCategory } from "@/lib/models";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PostsFilter } from "@/components/posts-filter";
import { GenerateDraftsButton } from "@/components/generate-drafts-button";

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string }> }) {
  const db = await getDb();
  const { generatedPosts } = await collections(db);
  const params = await searchParams;

  const query: Record<string, unknown> = {};
  if (params.status) query.status = params.status as GeneratedPost['status'];
  if (params.category) query.category = params.category as SourceCategory;

  const posts = await generatedPosts
    .find(query, { projection: { _id: 1, headlineSi: 1, category: 1, status: 1, createdAt: 1, sourceAttribution: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const statusCounts = await generatedPosts
    .aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
    .toArray();

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Posts</h1>
          <p className="text-muted-foreground">
            Manage generated Sinhala posts. Review, edit, approve, and publish.
          </p>
        </div>
        <GenerateDraftsButton />
      </header>

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
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No posts found. {Object.keys(query).length > 0 ? 'Try adjusting your filters.' : 'Generate some drafts to get started.'}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((g) => (
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
    </div>
  );
}


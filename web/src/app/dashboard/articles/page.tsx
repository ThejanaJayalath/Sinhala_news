import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { collections, type RawArticle, type SourceCategory } from "@/lib/models";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArticleSummarizer } from "@/components/article-summarizer";
import { ArticleTranslator } from "@/components/article-translator";
import { ArticleRow } from "@/components/article-row";

export default async function ArticlesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const db = await getDb();
  const { rawArticles } = await collections(db);
  const params = await searchParams;

  const query: Record<string, unknown> = {};
  if (params.category) query.category = params.category as SourceCategory;

  const articles = await rawArticles
    .find(query, { projection: { _id: 1, title: 1, sourceName: 1, category: 1, description: 1, content: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="font-display text-3xl font-semibold">Articles</h1>
        <p className="text-muted-foreground">
          Create summaries and translate articles to Sinhala. Manage your article collection.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Summarize Article</CardTitle>
            <CardDescription>Generate AI summaries from raw articles</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <ArticleSummarizer />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Translate to Sinhala</CardTitle>
            <CardDescription>Translate text or article summaries to Sinhala</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <ArticleTranslator />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Articles</CardTitle>
          <CardDescription>Select an article to summarize or translate</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No articles found. Fetch some news from the News tab first.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((a) => (
                <ArticleRow
                  key={a._id.toString()}
                  id={a._id.toString()}
                  title={a.title}
                  category={a.category || 'unknown'}
                  sourceName={a.sourceName}
                  createdAt={a.createdAt as Date}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


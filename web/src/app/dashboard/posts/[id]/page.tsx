import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { collections } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PostEditor } from "@/components/post-editor";
import { PostActions } from "@/components/post-actions";

export const runtime = "nodejs";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const db = await getDb();
  const { generatedPosts, rawArticles } = await collections(db);

  const resolved = await params;
  const hex = typeof resolved.id === "string" ? resolved.id : "";
  if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
    notFound();
  }
  const _id = new ObjectId(hex);

  const post = await generatedPosts.findOne({ _id });
  if (!post) {
    notFound();
  }
  const raw = await rawArticles.findOne(
    { _id: post.rawArticleId },
    { projection: { title: 1, url: 1, sourceName: 1, description: 1, publishedAt: 1 } },
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          ← Back to dashboard
        </Link>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              post.status === 'published'
                ? 'default'
                : post.status === 'approved'
                  ? 'default'
                  : post.status === 'rejected'
                    ? 'destructive'
                    : 'outline'
            }
          >
            {post.status}
          </Badge>
          <Badge variant="outline">{post.category}</Badge>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Post Preview</CardTitle>
            <CardDescription>Current content as it appears</CardDescription>
          </CardHeader>
          <div className="space-y-6 p-6 pt-0">
            {/* English Content */}
            <div className="space-y-4 border-b pb-6">
              <h2 className="text-lg font-semibold">English Content</h2>
              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Headline</h3>
                <p className="text-2xl font-semibold leading-tight">{post.headlineEn || 'No headline'}</p>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Summary - 10-50 words</h3>
                <p className="leading-7">{post.summaryEn || 'No summary'}</p>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Full Article</h3>
                <div className="whitespace-pre-wrap leading-7 rounded-md border border-border bg-muted/30 p-4">
                  {post.contentEn || 'No article content available'}
                </div>
              </section>

              <section className="flex flex-wrap gap-2">
                {post.hashtagsEn?.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </section>

              <section className="text-sm text-muted-foreground">
                <p>{post.sourceAttributionEn || 'No source attribution'}</p>
              </section>
            </div>

            {/* Sinhala Content */}
            {post.headlineSi && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Sinhala Content (සිංහල)</h2>
                <section>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Headline (සිංහල)</h3>
                  <p className="text-2xl font-semibold leading-tight">{post.headlineSi}</p>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Summary (සිංහල) - 10-50 words</h3>
                  <p className="leading-7">{post.summarySi}</p>
                </section>

                <section>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Full Article (සිංහල)</h3>
                  <div className="whitespace-pre-wrap leading-7 rounded-md border border-border bg-muted/30 p-4">
                    {post.contentSi}
                  </div>
                </section>

                <section className="flex flex-wrap gap-2">
                  {post.hashtagsSi?.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </section>

                <section className="text-sm text-muted-foreground">
                  <p>{post.sourceAttributionSi}</p>
                </section>
              </div>
            )}

            {!post.headlineSi && (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground">
                Sinhala translation not available. Use the "Translate to Sinhala" option in the Articles tab to translate this article.
              </div>
            )}

            <section className="text-sm text-muted-foreground border-t pt-4">
              {raw?.url ? (
                <p>
                  Source link:{" "}
                  <a href={raw.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    {raw.url}
                  </a>
                </p>
              ) : null}
              {raw?.title ? <p>Original title: {raw.title}</p> : null}
              {raw?.publishedAt ? <p>Published: {new Date(raw.publishedAt as unknown as string).toLocaleString()}</p> : null}
            </section>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Edit Post</CardTitle>
            <CardDescription>Modify headline, summary, full article, hashtags, and category</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <PostEditor
              postId={post._id.toString()}
              initialData={{
                headlineEn: post.headlineEn || '',
                summaryEn: post.summaryEn || '',
                contentEn: post.contentEn || '',
                hashtagsEn: post.hashtagsEn || [],
                headlineSi: post.headlineSi || '',
                summarySi: post.summarySi || '',
                contentSi: post.contentSi || '',
                hashtagsSi: post.hashtagsSi || [],
                category: post.category,
              }}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Approve, reject, regenerate, or delete this post</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <PostActions postId={post._id.toString()} currentStatus={post.status} />
          </div>
        </Card>
      </div>
    </div>
  );
}



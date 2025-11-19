import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateArticle } from "@/components/create-article";
import { ArticleTranslator } from "@/components/article-translator";

export default async function ArticlesPage() {
  return (
    <div className="mx-auto flex w-full max-w-content flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="font-display text-3xl font-semibold">Articles</h1>
        <p className="text-muted-foreground">
          Create Sinhala articles from news and translate text to Sinhala.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Article</CardTitle>
            <CardDescription>Generate a complete Sinhala article from news ID (includes header, summary 10-50 words, source, and full article)</CardDescription>
          </CardHeader>
          <div className="p-6 pt-0">
            <CreateArticle />
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
    </div>
  );
}


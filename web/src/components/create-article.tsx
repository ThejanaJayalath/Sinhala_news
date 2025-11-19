'use client';

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function CreateArticle() {
  const [newsId, setNewsId] = useState('');
  const [article, setArticle] = useState<{
    headlineEn: string;
    summaryEn: string;
    contentEn: string;
    hashtagsEn: string[];
    sourceAttributionEn: string;
  } | null>(null);
  const [articleId, setArticleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!newsId || !/^[a-fA-F0-9]{24}$/.test(newsId)) {
      alert('Please enter a valid news ID');
      return;
    }

    setLoading(true);
    setArticle(null);
    setArticleId(null);
    try {
      const response = await fetch('/api/articles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsId }),
      });
      const data = await response.json();
      
      if (data.ok) {
        setArticle(data.article);
        setArticleId(data.articleId);
      } else {
        if (data.error === 'Article already exists for this news' && data.articleId) {
          if (confirm('Article already exists. Would you like to view it?')) {
            router.push(`/dashboard/posts/${data.articleId}`);
          }
        } else {
          alert(`Failed to create article: ${data.error || 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Error creating article:', error);
      alert('Failed to create article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">News ID</label>
        <input
          type="text"
          value={newsId}
          onChange={(e) => setNewsId(e.target.value)}
          placeholder="Enter news ID from News tab"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Find news IDs in the News tab
        </p>
      </div>

      <Button onClick={handleCreate} loading={loading} className="w-full gap-2">
        <Sparkles className="h-4 w-4" />
        Create Article
      </Button>

      {article && (
        <div className="mt-4 space-y-4 rounded-md border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Generated Article (English)
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Headline</h4>
            <p className="text-sm font-semibold leading-tight">{article.headlineEn}</p>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Summary - 10-50 words</h4>
            <p className="text-sm leading-relaxed">{article.summaryEn}</p>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Full Article</h4>
            <div className="whitespace-pre-wrap text-sm leading-relaxed rounded-md border border-border bg-white p-3">
              {article.contentEn}
            </div>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Hashtags</h4>
            <div className="flex flex-wrap gap-2">
              {article.hashtagsEn.map((tag, idx) => (
                <span key={idx} className="text-sm text-primary">{tag}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-1 text-xs font-medium text-muted-foreground">Source</h4>
            <p className="text-sm">{article.sourceAttributionEn}</p>
          </div>

          {articleId && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  router.push(`/dashboard/posts/${articleId}`);
                }}
              >
                View Full Article
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(article.contentEn);
                  alert('Article content copied to clipboard!');
                }}
              >
                Copy Article
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


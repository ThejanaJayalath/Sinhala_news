'use client';

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function ArticleSummarizer() {
  const [articleId, setArticleId] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSummarize = async () => {
    if (!articleId || !/^[a-fA-F0-9]{24}$/.test(articleId)) {
      alert('Please enter a valid article ID');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}/summarize`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.ok) {
        setSummary(data.summary);
      } else {
        alert(`Failed to summarize: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error summarizing:', error);
      alert('Failed to summarize article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Article ID</label>
        <input
          type="text"
          value={articleId}
          onChange={(e) => setArticleId(e.target.value)}
          placeholder="Enter article ID from the list below"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Find article IDs in the table below
        </p>
      </div>

      <Button onClick={handleSummarize} loading={loading} className="w-full gap-2">
        <Sparkles className="h-4 w-4" />
        Generate Summary
      </Button>

      {summary && (
        <div className="mt-4 rounded-md border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Summary
          </div>
          <p className="text-sm leading-relaxed">{summary}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              navigator.clipboard.writeText(summary);
              alert('Summary copied to clipboard!');
            }}
          >
            Copy Summary
          </Button>
        </div>
      )}
    </div>
  );
}


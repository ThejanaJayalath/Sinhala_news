'use client';

import { useState } from 'react';
import { Languages, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ArticleTranslator() {
  const [text, setText] = useState('');
  const [articleId, setArticleId] = useState('');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!text.trim()) {
      alert('Please enter text to translate');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/articles/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          articleId: articleId || undefined,
        }),
      });
      const data = await response.json();
      
      if (data.ok) {
        setTranslation(data.translation);
      } else {
        alert(`Failed to translate: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error translating:', error);
      alert('Failed to translate text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Text to Translate</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Enter English text to translate to Sinhala..."
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">Article ID (Optional)</label>
        <input
          type="text"
          value={articleId}
          onChange={(e) => setArticleId(e.target.value)}
          placeholder="Optional: Article ID for context"
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Providing article ID adds context for better translation
        </p>
      </div>

      <Button onClick={handleTranslate} loading={loading} className="w-full gap-2">
        <Languages className="h-4 w-4" />
        Translate to Sinhala
      </Button>

      {translation && (
        <div className="mt-4 rounded-md border border-border bg-muted/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <FileText className="h-4 w-4" />
            Sinhala Translation
          </div>
          <p className="text-sm leading-relaxed">{translation}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => {
              navigator.clipboard.writeText(translation);
              alert('Translation copied to clipboard!');
            }}
          >
            Copy Translation
          </Button>
        </div>
      )}
    </div>
  );
}


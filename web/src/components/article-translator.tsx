'use client';

import { useState } from 'react';
import { Languages, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function ArticleTranslator() {
  const [text, setText] = useState('');
  const [articleId, setArticleId] = useState('');
  const [translation, setTranslation] = useState('');
  const [loading, setLoading] = useState(false);
  const [translateArticleMode, setTranslateArticleMode] = useState(false);
  const router = useRouter();

  const handleTranslate = async () => {
    // If translating full article by ID
    if (translateArticleMode) {
      if (!articleId.trim()) {
        alert('Please enter an article ID');
        return;
      }
      if (!/^[a-fA-F0-9]{24}$/.test(articleId.trim())) {
        alert('Please enter a valid article ID');
        return;
      }

      setLoading(true);
      setTranslation('');
      try {
        const response = await fetch('/api/articles/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: articleId.trim(),
            translateFullArticle: true,
          }),
        });
        
        const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
        
        if (!response.ok || !data.ok) {
          throw new Error(data.error || `HTTP ${response.status}: Translation failed`);
        }
        
        if (data.translations) {
          alert('Article translated successfully! Redirecting to view the article...');
          router.push(`/dashboard/posts/${articleId.trim()}`);
        } else {
          throw new Error('Translation failed - no translations returned');
        }
      } catch (error) {
        console.error('Error translating article:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to translate article. Please try again.';
        alert(`Translation error: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Original text translation
    if (!text.trim()) {
      alert('Please enter text to translate');
      return;
    }

    setLoading(true);
    setTranslation(''); // Clear previous translation
    try {
      const response = await fetch('/api/articles/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          articleId: articleId.trim() || undefined,
        }),
      });
      
      const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
      
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${response.status}: Translation failed`);
      }
      
      if (data.translation && data.translation.trim()) {
        setTranslation(data.translation);
      } else {
        throw new Error('Translation failed - no translation returned');
      }
    } catch (error) {
      console.error('Error translating:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to translate text. Please try again.';
      alert(`Translation error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Translation Mode</label>
        <div className="flex gap-2">
          <Button
            variant={!translateArticleMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTranslateArticleMode(false);
              setArticleId('');
            }}
            className="flex-1"
          >
            Translate Text
          </Button>
          <Button
            variant={translateArticleMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setTranslateArticleMode(true);
              setText('');
            }}
            className="flex-1"
          >
            Translate Article
          </Button>
        </div>
      </div>

      {translateArticleMode ? (
        <div>
          <label className="mb-2 block text-sm font-medium">Article ID</label>
          <input
            type="text"
            value={articleId}
            onChange={(e) => setArticleId(e.target.value)}
            placeholder="Enter article ID to translate entire article to Sinhala"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Enter the article ID from the Posts tab to translate the entire article to Sinhala
          </p>
        </div>
      ) : (
        <>
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
        </>
      )}

      <Button 
        onClick={handleTranslate} 
        loading={loading} 
        disabled={loading || (translateArticleMode ? !articleId.trim() : !text.trim())}
        className="w-full gap-2"
      >
        <Languages className="h-4 w-4" />
        {translateArticleMode ? 'Translate Article to Sinhala' : 'Translate to Sinhala'}
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


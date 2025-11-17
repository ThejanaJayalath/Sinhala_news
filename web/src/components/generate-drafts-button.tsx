'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export function GenerateDraftsButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate/text?limit=10', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.ok) {
        // Refresh the page to show new generated posts
        router.refresh();
      } else {
        console.error('Generation failed:', data.error);
        alert(`Failed to generate drafts: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating drafts:', error);
      alert('Failed to generate drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={loading} size="sm" className="gap-2">
      <Sparkles className="h-4 w-4" />
      {loading ? 'Generating...' : 'Generate Drafts'}
    </Button>
  );
}


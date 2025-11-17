'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

interface FetchNewsButtonProps {
	type: 'rss' | 'newsapi';
}

export function FetchNewsButton({ type }: FetchNewsButtonProps) {
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleFetch = async () => {
		setLoading(true);
		try {
			const response = await fetch(`/api/ingest/${type}`, {
				method: 'POST',
			});
			const data = await response.json();
			
			if (data.ok) {
				router.refresh();
				alert(`Successfully fetched ${data.inserted || 0} new articles. ${data.skipped || 0} duplicates skipped.`);
			} else {
				console.error('Fetch failed:', data.error);
				alert(`Failed to fetch news: ${data.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Error fetching news:', error);
			alert('Failed to fetch news. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Button onClick={handleFetch} disabled={loading} size="sm" variant="outline" className="gap-2">
			<RefreshCw className="h-4 w-4" />
			{loading ? 'Fetching...' : `Get New ${type === 'newsapi' ? 'NewsAPI' : 'RSS'} News`}
		</Button>
	);
}


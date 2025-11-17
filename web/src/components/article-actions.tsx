'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type RawArticle } from '@/lib/models';

interface ArticleActionsProps {
	articleId: string;
	articleUrl: string;
	currentStatus: RawArticle['status'];
	onUpdate?: () => void;
}

export function ArticleActions({ articleId, articleUrl, currentStatus, onUpdate }: ArticleActionsProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const router = useRouter();

	const handleAction = async (action: string, data?: Record<string, unknown>) => {
		setLoading(action);
		try {
			const response = await fetch(`/api/articles/${articleId}${action === 'reload' ? '/reload' : ''}`, {
				method: action === 'reload' ? 'POST' : action === 'delete' ? 'DELETE' : 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: data ? JSON.stringify(data) : undefined,
			});
			const result = await response.json();
			if (result.ok) {
				router.refresh();
				onUpdate?.();
			} else {
				alert(`Failed: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Action failed:', error);
			alert('Failed to perform action');
		} finally {
			setLoading(null);
		}
	};

	return (
		<div className="flex flex-wrap gap-2">
			<Button
				size="sm"
				variant="outline"
				onClick={() => window.open(articleUrl, '_blank')}
				className="gap-2"
			>
				<ExternalLink className="h-4 w-4" />
				View
			</Button>
			{currentStatus !== 'queued' && (
				<Button
					size="sm"
					variant="outline"
					onClick={() => handleAction('reload')}
					loading={loading === 'reload'}
					disabled={!!loading}
					className="gap-2"
				>
					<RefreshCw className="h-4 w-4" />
					Reload
				</Button>
			)}
			<Button
				size="sm"
				variant="outline"
				onClick={() => {
					if (confirm('Are you sure you want to delete this article?')) {
						handleAction('delete');
					}
				}}
				loading={loading === 'delete'}
				disabled={!!loading}
				className="gap-2 text-destructive hover:text-destructive"
			>
				<Trash2 className="h-4 w-4" />
				Delete
			</Button>
		</div>
	);
}


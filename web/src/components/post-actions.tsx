'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type GeneratedPost } from '@/lib/models';

interface PostActionsProps {
	postId: string;
	currentStatus: GeneratedPost['status'];
	onUpdate?: () => void;
}

export function PostActions({ postId, currentStatus, onUpdate }: PostActionsProps) {
	const [loading, setLoading] = useState<string | null>(null);
	const router = useRouter();

	const handleAction = async (action: string, data?: Record<string, unknown>) => {
		setLoading(action);
		try {
			const response = await fetch(`/api/posts/${postId}${action === 'regenerate' ? '/regenerate' : ''}`, {
				method: action === 'regenerate' ? 'POST' : action === 'delete' ? 'DELETE' : 'PATCH',
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
			{currentStatus === 'draft' && (
				<>
					<Button
						size="sm"
						variant="default"
						onClick={() => handleAction('approve', { status: 'approved' })}
						loading={loading === 'approve'}
						disabled={!!loading}
						className="gap-2"
					>
						<Check className="h-4 w-4" />
						Approve
					</Button>
					<Button
						size="sm"
						variant="destructive"
						onClick={() => handleAction('reject', { status: 'rejected' })}
						loading={loading === 'reject'}
						disabled={!!loading}
						className="gap-2"
					>
						<X className="h-4 w-4" />
						Reject
					</Button>
				</>
			)}
			<Button
				size="sm"
				variant="outline"
				onClick={() => handleAction('regenerate')}
				loading={loading === 'regenerate'}
				disabled={!!loading}
				className="gap-2"
			>
				<RefreshCw className="h-4 w-4" />
				Regenerate
			</Button>
			<Button
				size="sm"
				variant="outline"
				onClick={() => {
					if (confirm('Are you sure you want to delete this post?')) {
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


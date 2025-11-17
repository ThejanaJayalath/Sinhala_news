'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type SourceCategory, type GeneratedPost } from '@/lib/models';

export function PostsFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const status = searchParams.get('status') || '';
	const category = searchParams.get('category') || '';

	const updateFilter = (key: string, value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		if (value) {
			params.set(key, value);
		} else {
			params.delete(key);
		}
		router.push(`/dashboard?${params.toString()}`);
	};

	return (
		<div className="flex flex-wrap gap-3">
			<select
				value={status}
				onChange={(e) => updateFilter('status', e.target.value)}
				className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				<option value="">All Statuses</option>
				<option value="draft">Draft</option>
				<option value="approved">Approved</option>
				<option value="rejected">Rejected</option>
				<option value="scheduled">Scheduled</option>
				<option value="published">Published</option>
			</select>

			<select
				value={category}
				onChange={(e) => updateFilter('category', e.target.value)}
				className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				<option value="">All Categories</option>
				<option value="global">Global</option>
				<option value="entertainment">Entertainment</option>
				<option value="anime_comics">Anime/Comics</option>
				<option value="tech">Tech</option>
			</select>

			{(status || category) && (
				<button
					onClick={() => router.push('/dashboard')}
					className="rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60"
				>
					Clear filters
				</button>
			)}
		</div>
	);
}


'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { type SourceCategory, type RawArticle } from '@/lib/models';

export function ArticlesFilter() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const category = searchParams.get('category') || '';
	const status = searchParams.get('status') || '';

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
				value={category}
				onChange={(e) => updateFilter('articleCategory', e.target.value)}
				className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				<option value="">All Categories</option>
				<option value="tech">Tech</option>
				<option value="entertainment">Entertainment</option>
				<option value="anime_comics">Anime/Comics</option>
				<option value="games">Games</option>
			</select>

			<select
				value={status}
				onChange={(e) => updateFilter('articleStatus', e.target.value)}
				className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
			>
				<option value="">All Statuses</option>
				<option value="queued">Queued</option>
				<option value="processed">Processed</option>
				<option value="failed">Failed</option>
			</select>

			{(category || status) && (
				<button
					onClick={() => {
						const params = new URLSearchParams(searchParams.toString());
						params.delete('articleCategory');
						params.delete('articleStatus');
						router.push(`/dashboard?${params.toString()}`);
					}}
					className="rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-muted/60"
				>
					Clear filters
				</button>
			)}
		</div>
	);
}


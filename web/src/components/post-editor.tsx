'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type GeneratedPost } from '@/lib/models';

interface PostEditorProps {
	postId: string;
	initialData: {
		headlineSi: string;
		summarySi: string;
		hashtagsSi: string[];
		category: GeneratedPost['category'];
	};
	onSave?: () => void;
}

export function PostEditor({ postId, initialData, onSave }: PostEditorProps) {
	const [headline, setHeadline] = useState(initialData.headlineSi);
	const [summary, setSummary] = useState(initialData.summarySi);
	const [hashtags, setHashtags] = useState(initialData.hashtagsSi.join(' '));
	const [category, setCategory] = useState(initialData.category);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setHeadline(initialData.headlineSi);
		setSummary(initialData.summarySi);
		setHashtags(initialData.hashtagsSi.join(' '));
		setCategory(initialData.category);
	}, [initialData]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const hashtagsArray = hashtags
				.split(' ')
				.map((t) => t.trim())
				.filter((t) => t.length > 0 && t.startsWith('#'));

			const response = await fetch(`/api/posts/${postId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					headlineSi: headline,
					summarySi: summary,
					hashtagsSi: hashtagsArray,
					category,
				}),
			});
			const result = await response.json();
			if (result.ok) {
				onSave?.();
			} else {
				alert(`Failed to save: ${result.error || 'Unknown error'}`);
			}
		} catch (error) {
			console.error('Save failed:', error);
			alert('Failed to save changes');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<label className="mb-2 block text-sm font-medium">Headline (සිංහල)</label>
				<input
					type="text"
					value={headline}
					onChange={(e) => setHeadline(e.target.value)}
					className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<div>
				<label className="mb-2 block text-sm font-medium">Summary (සිංහල)</label>
				<textarea
					value={summary}
					onChange={(e) => setSummary(e.target.value)}
					rows={5}
					className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<div>
				<label className="mb-2 block text-sm font-medium">Hashtags (space-separated, start with #)</label>
				<input
					type="text"
					value={hashtags}
					onChange={(e) => setHashtags(e.target.value)}
					placeholder="#පුවත් #දැනගන්න"
					className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<div>
				<label className="mb-2 block text-sm font-medium">Category</label>
				<select
					value={category}
					onChange={(e) => setCategory(e.target.value as GeneratedPost['category'])}
					className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
				>
					<option value="tech">Tech</option>
					<option value="entertainment">Entertainment</option>
					<option value="anime_comics">Anime/Comics</option>
					<option value="games">Games</option>
				</select>
			</div>

			<Button onClick={handleSave} loading={loading} className="gap-2">
				<Save className="h-4 w-4" />
				Save Changes
			</Button>
		</div>
	);
}


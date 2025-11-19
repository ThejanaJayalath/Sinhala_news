'use client';

import { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type GeneratedPost } from '@/lib/models';

interface PostEditorProps {
	postId: string;
	initialData: {
		headlineEn: string;
		summaryEn: string;
		contentEn: string;
		hashtagsEn: string[];
		headlineSi: string;
		summarySi: string;
		contentSi: string;
		hashtagsSi: string[];
		category: GeneratedPost['category'];
	};
	onSave?: () => void;
}

export function PostEditor({ postId, initialData, onSave }: PostEditorProps) {
	const [headlineEn, setHeadlineEn] = useState(initialData.headlineEn);
	const [summaryEn, setSummaryEn] = useState(initialData.summaryEn);
	const [contentEn, setContentEn] = useState(initialData.contentEn);
	const [hashtagsEn, setHashtagsEn] = useState(initialData.hashtagsEn.join(' '));
	const [headlineSi, setHeadlineSi] = useState(initialData.headlineSi);
	const [summarySi, setSummarySi] = useState(initialData.summarySi);
	const [contentSi, setContentSi] = useState(initialData.contentSi);
	const [hashtagsSi, setHashtagsSi] = useState(initialData.hashtagsSi.join(' '));
	const [category, setCategory] = useState(initialData.category);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setHeadlineEn(initialData.headlineEn);
		setSummaryEn(initialData.summaryEn);
		setContentEn(initialData.contentEn);
		setHashtagsEn(initialData.hashtagsEn.join(' '));
		setHeadlineSi(initialData.headlineSi);
		setSummarySi(initialData.summarySi);
		setContentSi(initialData.contentSi);
		setHashtagsSi(initialData.hashtagsSi.join(' '));
		setCategory(initialData.category);
	}, [initialData]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const hashtagsEnArray = hashtagsEn
				.split(' ')
				.map((t) => t.trim())
				.filter((t) => t.length > 0 && (t.startsWith('#') || t.length > 0));
			const hashtagsSiArray = hashtagsSi
				.split(' ')
				.map((t) => t.trim())
				.filter((t) => t.length > 0 && (t.startsWith('#') || t.length > 0));

			const response = await fetch(`/api/posts/${postId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					headlineEn,
					summaryEn,
					contentEn,
					hashtagsEn: hashtagsEnArray,
					headlineSi: headlineSi || undefined,
					summarySi: summarySi || undefined,
					contentSi: contentSi || undefined,
					hashtagsSi: hashtagsSiArray.length > 0 ? hashtagsSiArray : undefined,
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
		<div className="space-y-6">
			{/* English Section */}
			<div className="space-y-4 border-b pb-6">
				<h3 className="text-base font-semibold">English Content</h3>
				<div>
					<label className="mb-2 block text-sm font-medium">Headline</label>
					<input
						type="text"
						value={headlineEn}
						onChange={(e) => setHeadlineEn(e.target.value)}
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium">Summary - 10-50 words</label>
					<textarea
						value={summaryEn}
						onChange={(e) => setSummaryEn(e.target.value)}
						rows={3}
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						placeholder="Short summary (10-50 words)"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium">Full Article</label>
					<textarea
						value={contentEn}
						onChange={(e) => setContentEn(e.target.value)}
						rows={8}
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
						placeholder="Complete article content"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium">Hashtags (space-separated, start with #)</label>
					<input
						type="text"
						value={hashtagsEn}
						onChange={(e) => setHashtagsEn(e.target.value)}
						placeholder="#News #Breaking"
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			{/* Sinhala Section */}
			<div className="space-y-4">
				<h3 className="text-base font-semibold">Sinhala Content (සිංහල)</h3>
				<div>
					<label className="mb-2 block text-sm font-medium">Headline (සිංහල)</label>
					<input
						type="text"
						value={headlineSi}
						onChange={(e) => setHeadlineSi(e.target.value)}
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						placeholder="Leave empty if not translated yet"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium">Summary (සිංහල) - 10-50 words</label>
					<textarea
						value={summarySi}
						onChange={(e) => setSummarySi(e.target.value)}
						rows={3}
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
						placeholder="Short summary (10-50 words) - Leave empty if not translated yet"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium">Full Article (සිංහල)</label>
					<textarea
						value={contentSi}
						onChange={(e) => setContentSi(e.target.value)}
						rows={8}
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
						placeholder="Complete article content in Sinhala - Leave empty if not translated yet"
					/>
				</div>

				<div>
					<label className="mb-2 block text-sm font-medium">Hashtags (space-separated, start with #)</label>
					<input
						type="text"
						value={hashtagsSi}
						onChange={(e) => setHashtagsSi(e.target.value)}
						placeholder="#පුවත් #දැනගන්න"
						className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
					/>
				</div>
			</div>

			{/* Category */}

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


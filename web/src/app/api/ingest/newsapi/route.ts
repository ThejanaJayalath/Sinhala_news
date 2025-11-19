import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, type RawArticle } from '@/lib/models';
import { generateCanonicalId, normalizeUrl } from '@/lib/canonical';
import { fetchArticleContent } from '@/lib/article-fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type NewsApiArticle = {
	title?: string;
	url?: string;
	urlToImage?: string;
	publishedAt?: string;
	author?: string;
	description?: string;
	content?: string;
	source?: { id?: string; name?: string };
};

function buildNewsApiUrl(category: string): string {
	const apiKey = process.env.NEWSAPI_KEY;
	if (!apiKey) {
		throw new Error('Missing NEWSAPI_KEY');
	}
	// Map categories to top-headlines categories
	const cat =
		category === 'tech'
			? 'technology'
			: category === 'entertainment'
			? 'entertainment'
			: category === 'games'
			? 'technology' // NewsAPI doesn't have games, use technology as fallback
			: 'general';
	const base = new URL('https://newsapi.org/v2/top-headlines');
	base.searchParams.set('language', 'en');
	base.searchParams.set('pageSize', '50');
	base.searchParams.set('category', cat);
	base.searchParams.set('apiKey', apiKey);
	return base.toString();
}

export async function POST() {
	try {
		const db = await getDb();
		const { sources, rawArticles } = await collections(db);
		// Only fetch from allowed categories: tech, entertainment, anime_comics, games
		const allowedCategories: string[] = ['tech', 'entertainment', 'anime_comics', 'games'];
		const enabled = await sources
			.find({ enabled: true, type: 'newsapi', category: { $in: allowedCategories } })
			.toArray();
		if (enabled.length === 0) {
			return NextResponse.json({ ok: true, sources: 0, inserted: 0, skipped: 0 });
		}

		let inserted = 0;
		let skipped = 0;
		const errors: Array<{ source: string; message: string }> = [];

		for (const s of enabled) {
			try {
				const url = s.url || buildNewsApiUrl(s.category);
				const res = await fetch(url, {
					cache: 'no-store',
					headers: { 'user-agent': 'SinhalaNewsBot/1.0 (+http://localhost)' },
				});
				if (!res.ok) {
					errors.push({ source: s.name, message: `fetch ${res.status} ${res.statusText}` });
					await sources.updateOne(
						{ _id: s._id },
						{ $inc: { failureCount: 1 }, $set: { updatedAt: new Date() } },
					);
					continue;
				}
				const data = (await res.json()) as { status: string; totalResults: number; articles: NewsApiArticle[] };
				if (!Array.isArray(data.articles) || data.articles.length === 0) {
					errors.push({ source: s.name, message: 'no-articles' });
					continue;
				}
				for (const a of data.articles) {
					const link = a.url ? normalizeUrl(a.url) : undefined;
					if (!link) {
						skipped++;
						continue;
					}
					const canonicalId = generateCanonicalId(link);
					const now = new Date();
					
					// News API usually only provides a short snippet in the 'content' field
					// Try to fetch full article content if the snippet is too short
					let articleContent = a.content;
					if (!articleContent || articleContent.length < 500) {
						// Fetch full content asynchronously (don't wait for it to complete)
						// This improves content quality without blocking ingestion
						fetchArticleContent(link).then(fetchedContent => {
							if (fetchedContent && fetchedContent.length > 500) {
								// Update the article with fetched content in the background
								rawArticles.updateOne(
									{ canonicalId },
									{ $set: { content: fetchedContent, updatedAt: new Date() } }
								).catch(err => {
									console.error(`[ingest:newsapi] Failed to update content for ${link}:`, err);
								});
							}
						}).catch(err => {
							console.error(`[ingest:newsapi] Failed to fetch content for ${link}:`, err);
						});
					}
					
					const doc: Omit<RawArticle, 'id' | '_id'> = {
						sourceId: s._id!,
						sourceName: s.name,
						category: s.category, // Store category from source
						title: a.title || link,
						url: link,
						canonicalId,
						publishedAt: a.publishedAt ? new Date(a.publishedAt) : undefined,
						author: a.author,
						description: a.description,
						content: articleContent, // Will be updated with full content if fetch succeeds
						imageUrl: a.urlToImage,
						language: 'en',
						status: 'queued',
						createdAt: now,
						updatedAt: now,
					};
					const up = await rawArticles.updateOne(
						{ canonicalId },
						{
							$setOnInsert: {
								sourceId: doc.sourceId,
								sourceName: doc.sourceName,
								category: doc.category,
								title: doc.title,
								url: doc.url,
								canonicalId: doc.canonicalId,
								publishedAt: doc.publishedAt,
								author: doc.author,
								description: doc.description,
								content: doc.content,
								imageUrl: doc.imageUrl,
								language: doc.language,
								status: doc.status,
								createdAt: doc.createdAt,
							},
							$set: { updatedAt: now },
						},
						{ upsert: true },
					);
					if (up.upsertedId) {
						inserted++;
					} else {
						skipped++;
					}
				}
				await sources.updateOne(
					{ _id: s._id },
					{ $set: { lastFetchedAt: new Date(), updatedAt: new Date() } },
				);
			} catch (e: any) {
				const msg = e?.message || String(e);
				errors.push({ source: s.name, message: msg });
				await sources.updateOne(
					{ _id: s._id },
					{ $inc: { failureCount: 1 }, $set: { updatedAt: new Date() } },
				);
			}
		}

		return NextResponse.json({ ok: true, sources: enabled.length, inserted, skipped, errors });
	} catch (error) {
		console.error('[ingest:newsapi]', error);
		return NextResponse.json({ ok: false, error: 'NewsAPI ingestion failed' }, { status: 500 });
	}
}



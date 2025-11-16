import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';
import { getDb } from '@/lib/db';
import { collections, type RawArticle } from '@/lib/models';
import { generateCanonicalId, normalizeUrl } from '@/lib/canonical';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RssItem = {
	title?: string;
	link?: string;
	pubDate?: string;
	content?: string;
	description?: string;
	author?: string;
};

function extractItems(feed: any): RssItem[] {
	// Handles common RSS and Atom shapes
	if (feed?.rss?.channel?.item) {
		return Array.isArray(feed.rss.channel.item) ? feed.rss.channel.item : [feed.rss.channel.item];
	}
	if (feed?.feed?.entry) {
		const entries = Array.isArray(feed.feed.entry) ? feed.feed.entry : [feed.feed.entry];
		return entries.map((e: any) => ({
			title: e.title?.['#text'] || e.title,
			link: typeof e.link === 'string' ? e.link : e.link?.['@_href'] || e.link?.href,
			pubDate: e.updated || e.published,
			content: e.content?.['#text'] || e.summary?.['#text'] || e.content || e.summary,
			author: e.author?.name || e.author,
		}));
	}
	return [];
}

export async function POST() {
	try {
		const db = await getDb();
		const { sources, rawArticles } = await collections(db);
		const enabledRss = await sources.find({ enabled: true, type: 'rss' }).toArray();
		if (enabledRss.length === 0) {
			return NextResponse.json({ ok: true, sources: 0, inserted: 0, skipped: 0 });
		}

		const parser = new XMLParser({
			ignoreAttributes: false,
			attributeNamePrefix: '@_',
			textNodeName: '#text',
			trimValues: true,
		});

		let inserted = 0;
		let skipped = 0;
		const errors: Array<{ source: string; message: string }> = [];

		for (const s of enabledRss) {
			try {
				if (!s.url) continue;
				const res = await fetch(s.url, {
					// Avoid caches and signal we want XML
					cache: 'no-store',
					headers: {
						'user-agent': 'SinhalaNewsBot/1.0 (+http://localhost)',
						accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
					},
				});
				if (!res.ok) {
					const msg = `fetch ${res.status} ${res.statusText}`;
					console.warn('[rss] fetch failed', s.name, msg);
					errors.push({ source: s.name, message: msg });
					continue;
				}
				const text = await res.text();
				let json: any;
				try {
					json = parser.parse(text);
				} catch (e: any) {
					const msg = `xml-parse-error: ${e?.message || String(e)}`;
					console.warn('[rss] parse failed', s.name, msg);
					errors.push({ source: s.name, message: msg });
					continue;
				}
				const items = extractItems(json);
				if (!items || items.length === 0) {
					errors.push({ source: s.name, message: 'no-items-in-feed' });
					continue;
				}

				for (const item of items) {
					const link = item.link ? normalizeUrl(item.link) : undefined;
					if (!link) {
						skipped++;
						continue;
					}
					const canonicalId = generateCanonicalId(link);
					const now = new Date();
				const doc: Omit<RawArticle, 'id' | '_id'> = {
						sourceId: s._id!,
						sourceName: s.name,
						title: item.title || link,
						url: link,
						canonicalId,
						publishedAt: item.pubDate ? new Date(item.pubDate) : undefined,
						author: item.author,
						description: item.description,
						content: item.content,
						language: 'en',
						status: 'queued',
						createdAt: now,
					updatedAt: now,
					};
					const up = await rawArticles.updateOne(
						{ canonicalId },
						{
							// Avoid path conflicts: do not include updatedAt in $setOnInsert since it's also in $set
							$setOnInsert: {
								sourceId: doc.sourceId,
								sourceName: doc.sourceName,
								title: doc.title,
								url: doc.url,
								canonicalId: doc.canonicalId,
								publishedAt: doc.publishedAt,
								author: doc.author,
								description: doc.description,
								content: doc.content,
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
				// mark source success
				await (await collections()).sources.updateOne(
					{ _id: s._id },
					{ $set: { lastFetchedAt: new Date(), updatedAt: new Date() }, $setOnInsert: {} },
				);
			} catch (e: any) {
				const msg = e?.message || String(e);
				console.error('[rss] source-error', s.name, msg);
				errors.push({ source: s.name, message: msg });
				// mark source failure
				await (await collections()).sources.updateOne(
					{ _id: s._id },
					{ $inc: { failureCount: 1 }, $set: { updatedAt: new Date() } },
				);
				continue;
			}
		}

		return NextResponse.json({ ok: true, sources: enabledRss.length, inserted, skipped, errors });
	} catch (error) {
		console.error('[ingest:rss]', error);
		return NextResponse.json({ ok: false, error: 'RSS ingestion failed' }, { status: 500 });
	}
}



import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, ensureIndexes, type Source, type Template } from '@/lib/models';

export async function POST() {
	try {
		const db = await getDb();
		await ensureIndexes(db);

		const { templates, sources } = await collections(db);

		const now = new Date();

		// Seed default templates (idempotent)
		const defaultTemplates: Array<Omit<Template, 'id' | '_id'>> = [
			{
				name: 'Default Square',
				version: 1,
				category: undefined,
				layout: {
					canvas: { width: 1080, height: 1080 },
					overlay: { padding: 48, headline: { x: 72, y: 780, maxWidth: 936 } },
					watermark: { position: 'bottom-right', offset: 32 },
				},
				active: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				name: 'Default Link',
				version: 1,
				category: undefined,
				layout: {
					canvas: { width: 1200, height: 630 },
					overlay: { padding: 40, headline: { x: 64, y: 420, maxWidth: 1072 } },
					watermark: { position: 'bottom-right', offset: 24 },
				},
				active: true,
				createdAt: now,
				updatedAt: now,
			},
		];

		for (const t of defaultTemplates) {
			await templates.updateOne(
				{ name: t.name, version: t.version },
				{ $setOnInsert: t },
				{ upsert: true },
			);
		}

		// Seed example sources (idempotent)
		const defaultSources: Array<Omit<Source, 'id' | '_id'>> = [
			{
				name: 'Reuters World RSS',
				type: 'rss',
				url: 'https://feeds.reuters.com/reuters/worldNews',
				category: 'global',
				enabled: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				name: 'The Verge RSS',
				type: 'rss',
				url: 'https://www.theverge.com/rss/index.xml',
				category: 'tech',
				enabled: true,
				createdAt: now,
				updatedAt: now,
			},
			{
				name: 'Anime News Network RSS',
				type: 'rss',
				url: 'https://www.animenewsnetwork.com/all/rss.xml',
				category: 'anime_comics',
				enabled: true,
				createdAt: now,
				updatedAt: now,
			},
		];

		for (const s of defaultSources) {
			await sources.updateOne(
				{ name: s.name },
				{
					$setOnInsert: { createdAt: s.createdAt },
					$set: {
						type: s.type,
						url: s.url,
						category: s.category,
						enabled: s.enabled,
						updatedAt: s.updatedAt,
					},
				},
				{ upsert: true },
			);
		}

		return NextResponse.json({
			ok: true,
			seeded: {
				templates: defaultTemplates.map((t) => t.name),
				sources: defaultSources.map((s) => s.name),
			},
		});
	} catch (error) {
		console.error('[seed-admin]', error);
		return NextResponse.json({ ok: false, error: 'Seeding failed' }, { status: 500 });
	}
}



import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getDb } from '@/lib/db';
import { collections, ensureIndexes, type Source, type Template, type User } from '@/lib/models';

export async function POST() {
	try {
		const db = await getDb();
		await ensureIndexes(db);

		const { users, templates, sources } = await collections(db);

		// Seed admin user (idempotent)
		const adminEmail = process.env.ADMIN_EMAIL || 'admin@sinhala.news';
		const adminPassword = process.env.ADMIN_PASSWORD || 'SinhalaNews#2025';
		const passwordHash = await bcrypt.hash(adminPassword, 10);

		const now = new Date();

		const adminUser: Omit<User, 'id' | '_id'> = {
			email: adminEmail,
			passwordHash,
			role: 'admin',
			createdAt: now,
			updatedAt: now,
		};

		await users.updateOne(
			{ email: adminUser.email },
			{
				$setOnInsert: { createdAt: adminUser.createdAt },
				$set: {
					passwordHash: adminUser.passwordHash,
					role: adminUser.role,
					updatedAt: adminUser.updatedAt,
				},
			},
			{ upsert: true },
		);

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
				url: 'https://www.reutersagency.com/feed/?best-topics=world&post_type=best',
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
				adminEmail,
				templates: defaultTemplates.map((t) => t.name),
				sources: defaultSources.map((s) => s.name),
			},
		});
	} catch (error) {
		console.error('[seed-admin]', error);
		return NextResponse.json({ ok: false, error: 'Seeding failed' }, { status: 500 });
	}
}



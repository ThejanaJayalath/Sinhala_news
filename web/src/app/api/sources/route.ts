import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, type Source, type SourceCategory } from '@/lib/models';

export async function GET() {
	try {
		const db = await getDb();
		const { sources } = await collections(db);
		const list = await sources
			.find({}, { projection: { _id: 0 } })
			.sort({ createdAt: -1 })
			.toArray();
		return NextResponse.json({ ok: true, sources: list });
	} catch (error) {
		const message = (error as Error)?.message || 'Failed to fetch sources';
		console.error('[sources:get]', message);
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as Partial<Source>;
		if (!body?.name || !body?.type) {
			return NextResponse.json({ ok: false, error: 'name and type are required' }, { status: 400 });
		}
		if (body.type === 'rss' && !body.url) {
			return NextResponse.json({ ok: false, error: 'url is required for rss sources' }, { status: 400 });
		}
		const category = (body.category ?? 'global') as SourceCategory;
		const db = await getDb();
		const { sources } = await collections(db);
		const now = new Date();
		const toInsert: Omit<Source, 'id' | '_id'> = {
			name: body.name,
			type: body.type,
			url: body.url,
			apiKeyRef: body.apiKeyRef,
			category,
			enabled: body.enabled ?? true,
			createdAt: now,
			updatedAt: now,
		};
		await sources.updateOne(
			{ name: toInsert.name },
			{
				$setOnInsert: { createdAt: toInsert.createdAt },
				$set: {
					type: toInsert.type,
					url: toInsert.url,
					apiKeyRef: toInsert.apiKeyRef,
					category: toInsert.category,
					enabled: toInsert.enabled,
					updatedAt: toInsert.updatedAt,
				},
			},
			{ upsert: true },
		);
		return NextResponse.json({ ok: true });
	} catch (error) {
		const message = (error as Error)?.message || 'Failed to create source';
		console.error('[sources:post]', message);
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}

export async function PATCH(request: Request) {
	try {
		const body = (await request.json()) as {
			name?: string;
			enabled?: boolean;
			url?: string;
			category?: SourceCategory;
			resetFailures?: boolean;
		};
		if (!body?.name) {
			return NextResponse.json({ ok: false, error: 'name is required' }, { status: 400 });
		}
		const db = await getDb();
		const { sources } = await collections(db);
		const now = new Date();
		const update: Record<string, unknown> = { updatedAt: now };
		if (typeof body.enabled === 'boolean') update.enabled = body.enabled;
		if (typeof body.url === 'string') update.url = body.url;
		if (typeof body.category === 'string') update.category = body.category;
		if (body.resetFailures) update.failureCount = 0;
		const res = await sources.updateOne({ name: body.name }, { $set: update });
		if (res.matchedCount === 0) {
			return NextResponse.json({ ok: false, error: 'source not found' }, { status: 404 });
		}
		return NextResponse.json({ ok: true });
	} catch (error) {
		const message = (error as Error)?.message || 'Failed to update source';
		console.error('[sources:patch]', message);
		return NextResponse.json({ ok: false, error: message }, { status: 500 });
	}
}



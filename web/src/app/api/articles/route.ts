import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, type RawArticle, type SourceCategory } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - List raw articles with filters
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const category = searchParams.get('category') as SourceCategory | null;
		const status = searchParams.get('status') as RawArticle['status'] | null;
		const sourceName = searchParams.get('source');
		const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
		const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0);

		const db = await getDb();
		const { rawArticles } = await collections(db);

		const query: Record<string, unknown> = {};
		if (category) query.category = category;
		if (status) query.status = status;
		if (sourceName) query.sourceName = sourceName;

		const articles = await rawArticles
			.find(query, { projection: { _id: 1, title: 1, sourceName: 1, category: 1, status: 1, url: 1, createdAt: 1, publishedAt: 1 } })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray();

		const total = await rawArticles.countDocuments(query);

		return NextResponse.json({ ok: true, articles, total, limit, skip });
	} catch (error) {
		console.error('[articles:get]', error);
		return NextResponse.json({ ok: false, error: 'Failed to fetch articles' }, { status: 500 });
	}
}


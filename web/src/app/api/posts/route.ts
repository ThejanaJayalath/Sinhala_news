import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, type GeneratedPost, type SourceCategory } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - List posts with filters
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const status = searchParams.get('status') as GeneratedPost['status'] | null;
		const category = searchParams.get('category') as SourceCategory | null;
		const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);
		const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10) || 0, 0);

		const db = await getDb();
		const { generatedPosts } = await collections(db);

		const query: Record<string, unknown> = {};
		if (status) query.status = status;
		if (category) query.category = category;

		const posts = await generatedPosts
			.find(query, { projection: { _id: 1, headlineSi: 1, category: 1, status: 1, createdAt: 1, updatedAt: 1, sourceAttribution: 1 } })
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.toArray();

		const total = await generatedPosts.countDocuments(query);

		return NextResponse.json({ ok: true, posts, total, limit, skip });
	} catch (error) {
		console.error('[posts:get]', error);
		return NextResponse.json({ ok: false, error: 'Failed to fetch posts' }, { status: 500 });
	}
}


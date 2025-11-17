import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { collections } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Reload/refetch a single article (reset status to queued)
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid article ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const db = await getDb();
		const { rawArticles } = await collections(db);

		const result = await rawArticles.updateOne(
			{ _id },
			{ $set: { status: 'queued', updatedAt: new Date() } },
		);
		if (result.matchedCount === 0) {
			return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('[articles:reload]', error);
		return NextResponse.json({ ok: false, error: 'Failed to reload article' }, { status: 500 });
	}
}


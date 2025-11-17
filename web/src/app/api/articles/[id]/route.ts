import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { collections, type RawArticle } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch a single raw article
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid article ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const db = await getDb();
		const { rawArticles } = await collections(db);
		const article = await rawArticles.findOne({ _id });
		if (!article) {
			return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
		}
		return NextResponse.json({ ok: true, article });
	} catch (error) {
		console.error('[articles:get]', error);
		return NextResponse.json({ ok: false, error: 'Failed to fetch article' }, { status: 500 });
	}
}

// DELETE - Delete a raw article
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid article ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const db = await getDb();
		const { rawArticles } = await collections(db);
		const result = await rawArticles.deleteOne({ _id });
		if (result.deletedCount === 0) {
			return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
		}
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('[articles:delete]', error);
		return NextResponse.json({ ok: false, error: 'Failed to delete article' }, { status: 500 });
	}
}

// PATCH - Update article status (e.g., mark as processed, reload)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid article ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const body = (await request.json()) as {
			status?: RawArticle['status'];
		};

		const db = await getDb();
		const { rawArticles } = await collections(db);
		const now = new Date();
		const update: Record<string, unknown> = { updatedAt: now };

		if (typeof body.status === 'string') update.status = body.status;

		const result = await rawArticles.updateOne({ _id }, { $set: update });
		if (result.matchedCount === 0) {
			return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('[articles:patch]', error);
		return NextResponse.json({ ok: false, error: 'Failed to update article' }, { status: 500 });
	}
}


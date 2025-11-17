import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { collections, type GeneratedPost, type SourceCategory } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch a single post
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid post ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const db = await getDb();
		const { generatedPosts } = await collections(db);
		const post = await generatedPosts.findOne({ _id });
		if (!post) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}
		return NextResponse.json({ ok: true, post });
	} catch (error) {
		console.error('[posts:get]', error);
		return NextResponse.json({ ok: false, error: 'Failed to fetch post' }, { status: 500 });
	}
}

// PATCH - Update post fields (edit, approve, reject, schedule)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid post ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const body = (await request.json()) as {
			headlineSi?: string;
			summarySi?: string;
			hashtagsSi?: string[];
			status?: GeneratedPost['status'];
			category?: SourceCategory;
			scheduledAt?: string | null;
		};

		const db = await getDb();
		const { generatedPosts } = await collections(db);
		const now = new Date();
		const update: Record<string, unknown> = { updatedAt: now };

		if (typeof body.headlineSi === 'string') update.headlineSi = body.headlineSi;
		if (typeof body.summarySi === 'string') update.summarySi = body.summarySi;
		if (Array.isArray(body.hashtagsSi)) update.hashtagsSi = body.hashtagsSi;
		if (typeof body.status === 'string') update.status = body.status;
		if (typeof body.category === 'string') update.category = body.category;
		if (body.scheduledAt !== undefined) {
			update.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
		}

		const result = await generatedPosts.updateOne({ _id }, { $set: update });
		if (result.matchedCount === 0) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('[posts:patch]', error);
		return NextResponse.json({ ok: false, error: 'Failed to update post' }, { status: 500 });
	}
}

// DELETE - Delete a post
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid post ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const db = await getDb();
		const { generatedPosts } = await collections(db);
		const result = await generatedPosts.deleteOne({ _id });
		if (result.deletedCount === 0) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error('[posts:delete]', error);
		return NextResponse.json({ ok: false, error: 'Failed to delete post' }, { status: 500 });
	}
}


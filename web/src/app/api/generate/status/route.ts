import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
	try {
		const db = await getDb();
		const { rawArticles, generatedPosts } = await collections(db);

		const queuedCount = await rawArticles.countDocuments({ status: 'queued' });
		const withoutGenerated = await rawArticles
			.aggregate([
				{ $match: { status: 'queued' } },
				{
					$lookup: {
						from: 'generated_posts',
						localField: '_id',
						foreignField: 'rawArticleId',
						as: 'gp',
					},
				},
				{ $match: { gp: { $size: 0 } } },
				{ $count: 'count' },
			])
			.toArray();
		const unprocessed = withoutGenerated[0]?.count ?? 0;
		const drafts = await generatedPosts.countDocuments({ status: 'draft' });

		return NextResponse.json({
			ok: true,
			queuedCount,
			unprocessed,
			drafts,
		});
	} catch (error) {
		console.error('[generate:status]', error);
		return NextResponse.json({ ok: false, error: 'status failed' }, { status: 500 });
	}
}




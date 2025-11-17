import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, type GeneratedPost } from '@/lib/models';
import { buildSinhalaNewsPrompt } from '@/lib/prompt';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenResult = {
	headlineSi: string;
	summarySi: string;
	hashtagsSi: string[];
	sourceAttribution: string;
};

function mockGenerate(title: string, sourceName: string): GenResult {
	const baseHeadline = `තත්කාලීන: ${title.slice(0, 60)}`;
	const summary =
		`මෙම පුවත ${sourceName} මගින් වාර්තා වේ. ` +
		`විස්තර සඳහා මුල් ආරංචි මූලාශ්‍රය බලන්න. ` +
		`මෙය පිරික්සා තහවුරු කළ සාරාංශයකි.`;
	const tags = ['#පුවත්', '#දැනගන්න', '#සිංහල', '#ලෝකය', '#තාක්ෂණය'];
	return {
		headlineSi: baseHeadline,
		summarySi: summary,
		hashtagsSi: tags,
		sourceAttribution: `මූලාශ්‍රය: ${sourceName}`,
	};
}

async function callOpenAI(system: string, user: string): Promise<GenResult> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (process.env.MOCK_AI === '1') {
		// This path expects the caller to handle composing inputs; we'll return placeholders.
		// The final text will be built at call site using article fields.
		return mockGenerate('ශීර්ෂය', 'මූලාශ්‍රය');
	}
	if (!apiKey) throw new Error('Missing OPENAI_API_KEY');
	const res = await fetch('https://api.openai.com/v1/chat/completions', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: 'gpt-4o-mini',
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: system },
				{ role: 'user', content: user },
			],
			temperature: 0.6,
		}),
	});
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`openai_error ${res.status}: ${t}`);
	}
	const data = (await res.json()) as any;
	const text = data?.choices?.[0]?.message?.content;
	if (!text) throw new Error('openai_empty_response');
	const parsed = JSON.parse(text) as GenResult;
	if (!parsed?.headlineSi || !parsed?.summarySi || !Array.isArray(parsed?.hashtagsSi)) {
		throw new Error('openai_invalid_json');
	}
	return parsed;
}

export async function POST(request: Request) {
	try {
		const db = await getDb();
		const { rawArticles, generatedPosts } = await collections(db);
		const { searchParams } = new URL(request.url);
		const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 25);
		const id = searchParams.get('id');

		let items: any[] = [];
		if (id) {
			// single-target mode by raw_articles._id
			const _id = new ObjectId(id);
			const exists = await generatedPosts.findOne({ rawArticleId: _id });
			if (exists) {
				return NextResponse.json({ ok: true, processed: 0, created: 0, skipped: 1, note: 'already generated' });
			}
			const one = await rawArticles.findOne(
				{ _id, status: 'queued' },
				{ projection: { _id: 1, sourceName: 1, title: 1, url: 1, description: 1, content: 1, publishedAt: 1 } },
			);
			if (!one) {
				return NextResponse.json({ ok: false, error: 'raw_article not found or not queued' }, { status: 404 });
			}
			items = [one];
		} else {
			// find queued articles that don't yet have a generated post
			items = await rawArticles
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
					{ $limit: limit },
					{
						$project: {
							_id: 1,
							sourceName: 1,
							title: 1,
							url: 1,
							description: 1,
							content: 1,
							publishedAt: 1,
						},
					},
				])
				.toArray();
		}

		if (items.length === 0) {
			return NextResponse.json({ ok: true, processed: 0, created: 0 });
		}

		let created = 0;
		let skipped = 0;
		for (const art of items) {
			try {
				const { system, user } = buildSinhalaNewsPrompt({
					title: art.title,
					description: art.description,
					content: art.content,
					sourceName: art.sourceName,
					url: art.url,
				});
				let out: GenResult;
				try {
					out = await callOpenAI(system, user);
					// If callOpenAI was in MOCK mode, rebuild mock with real fields
					if (process.env.MOCK_AI === '1') {
						out = mockGenerate(art.title, art.sourceName);
					}
				} catch (e: any) {
					// If quota or API error, optionally fall back to mock when MOCK_AI_FALLBACK=1
					const message = String(e?.message || e);
					const allowFallback = process.env.MOCK_AI_FALLBACK === '1';
					if (allowFallback && (message.includes('insufficient_quota') || message.includes('openai_error'))) {
						out = mockGenerate(art.title, art.sourceName);
					} else {
						throw e;
					}
				}
				const now = new Date();
				const doc: Omit<GeneratedPost, 'id' | '_id'> = {
					rawArticleId: art._id,
					category: 'global',
					headlineSi: out.headlineSi,
					summarySi: out.summarySi,
					hashtagsSi: out.hashtagsSi.slice(0, 5),
					sourceAttribution: out.sourceAttribution || `මූලාශ්‍රය: ${art.sourceName}`,
					status: 'draft',
					createdAt: now,
					updatedAt: now,
				};
				const up = await generatedPosts.updateOne(
					{ rawArticleId: art._id },
					{
						$setOnInsert: {
							rawArticleId: doc.rawArticleId,
							category: doc.category,
							headlineSi: doc.headlineSi,
							summarySi: doc.summarySi,
							hashtagsSi: doc.hashtagsSi,
							sourceAttribution: doc.sourceAttribution,
							status: doc.status,
							createdAt: doc.createdAt,
						},
						$set: { updatedAt: now },
					},
					{ upsert: true },
				);
				if (up.upsertedId) created++;
				else skipped++;
			} catch (e) {
				console.error('[ai-generate] item-failed', art._id?.toString(), e);
				continue;
			}
		}

		return NextResponse.json({ ok: true, processed: items.length, created, skipped });
	} catch (error) {
		console.error('[generate:text]', error);
		return NextResponse.json({ ok: false, error: 'generation failed' }, { status: 500 });
	}
}



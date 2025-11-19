import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections, type GeneratedPost } from '@/lib/models';
import { buildEnglishNewsPrompt } from '@/lib/prompt';
import { ensureArticleContent } from '@/lib/article-fetcher';
import { ObjectId } from 'mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type GenResult = {
	headlineEn: string;
	summaryEn: string; // Short summary (10-50 words)
	contentEn: string; // Full article content
	hashtagsEn: string[];
	sourceAttributionEn: string;
};

function mockGenerate(title: string, sourceName: string): GenResult {
	const baseHeadline = `Breaking: ${title.slice(0, 60)}`;
	const summary = `This news was reported by ${sourceName}. Check the original source for details.`;
	const fullArticle = 
		`${baseHeadline}\n\n` +
		`This news was reported by ${sourceName}. ` +
		`For detailed information, please refer to the original news source. ` +
		`This is a verified summary. ` +
		`For more details, check the original source.\n\n` +
		`Source: ${sourceName}`;
	const tags = ['#News', '#Breaking', '#Update', '#Latest', '#Info'];
	return {
		headlineEn: baseHeadline,
		summaryEn: summary,
		contentEn: fullArticle,
		hashtagsEn: tags,
		sourceAttributionEn: `Source: ${sourceName}`,
	};
}

async function callOpenAI(system: string, user: string): Promise<GenResult> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (process.env.MOCK_AI === '1') {
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
	if (!parsed?.headlineEn || !parsed?.summaryEn || !parsed?.contentEn || !Array.isArray(parsed?.hashtagsEn)) {
		throw new Error('openai_invalid_json');
	}
	return parsed;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { newsId } = body as { newsId: string };

		if (!newsId || !/^[a-fA-F0-9]{24}$/.test(newsId)) {
			return NextResponse.json({ ok: false, error: 'Invalid news ID' }, { status: 400 });
		}

		const db = await getDb();
		const { rawArticles, generatedPosts } = await collections(db);
		const _id = new ObjectId(newsId);

		// Check if article already exists
		const exists = await generatedPosts.findOne({ rawArticleId: _id });
		if (exists) {
			return NextResponse.json({ 
				ok: false, 
				error: 'Article already exists for this news',
				articleId: exists._id.toString()
			}, { status: 409 });
		}

		// Get the raw article
		const rawArticle = await rawArticles.findOne(
			{ _id },
			{ projection: { _id: 1, sourceName: 1, category: 1, title: 1, url: 1, description: 1, content: 1, publishedAt: 1 } },
		);

		if (!rawArticle) {
			return NextResponse.json({ ok: false, error: 'News article not found' }, { status: 404 });
		}

		// Ensure we have full article content - fetch if needed
		console.log(`[articles:create] Ensuring content for article: ${rawArticle.title}`);
		console.log(`[articles:create] Existing content length: ${rawArticle.content?.length || 0}`);
		console.log(`[articles:create] Existing description length: ${rawArticle.description?.length || 0}`);
		
		const fullContent = await ensureArticleContent(
			rawArticle.url,
			rawArticle.content || undefined,
			rawArticle.description || undefined
		);

		console.log(`[articles:create] Final content length: ${fullContent.length}`);
		if (fullContent.length < 200) {
			console.warn(`[articles:create] WARNING: Content is very short (${fullContent.length} chars). Article generation may be poor.`);
		}

		// Generate the article in English
		const { system, user } = buildEnglishNewsPrompt({
			title: rawArticle.title,
			description: rawArticle.description,
			content: fullContent,
			sourceName: rawArticle.sourceName,
			url: rawArticle.url,
			category: rawArticle.category,
		});

		console.log(`[articles:create] Prompt created with content length: ${fullContent.length}`);

		let out: GenResult;
		try {
			out = await callOpenAI(system, user);
			if (process.env.MOCK_AI === '1') {
				out = mockGenerate(rawArticle.title, rawArticle.sourceName);
			}
		} catch (e: any) {
			const message = String(e?.message || e);
			const allowFallback = process.env.MOCK_AI_FALLBACK === '1';
			if (allowFallback && (message.includes('insufficient_quota') || message.includes('openai_error'))) {
				out = mockGenerate(rawArticle.title, rawArticle.sourceName);
			} else {
				throw e;
			}
		}

		const now = new Date();
		const doc: Omit<GeneratedPost, 'id' | '_id'> = {
			rawArticleId: rawArticle._id,
			category: rawArticle.category || 'tech',
			headlineEn: out.headlineEn,
			summaryEn: out.summaryEn,
			contentEn: out.contentEn,
			hashtagsEn: out.hashtagsEn.slice(0, 5),
			sourceAttributionEn: out.sourceAttributionEn || `Source: ${rawArticle.sourceName}`,
			status: 'draft',
			createdAt: now,
			updatedAt: now,
		};

		const result = await generatedPosts.insertOne(doc);

		return NextResponse.json({ 
			ok: true, 
			articleId: result.insertedId.toString(),
			article: {
				headlineEn: doc.headlineEn,
				summaryEn: doc.summaryEn,
				contentEn: doc.contentEn,
				hashtagsEn: doc.hashtagsEn,
				sourceAttributionEn: doc.sourceAttributionEn,
			}
		});
	} catch (error) {
		console.error('[articles:create]', error);
		return NextResponse.json({ ok: false, error: 'Failed to create article' }, { status: 500 });
	}
}


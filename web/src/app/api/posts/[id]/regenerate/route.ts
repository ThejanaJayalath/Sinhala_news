import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { collections } from '@/lib/models';
import { buildSinhalaNewsPrompt } from '@/lib/prompt';

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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const resolved = await params;
		const hex = typeof resolved.id === 'string' ? resolved.id : '';
		if (!/^[a-fA-F0-9]{24}$/.test(hex)) {
			return NextResponse.json({ ok: false, error: 'Invalid post ID' }, { status: 400 });
		}
		const _id = new ObjectId(hex);
		const db = await getDb();
		const { generatedPosts, rawArticles } = await collections(db);

		const post = await generatedPosts.findOne({ _id });
		if (!post) {
			return NextResponse.json({ ok: false, error: 'Post not found' }, { status: 404 });
		}

		const raw = await rawArticles.findOne(
			{ _id: post.rawArticleId },
			{ projection: { title: 1, sourceName: 1, url: 1, description: 1, content: 1 } },
		);
		if (!raw) {
			return NextResponse.json({ ok: false, error: 'Source article not found' }, { status: 404 });
		}

		const { system, user } = buildSinhalaNewsPrompt({
			title: raw.title,
			description: raw.description,
			content: raw.content,
			sourceName: raw.sourceName,
			url: raw.url,
		});

		let out: GenResult;
		try {
			out = await callOpenAI(system, user);
			if (process.env.MOCK_AI === '1') {
				out = mockGenerate(raw.title, raw.sourceName);
			}
		} catch (e: any) {
			const message = String(e?.message || e);
			const allowFallback = process.env.MOCK_AI_FALLBACK === '1';
			if (allowFallback && (message.includes('insufficient_quota') || message.includes('openai_error'))) {
				out = mockGenerate(raw.title, raw.sourceName);
			} else {
				throw e;
			}
		}

		const now = new Date();
		await generatedPosts.updateOne(
			{ _id },
			{
				$set: {
					headlineSi: out.headlineSi,
					summarySi: out.summarySi,
					hashtagsSi: out.hashtagsSi.slice(0, 5),
					sourceAttribution: out.sourceAttribution || `මූලාශ්‍රය: ${raw.sourceName}`,
					status: 'draft',
					updatedAt: now,
				},
			},
		);

		return NextResponse.json({ ok: true, post: { headlineSi: out.headlineSi, summarySi: out.summarySi, hashtagsSi: out.hashtagsSi } });
	} catch (error) {
		console.error('[posts:regenerate]', error);
		return NextResponse.json({ ok: false, error: 'Failed to regenerate post' }, { status: 500 });
	}
}


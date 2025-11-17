import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { collections } from '@/lib/models';
import { buildSinhalaNewsPrompt } from '@/lib/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function translateToSinhala(text: string, context?: string): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (process.env.MOCK_AI === '1') {
		return `සිංහල පරිවර්තනය: ${text}`;
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
			messages: [
				{
					role: 'system',
					content: 'You are a translator specializing in English to Sinhala translation. Translate the provided text naturally and accurately into Sinhala. Maintain the tone and meaning.',
				},
				{
					role: 'user',
					content: context 
						? `Context: ${context}\n\nText to translate: ${text}\n\nProvide the Sinhala translation:`
						: `Translate to Sinhala: ${text}`,
				},
			],
			temperature: 0.6,
		}),
	});
	
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`openai_error ${res.status}: ${t}`);
	}
	
	const data = (await res.json()) as any;
	const translation = data?.choices?.[0]?.message?.content;
	if (!translation) throw new Error('openai_empty_response');
	return translation;
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { text, articleId, context } = body;

		if (!text) {
			return NextResponse.json({ ok: false, error: 'Text is required' }, { status: 400 });
		}

		let articleContext = context;
		if (articleId) {
			const db = await getDb();
			const { rawArticles } = await collections(db);
			const article = await rawArticles.findOne({ _id: articleId });
			if (article) {
				articleContext = `${article.title}. ${article.description || ''}`;
			}
		}

		let translation: string;
		try {
			translation = await translateToSinhala(text, articleContext);
			if (process.env.MOCK_AI === '1') {
				translation = `සිංහල: ${text}`;
			}
		} catch (e: any) {
			const message = String(e?.message || e);
			const allowFallback = process.env.MOCK_AI_FALLBACK === '1';
			if (allowFallback && (message.includes('insufficient_quota') || message.includes('openai_error'))) {
				translation = `සිංහල: ${text}`;
			} else {
				throw e;
			}
		}

		return NextResponse.json({ ok: true, translation });
	} catch (error) {
		console.error('[articles:translate]', error);
		return NextResponse.json({ ok: false, error: 'Failed to translate text' }, { status: 500 });
	}
}


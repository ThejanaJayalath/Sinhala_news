import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { collections } from '@/lib/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function summarizeWithAI(title: string, description: string, content: string): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (process.env.MOCK_AI === '1') {
		return `This is a summary of: ${title}. ${description || 'No description available.'}`;
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
					content: 'You are a news summarizer. Create a concise, informative summary (2-3 sentences) of the provided news article.',
				},
				{
					role: 'user',
					content: `Title: ${title}\n\nDescription: ${description || 'N/A'}\n\nContent: ${content || description || 'N/A'}\n\nProvide a clear, concise summary:`,
				},
			],
			temperature: 0.6,
			max_tokens: 200,
		}),
	});
	
	if (!res.ok) {
		const t = await res.text();
		throw new Error(`openai_error ${res.status}: ${t}`);
	}
	
	const data = (await res.json()) as any;
	const summary = data?.choices?.[0]?.message?.content;
	if (!summary) throw new Error('openai_empty_response');
	return summary;
}

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

		const article = await rawArticles.findOne({ _id });
		if (!article) {
			return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
		}

		let summary: string;
		try {
			summary = await summarizeWithAI(
				article.title,
				article.description || '',
				article.content || article.description || '',
			);
			if (process.env.MOCK_AI === '1') {
				summary = `Summary of: ${article.title}. ${article.description || 'This article covers important news.'}`;
			}
		} catch (e: any) {
			const message = String(e?.message || e);
			const allowFallback = process.env.MOCK_AI_FALLBACK === '1';
			if (allowFallback && (message.includes('insufficient_quota') || message.includes('openai_error'))) {
				summary = `Summary of: ${article.title}. ${article.description || 'This article covers important news.'}`;
			} else {
				throw e;
			}
		}

		return NextResponse.json({ ok: true, summary });
	} catch (error) {
		console.error('[articles:summarize]', error);
		return NextResponse.json({ ok: false, error: 'Failed to summarize article' }, { status: 500 });
	}
}


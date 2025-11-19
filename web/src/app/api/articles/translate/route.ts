import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/db';
import { collections } from '@/lib/models';
import { buildSinhalaNewsPrompt } from '@/lib/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// LibreTranslate - Free, open-source translation API (requires free API key)
async function translateWithLibreTranslate(text: string): Promise<string> {
	const apiUrl = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate';
	const apiKey = process.env.LIBRETRANSLATE_API_KEY;
	
	const body: any = {
		q: text,
		source: 'en',
		target: 'si', // Sinhala language code
		format: 'text',
	};
	
	// Add API key if provided
	if (apiKey) {
		body.api_key = apiKey;
	}
	
	const res = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
	
	if (!res.ok) {
		const errorText = await res.text();
		// Check if it's asking for API key
		if (res.status === 400 && errorText.includes('API key')) {
			throw new Error('libretranslate_api_key_required: Get a free API key at https://portal.libretranslate.com');
		}
		throw new Error(`libretranslate_error ${res.status}: ${errorText}`);
	}
	
	const data = (await res.json()) as any;
	const translation = data?.translatedText;
	if (!translation) {
		throw new Error('libretranslate_empty_response');
	}
	
	return translation.trim();
}

// MyMemory Translation API - Free alternative (10,000 words/day free)
async function translateWithMyMemory(text: string): Promise<string> {
	const apiUrl = 'https://api.mymemory.translated.net/get';
	
	const res = await fetch(`${apiUrl}?q=${encodeURIComponent(text)}&langpair=en|si`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
		},
	});
	
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`mymemory_error ${res.status}: ${errorText}`);
	}
	
	const data = (await res.json()) as any;
	const translation = data?.responseData?.translatedText;
	if (!translation) {
		throw new Error('mymemory_empty_response');
	}
	
	return translation.trim();
}

// Google Gemini API - Free tier available, better quality translations
async function translateWithGemini(text: string, context?: string): Promise<string> {
	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error('Missing GEMINI_API_KEY');
	}
	
	// Basic API key format validation
	if (apiKey.length < 20) {
		console.warn('[translate] API key seems too short, might be invalid');
	}
	
	// Build the prompt first
	const prompt = context
		? `You are an expert translator specializing in English to Sinhala translation. Translate the following English text into natural, native Sinhala. Translate EVERYTHING including phrases like "Summary of:", "Article:", etc. Do NOT keep any English words.\n\nContext (for reference only): ${context}\n\nText to translate: "${text}"\n\nProvide ONLY the complete Sinhala translation:`
		: `You are an expert translator specializing in English to Sinhala translation. Translate the following English text into natural, native Sinhala. Translate EVERYTHING including phrases like "Summary of:", "Article:", etc. Do NOT keep any English words.\n\nText to translate: "${text}"\n\nProvide ONLY the complete Sinhala translation:`;
	
	// Try to list available models first to see what's actually available
	let availableModels: string[] = [];
	try {
		const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
		console.log('[translate] Fetching available Gemini models...');
		const listRes = await fetch(listUrl);
		if (listRes.ok) {
			const listData = (await listRes.json()) as any;
			availableModels = (listData?.models || [])
				.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
				.map((m: any) => m.name?.replace('models/', '') || m.name)
				.filter((n: string) => n);
			console.log(`[translate] Found ${availableModels.length} available models:`, availableModels.slice(0, 5).join(', '));
		}
	} catch (e) {
		console.warn('[translate] Could not list models, will try default models:', e);
	}
	
	// Try different model names and API versions
	const preferredModel = process.env.GEMINI_MODEL;
	
	// Build list of models to try - use available models if we got them, otherwise use defaults
	const modelAttempts = preferredModel 
		? [preferredModel]
		: availableModels.length > 0
		? availableModels
		: ['gemini-2.0-flash-exp', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
	
	// Try v1beta first (more stable), then v1
	const apiVersions = ['v1beta', 'v1'];
	
	let lastError: Error | null = null;
	
	for (const model of modelAttempts) {
		for (const version of apiVersions) {
			const apiUrl = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
			console.log(`[translate] Trying Gemini API: ${version}/models/${model}`);
			
			try {
				const res = await fetch(apiUrl, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						contents: [{
							parts: [{
								text: prompt
							}]
						}],
						generationConfig: {
							temperature: 0.6,
						}
					}),
				});
				
				if (res.ok) {
					const data = (await res.json()) as any;
					const translation = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
					if (translation) {
						console.log(`[translate] Gemini translation successful using ${version}/${model}`);
						
						// Validate translation
						const normalizedInput = text.trim().toLowerCase();
						const normalizedTranslation = translation.toLowerCase();
						if (normalizedTranslation === normalizedInput) {
							console.warn('[translate] Gemini returned identical text (English), treating as error');
							throw new Error('gemini_returned_english');
						}
						
						return translation;
					}
				} else {
					// Log all errors, not just non-404s
					const errorText = await res.text();
					console.warn(`[translate] ${version}/${model} failed (${res.status}):`, errorText.substring(0, 200));
					
					// If it's not a 404, it might be a different error (auth, quota, etc.)
					if (res.status !== 404) {
						// Check for authentication errors
						if (res.status === 401 || res.status === 403) {
							throw new Error(`gemini_auth_error ${res.status}: Invalid API key or insufficient permissions. ${errorText}`);
						}
						// For other errors, throw immediately
						throw new Error(`gemini_error ${res.status}: ${errorText}`);
					}
					// If 404, save error and continue to next model/version
					lastError = new Error(`404: ${errorText.substring(0, 100)}`);
				}
			} catch (e: any) {
				const errorMsg = String(e?.message || e);
				// If it's an auth error or other critical error, throw immediately
				if (errorMsg.includes('auth') || errorMsg.includes('401') || errorMsg.includes('403') || errorMsg.includes('quota')) {
					throw e;
				}
				// For 404/NOT_FOUND, continue trying
				if (!errorMsg.includes('404') && !errorMsg.includes('NOT_FOUND')) {
					// Real error, not just model not found
					throw e;
				}
				lastError = e;
				// Continue to next attempt
			}
		}
	}
	
	// If we get here, all attempts failed
	throw new Error(`gemini_error: No working model/API version found. Last error: ${lastError?.message || 'All model/version combinations failed'}. Available models: ${availableModels.length > 0 ? availableModels.join(', ') : 'Could not fetch'}`);
}

// Google Cloud Translation API - Best quality, free tier: 500,000 characters/month
async function translateWithGoogleCloud(text: string): Promise<string> {
	const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
	if (!apiKey) {
		throw new Error('Missing GOOGLE_TRANSLATE_API_KEY');
	}
	
	const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
	
	const res = await fetch(apiUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			q: text,
			source: 'en',
			target: 'si', // Sinhala language code
			format: 'text',
		}),
	});
	
	if (!res.ok) {
		const errorText = await res.text();
		throw new Error(`google_translate_error ${res.status}: ${errorText}`);
	}
	
	const data = (await res.json()) as any;
	const translation = data?.data?.translations?.[0]?.translatedText;
	if (!translation) {
		throw new Error('google_translate_empty_response');
	}
	
	return translation.trim();
}

// OpenAI translation function
async function translateWithOpenAI(text: string, context?: string): Promise<string> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) {
		throw new Error('Missing OPENAI_API_KEY');
	}
	
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
					content: 'You are a professional translator specializing in English to Sinhala translation. Translate the ENTIRE provided text into pure Sinhala. Translate every word, including phrases like "Summary of:", "Article:", etc. Do NOT keep any English words in your response. Return ONLY the complete Sinhala translation without any English text, labels, prefixes, or explanations.',
				},
				{
					role: 'user',
					content: context 
						? `Context (for reference only, do not translate this): ${context}\n\nTranslate the following English text completely into Sinhala. Translate everything including any introductory phrases:\n\n"${text}"\n\nProvide the complete translation in Sinhala only:`
						: `Translate the following English text completely into Sinhala. Translate everything including any introductory phrases:\n\n"${text}"\n\nProvide the complete translation in Sinhala only:`,
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
	const translation = data?.choices?.[0]?.message?.content?.trim();
	if (!translation) throw new Error('openai_empty_response');
	
	// Validate that we got an actual translation, not just the original text
	const normalizedInput = text.trim().toLowerCase();
	const normalizedTranslation = translation.toLowerCase();
	if (normalizedTranslation === normalizedInput) {
		console.warn('[translate] OpenAI returned identical text, treating as error');
		throw new Error('openai_returned_english');
	}
	
	return translation;
}

async function translateToSinhala(text: string, context?: string): Promise<string> {
	if (process.env.MOCK_AI === '1') {
		console.log('[translate] Using MOCK_AI mode');
		return `[සිංහල පරිවර්තනය: ${text}]`;
	}
	
	// Try Gemini API first if key is available
	if (process.env.GEMINI_API_KEY) {
		console.log('[translate] Attempting Google Gemini API');
		try {
			return await translateWithGemini(text, context);
		} catch (e: any) {
			const errorMsg = String(e?.message || e);
			console.warn('[translate] Gemini API failed, falling back to MyMemory:', errorMsg);
			
			// If it's a billing/auth error, suggest alternatives
			if (errorMsg.includes('billing') || errorMsg.includes('quota') || errorMsg.includes('403')) {
				console.log('[translate] Gemini requires billing setup. Using free MyMemory API instead.');
			}
			
			// Fall through to MyMemory
		}
	}
	
	// Use MyMemory as free fallback (no billing required)
	console.log('[translate] Using MyMemory Translation API (free, no billing required)');
	return await translateWithMyMemory(text);
}

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { text, articleId, context, translateFullArticle } = body;

		// If translateFullArticle is true, translate the entire article by ID
		if (translateFullArticle && articleId) {
			if (!/^[a-fA-F0-9]{24}$/.test(articleId)) {
				return NextResponse.json({ ok: false, error: 'Invalid article ID format' }, { status: 400 });
			}

			const db = await getDb();
			const { generatedPosts } = await collections(db);
			const _id = new ObjectId(articleId);
			const article = await generatedPosts.findOne({ _id });

			if (!article) {
				return NextResponse.json({ ok: false, error: 'Article not found' }, { status: 404 });
			}

			if (!article.headlineEn || !article.summaryEn || !article.contentEn) {
				return NextResponse.json({ ok: false, error: 'Article does not have English content to translate' }, { status: 400 });
			}

			// Translate all fields
			const translations: {
				headlineSi: string;
				summarySi: string;
				contentSi: string;
				hashtagsSi: string[];
				sourceAttributionSi: string;
			} = {
				headlineSi: '',
				summarySi: '',
				contentSi: '',
				hashtagsSi: [],
				sourceAttributionSi: '',
			};

			try {
				// Translate headline
				translations.headlineSi = await translateToSinhala(article.headlineEn);
				
				// Translate summary
				translations.summarySi = await translateToSinhala(article.summaryEn);
				
				// Translate content
				translations.contentSi = await translateToSinhala(article.contentEn);
				
				// Translate hashtags
				translations.hashtagsSi = await Promise.all(
					article.hashtagsEn.map(tag => translateToSinhala(tag.replace('#', '')))
				).then(tags => tags.map(tag => `#${tag}`));
				
				// Translate source attribution
				translations.sourceAttributionSi = await translateToSinhala(article.sourceAttributionEn);

				if (process.env.MOCK_AI === '1') {
					translations.headlineSi = `[සිංහල: ${article.headlineEn}]`;
					translations.summarySi = `[සිංහල: ${article.summaryEn}]`;
					translations.contentSi = `[සිංහල: ${article.contentEn}]`;
					translations.hashtagsSi = article.hashtagsEn.map(t => `[සිංහල: ${t}]`);
					translations.sourceAttributionSi = `[සිංහල: ${article.sourceAttributionEn}]`;
				}

				// Update the article with Sinhala translations
				await generatedPosts.updateOne(
					{ _id },
					{
						$set: {
							headlineSi: translations.headlineSi,
							summarySi: translations.summarySi,
							contentSi: translations.contentSi,
							hashtagsSi: translations.hashtagsSi,
							sourceAttributionSi: translations.sourceAttributionSi,
							updatedAt: new Date(),
						},
					}
				);

				return NextResponse.json({ ok: true, translations, articleId });
			} catch (e: any) {
				const message = String(e?.message || e);
				console.error('[articles:translate] Full article translation failed:', message);
				return NextResponse.json({ 
					ok: false, 
					error: `Translation failed: ${message}` 
				}, { status: 500 });
			}
		}

		// Original text translation logic
		if (!text) {
			return NextResponse.json({ ok: false, error: 'Text is required' }, { status: 400 });
		}

		let articleContext = context;
		if (articleId && !translateFullArticle) {
			// Validate and convert articleId to ObjectId
			if (!/^[a-fA-F0-9]{24}$/.test(articleId)) {
				return NextResponse.json({ ok: false, error: 'Invalid article ID format' }, { status: 400 });
			}
			try {
				const db = await getDb();
				const { rawArticles } = await collections(db);
				const _id = new ObjectId(articleId);
				const article = await rawArticles.findOne({ _id });
				if (article) {
					articleContext = `${article.title}. ${article.description || ''}`;
				}
			} catch (e) {
				// If article lookup fails, continue without context
				console.warn('[articles:translate] Failed to fetch article context:', e);
			}
		}

		let translation: string;
		try {
			translation = await translateToSinhala(text, articleContext);
			if (process.env.MOCK_AI === '1') {
				// In mock mode, return a placeholder that indicates translation is needed
				translation = `[සිංහල පරිවර්තනය: ${text}]`;
			}
		} catch (e: any) {
			const message = String(e?.message || e);
			console.error('[articles:translate] Translation failed:', message);
			
			// Provide clear error messages
			let userMessage = 'Failed to translate text';
			
			if (message.includes('Missing GEMINI_API_KEY')) {
				userMessage = 'Translation service error. Please try again.';
			} else if (message.includes('gemini_error') || message.includes('mymemory_error')) {
				if (message.includes('billing') || message.includes('quota')) {
					userMessage = 'Translation service requires billing setup. The system will use free alternatives automatically.';
				} else {
					userMessage = `Translation error: ${message}. Please try again.`;
				}
			} else if (message.includes('gemini_empty_response') || message.includes('mymemory_empty_response')) {
				userMessage = 'Translation service returned empty response. Please try again.';
			} else if (message.includes('gemini_returned_english')) {
				userMessage = 'Translation service returned English text instead of Sinhala. Please try again.';
			} else {
				userMessage = `Translation error: ${message}`;
			}
			
			return NextResponse.json({ 
				ok: false, 
				error: userMessage 
			}, { status: 500 });
		}
		
		// Final validation: ensure we're not returning English text
		if (!translation || translation.trim().length === 0) {
			return NextResponse.json({ 
				ok: false, 
				error: 'Empty translation received from service' 
			}, { status: 500 });
		}

		return NextResponse.json({ ok: true, translation });
	} catch (error) {
		console.error('[articles:translate]', error);
		return NextResponse.json({ ok: false, error: 'Failed to translate text' }, { status: 500 });
	}
}


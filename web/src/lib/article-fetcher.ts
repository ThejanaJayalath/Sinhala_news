/**
 * Fetches and extracts article content from a URL
 * Uses Mozilla Readability for accurate article extraction
 */

import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export async function fetchArticleContent(url: string): Promise<string | null> {
	try {
		console.log(`[article-fetcher] Starting fetch for ${url}`);
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
				'Accept-Language': 'en-US,en;q=0.9',
				'Referer': 'https://www.google.com/',
			},
			signal: AbortSignal.timeout(20000), // 20 second timeout
		});

		if (!response.ok) {
			console.warn(`[article-fetcher] Failed to fetch ${url}: ${response.status}`);
			return null;
		}

		const html = await response.text();
		console.log(`[article-fetcher] Fetched ${html.length} bytes of HTML`);
		
		// Use Mozilla Readability to extract article content
		const dom = new JSDOM(html, { url });
		const reader = new Readability(dom.window.document);
		const article = reader.parse();

		if (article) {
			let extractedText = '';
			
			// Try to get text from textContent first
			if (article.textContent && article.textContent.trim().length > 200) {
				extractedText = article.textContent.trim();
			}
			
			// Also try to extract from article.content (HTML content) which might have more
			if (article.content) {
				const dom2 = new JSDOM(article.content);
				const htmlText = dom2.window.document.body.textContent || '';
				// Use the longer version
				if (htmlText.trim().length > extractedText.length) {
					extractedText = htmlText.trim();
				}
			}
			
			// If we have article.excerpt, try to combine it
			if (article.excerpt && article.excerpt.trim().length > 50) {
				// Prepend excerpt if it's not already in the text
				if (!extractedText.includes(article.excerpt.trim().substring(0, 50))) {
					extractedText = article.excerpt.trim() + '\n\n' + extractedText;
				}
			}
			
			if (extractedText.length > 200) {
				const content = cleanContent(extractedText);
				console.log(`[article-fetcher] Successfully extracted ${content.length} chars of content using Readability`);
				return content;
			}
		}

		// Last resort: try basic extraction from common tags
		console.log(`[article-fetcher] Readability extraction failed, trying fallback extraction`);
		const fallbackContent = extractFallback(html);
		
		if (fallbackContent && fallbackContent.length > 200) {
			const content = cleanContent(fallbackContent);
			console.log(`[article-fetcher] Fallback extraction got ${content.length} chars`);
			return content;
		}

		console.warn(`[article-fetcher] Failed to extract sufficient content from ${url}`);
		return null;
	} catch (error) {
		console.error(`[article-fetcher] Error fetching ${url}:`, error);
		return null;
	}
}

/**
 * Fallback extraction method using basic HTML parsing
 * Only used when Readability fails
 */
function extractFallback(html: string): string | null {
	// Remove scripts, styles, and other non-content elements
	let cleaned = html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
		.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
		.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
		.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
		.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

	// Try to find article content in common HTML structures
	const patterns = [
		/<article[^>]*>([\s\S]*?)<\/article>/i,
		/<main[^>]*>([\s\S]*?)<\/main>/i,
		/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
	];

	for (const pattern of patterns) {
		const match = cleaned.match(pattern);
		if (match && match[1]) {
			const text = stripHtmlTags(match[1]);
			if (text.length > 200) {
				return text;
			}
		}
	}

	// Extract text from paragraph tags
	const pMatches = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
	if (pMatches && pMatches.length > 3) {
		const paragraphs = pMatches
			.map(p => stripHtmlTags(p))
			.filter(p => p.length > 50)
			.join('\n\n');
		
		if (paragraphs.length > 200) {
			return paragraphs;
		}
	}

	return null;
}

function stripHtmlTags(html: string): string {
	return html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&apos;/g, "'")
		.replace(/\s+/g, ' ')
		.trim();
}

function cleanContent(content: string): string {
	return content
		.replace(/\s+/g, ' ')
		.replace(/\n{3,}/g, '\n\n')
		.trim()
		.slice(0, 15000); // Increased limit to 15k characters for full articles
}

/**
 * Checks if we need to fetch content and fetches it if necessary
 * Real news articles are typically 2000-5000+ characters, so we always try to fetch
 * if existing content is less than 2000 chars (likely a snippet)
 */
export async function ensureArticleContent(
	url: string,
	existingContent?: string | null,
	existingDescription?: string | null
): Promise<string> {
	// Real articles are typically 2000+ characters. If we have less, it's likely a snippet
	const MIN_ARTICLE_LENGTH = 2000;
	const isLikelySnippet = !existingContent || 
		existingContent.length < MIN_ARTICLE_LENGTH || 
		existingContent.includes('check the original source') ||
		existingContent.includes('Read more') ||
		existingContent.includes('Continue reading');

	// Always try to fetch the full article if content looks like a snippet
	if (isLikelySnippet) {
		console.log(`[article-fetcher] Content appears to be a snippet (${existingContent?.length || 0} chars), fetching full article from ${url}`);
		const fetchedContent = await fetchArticleContent(url);
		
		if (fetchedContent && fetchedContent.length > MIN_ARTICLE_LENGTH) {
			console.log(`[article-fetcher] Successfully fetched full article (${fetchedContent.length} chars)`);
			return fetchedContent;
		}
		
		// If fetched content is longer than existing, use it even if less than MIN_ARTICLE_LENGTH
		if (fetchedContent && fetchedContent.length > (existingContent?.length || 0)) {
			console.log(`[article-fetcher] Using fetched content (${fetchedContent.length} chars) as it's longer than existing (${existingContent?.length || 0} chars)`);
			return fetchedContent;
		}
	} else {
		// We have substantial content, but still try to fetch to see if we can get better content
		console.log(`[article-fetcher] Existing content looks substantial (${existingContent.length} chars), but fetching to verify we have the best content`);
		const fetchedContent = await fetchArticleContent(url);
		
		// Prefer fetched content if:
		// 1. It's significantly longer (at least 30% more), OR
		// 2. It's longer at all AND existing content might be incomplete (contains snippet indicators)
		const hasSnippetIndicators = existingContent.includes('...') || 
			existingContent.includes('[+') || 
			existingContent.length < 3000; // Articles are usually 3000+ chars
		
		if (fetchedContent) {
			if (fetchedContent.length > existingContent.length * 1.3) {
				console.log(`[article-fetcher] Fetched content is significantly better (${fetchedContent.length} vs ${existingContent.length} chars), using fetched`);
				return fetchedContent;
			} else if (fetchedContent.length > existingContent.length && hasSnippetIndicators) {
				console.log(`[article-fetcher] Fetched content is longer and existing may be incomplete (${fetchedContent.length} vs ${existingContent.length} chars), using fetched`);
				return fetchedContent;
			}
		}
		
		// Use existing if it's good enough
		console.log(`[article-fetcher] Using existing content (${existingContent.length} chars)`);
		return existingContent;
	}

	// If fetch failed but we have some content, use it
	if (existingContent && existingContent.length > 100) {
		console.log(`[article-fetcher] Using existing content as fallback (${existingContent.length} chars)`);
		return existingContent;
	}

	// Use description as last resort
	if (existingDescription && existingDescription.length > 100) {
		console.log(`[article-fetcher] Using description as fallback (${existingDescription.length} chars)`);
		return existingDescription;
	}

	console.warn(`[article-fetcher] No substantial content found for ${url}`);
	return existingContent || existingDescription || '';
}


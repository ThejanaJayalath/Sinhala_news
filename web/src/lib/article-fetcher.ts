/**
 * Fetches and extracts article content from a URL
 * Uses improved HTML parsing to extract main content
 */

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
		
		// Try multiple extraction methods
		let content = extractMainContent(html);
		
		if (!content || content.length < 200) {
			console.log(`[article-fetcher] First extraction got ${content?.length || 0} chars, trying fallback`);
			content = extractFromCommonTags(html);
		}

		if (!content || content.length < 200) {
			console.log(`[article-fetcher] Second extraction got ${content?.length || 0} chars, trying aggressive extraction`);
			content = extractAggressively(html);
		}

		if (content && content.length > 200) {
			// Clean up the content
			content = cleanContent(content);
			console.log(`[article-fetcher] Successfully extracted ${content.length} chars of content`);
			return content;
		}

		console.warn(`[article-fetcher] Failed to extract sufficient content from ${url}`);
		return null;
	} catch (error) {
		console.error(`[article-fetcher] Error fetching ${url}:`, error);
		return null;
	}
}

function extractMainContent(html: string): string | null {
	// Try to find article content in common HTML structures
	const patterns = [
		/<article[^>]*>([\s\S]*?)<\/article>/i,
		/<main[^>]*>([\s\S]*?)<\/main>/i,
		/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*class="[^"]*post[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*id="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
		/<div[^>]*id="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
	];

	for (const pattern of patterns) {
		const match = html.match(pattern);
		if (match && match[1]) {
			const text = stripHtmlTags(match[1]);
			if (text.length > 200) {
				return text;
			}
		}
	}

	return null;
}

function extractFromCommonTags(html: string): string | null {
	// Extract text from paragraph tags
	const pMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
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

function extractAggressively(html: string): string | null {
	// Remove scripts, styles, and other non-content elements first
	let cleaned = html
		.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
		.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
		.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
		.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
		.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
		.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
		.replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '');

	// Try to find the largest text block
	const textBlocks: Array<{ text: string; length: number }> = [];

	// Extract from all divs
	const divMatches = cleaned.match(/<div[^>]*>([\s\S]*?)<\/div>/gi);
	if (divMatches) {
		for (const div of divMatches) {
			const text = stripHtmlTags(div);
			if (text.length > 100) {
				textBlocks.push({ text, length: text.length });
			}
		}
	}

	// Extract from all paragraphs
	const pMatches = cleaned.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
	if (pMatches) {
		for (const p of pMatches) {
			const text = stripHtmlTags(p);
			if (text.length > 50) {
				textBlocks.push({ text, length: text.length });
			}
		}
	}

	// Sort by length and take the largest blocks
	textBlocks.sort((a, b) => b.length - a.length);
	
	// Combine top blocks
	const topBlocks = textBlocks.slice(0, 10);
	const combined = topBlocks.map(b => b.text).join('\n\n');
	
	if (combined.length > 200) {
		return combined;
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
		.slice(0, 10000); // Limit to 10k characters
}

/**
 * Checks if we need to fetch content and fetches it if necessary
 */
export async function ensureArticleContent(
	url: string,
	existingContent?: string | null,
	existingDescription?: string | null
): Promise<string> {
	// If we have substantial content (more than 500 chars), use it
	if (existingContent && existingContent.length > 500 && !existingContent.includes('check the original source')) {
		console.log(`[article-fetcher] Using existing content (${existingContent.length} chars)`);
		return existingContent;
	}

	// Always try to fetch the full article to get better content
	console.log(`[article-fetcher] Fetching full content from ${url}`);
	const fetchedContent = await fetchArticleContent(url);
	
	if (fetchedContent && fetchedContent.length > 500) {
		console.log(`[article-fetcher] Successfully fetched ${fetchedContent.length} chars`);
		return fetchedContent;
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


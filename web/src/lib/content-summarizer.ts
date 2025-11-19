/**
 * Content-based article summarizer and generator
 * Works WITHOUT AI APIs - extracts information directly from article content
 */

type SummarizerInput = {
	title: string;
	description?: string | null;
	content: string;
	sourceName: string;
	category?: string;
};

type SummarizerOutput = {
	headlineEn: string;
	summaryEn: string; // 10-50 words
	contentEn: string; // Full article
	hashtagsEn: string[];
	sourceAttributionEn: string;
};

/**
 * Cleans content to remove navigation, unrelated articles, and other noise
 */
function cleanContentForSummary(text: string): string {
	// Remove common navigation and unrelated content patterns
	let cleaned = text;
	
	// Remove chronological archives, navigation links
	cleaned = cleaned.replace(/News\s+News\s+chronological\s+archives[^\n]*/gi, '');
	cleaned = cleaned.replace(/\d{2}:\d{2}\s+[A-Z][^\n]*/g, ''); // Remove time-stamped navigation items
	cleaned = cleaned.replace(/Convention\s+reports[^\n]*/gi, '');
	
	// Remove lines that look like other article headlines (short lines with timestamps)
	cleaned = cleaned.split('\n')
		.filter(line => {
			const trimmed = line.trim();
			// Remove very short lines (likely navigation)
			if (trimmed.length < 20) return false;
			// Remove lines that are just timestamps
			if (/^\d{2}:\d{2}\s*$/.test(trimmed)) return false;
			// Remove lines that look like navigation
			if (/^(News|Archive|More|Read|Click|View)\s/i.test(trimmed)) return false;
			return true;
		})
		.join('\n');
	
	// Remove HTML tags if any
	cleaned = cleaned.replace(/<[^>]+>/g, ' ');
	
	// Normalize whitespace
	cleaned = cleaned.replace(/\s+/g, ' ').trim();
	
	return cleaned;
}

/**
 * Extracts key sentences from content for summary
 */
function extractKeySentences(text: string, maxSentences: number = 3): string[] {
	// Clean the text first
	const cleaned = cleanContentForSummary(text);
	
	// Split into sentences (basic approach)
	const sentences = cleaned
		.split(/[.!?]+\s+/)
		.map(s => s.trim())
		.filter(s => s.length > 20 && s.length < 300); // Filter out very short or very long sentences

	// Score sentences by importance
	const scored = sentences.map(sentence => {
		let score = 0;
		const lower = sentence.toLowerCase();
		
		// Prefer sentences with numbers, dates, percentages
		if (/\d+/.test(sentence)) score += 3;
		if (/\d+%/.test(sentence)) score += 5;
		if (/\d{4}/.test(sentence)) score += 2; // Years
		
		// Prefer sentences with important keywords
		const importantWords = ['announced', 'released', 'launched', 'revealed', 'according', 'reports', 'says', 'confirmed'];
		importantWords.forEach(word => {
			if (lower.includes(word)) score += 2;
		});
		
		// Prefer sentences near the beginning
		const index = sentences.indexOf(sentence);
		score += Math.max(0, (sentences.length - index) / sentences.length * 2);
		
		// Avoid sentences with common filler phrases
		const fillerPhrases = ['click here', 'read more', 'continue reading', 'check the source'];
		if (fillerPhrases.some(phrase => lower.includes(phrase))) score -= 10;
		
		return { sentence, score };
	});

	// Sort by score and take top sentences
	return scored
		.sort((a, b) => b.score - a.score)
		.slice(0, maxSentences)
		.map(s => s.sentence);
}

/**
 * Creates a summary (10-50 words) from content
 * STRICTLY enforces 50 word limit
 */
function createSummary(title: string, description: string | null | undefined, content: string): string {
	// Clean content first
	const cleanedContent = cleanContentForSummary(content);
	
	// Try to use description first if it's good (and under 50 words)
	if (description && description.length > 30 && description.length < 200) {
		const descWords = description.split(/\s+/).filter(w => w.length > 0);
		if (descWords.length >= 10 && descWords.length <= 50) {
			// Description is already a good summary
			return description;
		} else if (descWords.length > 50) {
			// Trim description to 50 words
			return descWords.slice(0, 50).join(' ').replace(/[^.!?]*$/, '').trim();
		}
	}

	// Extract key sentences (prioritize first sentences which are usually most important)
	const keySentences = extractKeySentences(cleanedContent, 3);
	
	if (keySentences.length > 0) {
		// Start with first sentence, add more until we hit 50 words
		let summary = '';
		let wordCount = 0;
		
		for (const sentence of keySentences) {
			const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);
			const sentenceWordCount = sentenceWords.length;
			
			if (wordCount + sentenceWordCount <= 50) {
				// Can add this sentence
				if (summary) summary += ' ';
				summary += sentence;
				wordCount += sentenceWordCount;
			} else {
				// Can't fit full sentence, add partial if we have room
				const remainingWords = 50 - wordCount;
				if (remainingWords >= 10) {
					// Add partial sentence (at least 10 words)
					if (summary) summary += ' ';
					summary += sentenceWords.slice(0, remainingWords).join(' ');
					// Try to end at a sentence boundary
					summary = summary.replace(/[^.!?]*$/, '').trim();
				}
				break;
			}
		}
		
		// Final word count check and trim if needed
		const finalWords = summary.split(/\s+/).filter(w => w.length > 0);
		if (finalWords.length > 50) {
			summary = finalWords.slice(0, 50).join(' ');
			summary = summary.replace(/[^.!?]*$/, '').trim();
		}
		
		// Ensure minimum 10 words
		if (finalWords.length < 10 && cleanedContent.length > 100) {
			// Get more sentences
			const moreSentences = extractKeySentences(cleanedContent, 5);
			let newSummary = '';
			let newWordCount = 0;
			
			for (const sentence of moreSentences) {
				const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 0);
				if (newWordCount + sentenceWords.length <= 50) {
					if (newSummary) newSummary += ' ';
					newSummary += sentence;
					newWordCount += sentenceWords.length;
				} else {
					const remaining = 50 - newWordCount;
					if (remaining >= 10) {
						if (newSummary) newSummary += ' ';
						newSummary += sentenceWords.slice(0, remaining).join(' ');
						newSummary = newSummary.replace(/[^.!?]*$/, '').trim();
					}
					break;
				}
			}
			
			if (newSummary) {
				const newFinalWords = newSummary.split(/\s+/).filter(w => w.length > 0);
				if (newFinalWords.length > 50) {
					newSummary = newFinalWords.slice(0, 50).join(' ');
					newSummary = newSummary.replace(/[^.!?]*$/, '').trim();
				}
				return newSummary || summary;
			}
		}
		
		if (summary && summary.length > 0) {
			return summary;
		}
	}

	// Fallback: use first paragraph or first meaningful text
	if (cleanedContent.length > 100) {
		// Get first paragraph or first 300 chars
		const firstPara = cleanedContent.split('\n\n')[0] || cleanedContent.substring(0, 300);
		const words = firstPara.split(/\s+/).filter(w => w.length > 0);
		
		if (words.length > 0) {
			if (words.length > 50) {
				// Trim to exactly 50 words
				let trimmed = words.slice(0, 50).join(' ');
				// Try to end at sentence boundary
				trimmed = trimmed.replace(/[^.!?]*$/, '').trim();
				return trimmed || words.slice(0, 50).join(' ');
			}
			return firstPara.trim();
		}
	}

	// Last resort: create from title
	const titleWords = title.split(/\s+/).filter(w => w.length > 0);
	if (titleWords.length > 0) {
		return titleWords.slice(0, Math.min(50, titleWords.length)).join(' ');
	}

	return 'Latest news update.';
}

/**
 * Creates full article content from scraped content
 */
function createFullArticle(title: string, description: string | null | undefined, content: string, sourceName: string): string {
	// Clean content first to remove navigation and unrelated items
	const cleaned = cleanContentForSummary(content);
	
	// If we have good content, use it directly with some formatting
	if (cleaned && cleaned.length > 500) {
		// Further clean up the content
		let article = cleaned
			.replace(/\n{3,}/g, '\n\n')
			.trim();
		
		// Remove any remaining navigation patterns
		article = article.split('\n')
			.filter(line => {
				const trimmed = line.trim();
				// Remove very short lines that might be navigation
				if (trimmed.length < 15) return false;
				// Remove timestamp patterns
				if (/^\d{2}:\d{2}\s/.test(trimmed)) return false;
				return true;
			})
			.join('\n');
		
		// Limit to reasonable length (3000 words max)
		const words = article.split(/\s+/).filter(w => w.length > 0);
		if (words.length > 3000) {
			article = words.slice(0, 3000).join(' ');
			// Try to end at a sentence
			const lastPeriod = article.lastIndexOf('.');
			if (lastPeriod > article.length * 0.8) {
				article = article.substring(0, lastPeriod + 1);
			}
		}
		
		return article.trim();
	}

	// If content is short, create a structured article
	let article = title + '\n\n';
	
	if (description) {
		article += description + '\n\n';
	}
	
	if (content && content.length > 50) {
		article += content;
	} else {
		article += `This article covers: ${title}. `;
		article += `For more information, visit the source.`;
	}
	
	return article;
}

/**
 * Generates hashtags from content
 */
function generateHashtags(title: string, content: string, category?: string): string[] {
	const hashtags: string[] = [];
	
	// Add category-based hashtag
	if (category) {
		const catMap: Record<string, string> = {
			tech: '#Technology',
			entertainment: '#Entertainment',
			games: '#Gaming',
			anime_comics: '#Anime',
		};
		if (catMap[category]) {
			hashtags.push(catMap[category]);
		}
	}

	// Extract keywords from title
	const titleWords = title
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter(w => w.length > 4)
		.slice(0, 3);
	
	titleWords.forEach(word => {
		const hashtag = '#' + word.charAt(0).toUpperCase() + word.slice(1);
		if (!hashtags.includes(hashtag)) {
			hashtags.push(hashtag);
		}
	});

	// Extract important words from content (first 500 chars)
	const contentSample = content.substring(0, 500).toLowerCase();
	const importantWords = ['apple', 'google', 'microsoft', 'amazon', 'tesla', 'iphone', 'android', 'windows', 'xbox', 'playstation'];
	
	importantWords.forEach(word => {
		if (contentSample.includes(word)) {
			const hashtag = '#' + word.charAt(0).toUpperCase() + word.slice(1);
			if (!hashtags.includes(hashtag)) {
				hashtags.push(hashtag);
			}
		}
	});

	// Fill up to 5 hashtags
	while (hashtags.length < 5) {
		const defaults = ['#News', '#Breaking', '#Update', '#Latest', '#Tech'];
		for (const def of defaults) {
			if (!hashtags.includes(def)) {
				hashtags.push(def);
				break;
			}
		}
	}

	return hashtags.slice(0, 5);
}

/**
 * Validates and trims summary to ensure it's under 50 words
 */
function validateSummary(summary: string): string {
	const words = summary.split(/\s+/).filter(w => w.length > 0);
	if (words.length > 50) {
		// Trim to exactly 50 words
		let trimmed = words.slice(0, 50).join(' ');
		// Try to end at sentence boundary
		trimmed = trimmed.replace(/[^.!?]*$/, '').trim();
		// If trimming removed too much, just take 50 words
		if (trimmed.split(/\s+/).filter(w => w.length > 0).length < 10) {
			trimmed = words.slice(0, 50).join(' ');
		}
		return trimmed;
	}
	return summary;
}

/**
 * Main function: Generate article without AI
 */
export function generateArticleWithoutAI(input: SummarizerInput): SummarizerOutput {
	const { title, description, content, sourceName, category } = input;
	
	// Ensure we have content
	const fullContent = content || description || title;
	
	// Generate headline (use title, clean it up)
	const headline = title.length > 80 ? title.substring(0, 77) + '...' : title;
	
	// Generate summary (10-50 words) and validate
	let summary = createSummary(title, description, fullContent);
	summary = validateSummary(summary);
	
	// Final check: ensure summary is between 10-50 words
	const summaryWords = summary.split(/\s+/).filter(w => w.length > 0);
	if (summaryWords.length < 10 && fullContent.length > 100) {
		// Try to get more content for summary
		const cleaned = cleanContentForSummary(fullContent);
		const firstSentences = cleaned.split(/[.!?]+\s+/).slice(0, 3).join('. ');
		const firstWords = firstSentences.split(/\s+/).filter(w => w.length > 0);
		if (firstWords.length >= 10) {
			summary = firstWords.slice(0, Math.min(50, firstWords.length)).join(' ');
			summary = validateSummary(summary);
		}
	}
	
	// Generate full article
	const articleContent = createFullArticle(title, description, fullContent, sourceName);
	
	// Generate hashtags
	const hashtags = generateHashtags(title, fullContent, category);
	
	return {
		headlineEn: headline,
		summaryEn: summary,
		contentEn: articleContent,
		hashtagsEn: hashtags,
		sourceAttributionEn: `Source: ${sourceName}`,
	};
}


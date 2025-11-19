type BuildPromptInput = {
	title: string;
	description?: string;
	content?: string;
	sourceName: string;
	url: string;
	category?: string;
};

export function buildSinhalaNewsPrompt(input: BuildPromptInput) {
	const { title, description, content, sourceName, url, category } = input;
	const base = `
You are a Sinhala news writer for a Sri Lankan audience.
Task: Create a complete Sinhala news article with the following structure:
1. A compelling headline
2. A short summary (10-50 words) that captures the essence
3. A full detailed article that expands on all the information
4. 5 relevant hashtags
5. Source attribution

Process:
- First, analyze the news content thoroughly
- Extract the headline that best represents the story
- Create a concise summary (10-50 words) that gives readers a quick overview
- Gather all source information and details
- Write a complete, detailed article in Sinhala that covers all aspects of the news

Style: Clear, neutral, engaging, professional. Avoid slang unless entertainment context. Keep it safe and non-defamatory.
Always include source attribution in Sinhala using the source name.

Return ONLY valid JSON with keys: headlineSi, summarySi (10-50 words), contentSi (full article), hashtagsSi (array of 5 strings), sourceAttribution.
`;

	const article = [
		`Title: ${title}`,
		description ? `Description: ${description}` : undefined,
		content ? `Content: ${content.slice(0, 8000)}` : undefined, // Increased limit for full articles
		`Source: ${sourceName}`,
		`URL: ${url}`,
		category ? `Category: ${category}` : undefined,
	]
		.filter(Boolean)
		.join('\n');

	const user = `
News Article:
${article}

Instructions:
1. Analyze this news article thoroughly
2. Create a compelling headline (under 80 Sinhala chars when possible)
3. Write a SHORT summary of 10-50 words in Sinhala that captures the key points
4. Write a COMPLETE, DETAILED article in Sinhala that expands on all information from the source
   - Include all relevant details, facts, and context
   - Make it comprehensive and informative
   - Use proper Sinhala language and structure
   - Ensure the article is well-organized and readable
5. Generate 5 hashtags in Sinhala or transliterated; no spaces, no punctuation besides #
6. Include source attribution: "මූලාශ්‍රය: ${sourceName}"

The contentSi field should be a full, detailed article, not just a summary.
`;
	return { system: base.trim(), user: user.trim() };
}

export function buildEnglishNewsPrompt(input: BuildPromptInput) {
	const { title, description, content, sourceName, url, category } = input;
	const base = `
You are a professional news writer.
Task: Create a complete English news article with the following structure:
1. A compelling headline
2. A short summary (10-50 words) that captures the essence
3. A full detailed article that expands on all the information
4. 5 relevant hashtags
5. Source attribution

Process:
- First, analyze the news content thoroughly
- Extract the headline that best represents the story
- Create a concise summary (10-50 words) that gives readers a quick overview
- Gather all source information and details
- Write a complete, detailed article in English that covers all aspects of the news

Style: Clear, neutral, engaging, professional. Keep it safe and non-defamatory.
Always include source attribution using the source name.

Return ONLY valid JSON with keys: headlineEn, summaryEn (10-50 words), contentEn (full article), hashtagsEn (array of 5 strings), sourceAttributionEn.
`;

	const article = [
		`Title: ${title}`,
		description ? `Description: ${description}` : undefined,
		content ? `Content: ${content.slice(0, 8000)}` : undefined, // Increased limit for full articles
		`Source: ${sourceName}`,
		`URL: ${url}`,
		category ? `Category: ${category}` : undefined,
	]
		.filter(Boolean)
		.join('\n');

	const user = `
News Article:
${article}

CRITICAL INSTRUCTIONS:
You MUST read and use the ACTUAL CONTENT provided above. Do NOT generate generic responses like "check the original source" or "refer to the article". 

1. READ THE FULL ARTICLE CONTENT CAREFULLY:
   - The Content section above contains the actual article text
   - Extract ALL key information, facts, quotes, names, dates, and details
   - If the content is short, use what is provided and expand logically based on the title and description

2. Create a compelling headline (under 80 chars) that accurately represents the main story from the content

3. Write a SHORT summary of 10-50 words that captures the KEY POINTS from the actual article content:
   - Use specific details from the content
   - Mention key facts, events, or information from the article
   - DO NOT say "check the source" - provide actual information

4. Write a COMPLETE, DETAILED article in English (300-800 words) based on the content:
   - Start with the most important information from the article
   - Include specific details, facts, quotes, statistics mentioned in the content
   - If content is provided, use it directly and expand on it
   - If content is limited, use the title and description to create a comprehensive article
   - Structure: Introduction → Main points → Details → Conclusion
   - Write in a news article style with proper paragraphs
   - DO NOT include phrases like "check the original source" or "refer to the article"
   - Write as if you are reporting the news directly

5. Generate 5 relevant hashtags based on the article topics; no spaces, no punctuation besides #

6. Include source attribution: "Source: ${sourceName}"

REMEMBER: You are writing a news article, not a placeholder. Use the information provided to create actual content. If the content section has text, use it. If it's short, expand based on the title and description to create a full article.
`;
	return { system: base.trim(), user: user.trim() };
}




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
You are a Sinhala social media editor for a Sri Lankan audience.
Task: Produce a short Sinhala headline, a 2–3 sentence Sinhala summary, and 5 Sinhala hashtags.
Style: Clear, neutral, engaging. Avoid slang unless entertainment context. Keep it safe and non-defamatory.
Always include short source attribution in Sinhala using the source name.

Return ONLY valid JSON with keys: headlineSi, summarySi, hashtagsSi (array of 5 strings), sourceAttribution.
`;

	const article = [
		`Title: ${title}`,
		description ? `Description: ${description}` : undefined,
		content ? `Content: ${content.slice(0, 1500)}` : undefined,
		`Source: ${sourceName}`,
		`URL: ${url}`,
		category ? `Category: ${category}` : undefined,
	]
		.filter(Boolean)
		.join('\n');

	const user = `
Article:
${article}

Constraints:
- Headline under 80 Sinhala chars when possible.
- Summary ~2–3 sentences, 280–400 Sinhala chars.
- 5 hashtags in Sinhala or transliterated; no spaces, no punctuation besides #.
- Source attribution should be a short Sinhala phrase: "මූලාශ්‍රය: ${sourceName}".
`;
	return { system: base.trim(), user: user.trim() };
}




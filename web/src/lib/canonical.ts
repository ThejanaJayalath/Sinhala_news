import crypto from 'node:crypto';

function stripUtmParams(url: URL) {
	const paramsToStrip = [
		'utm_source',
		'utm_medium',
		'utm_campaign',
		'utm_term',
		'utm_content',
		'gclid',
		'fbclid',
	];
	for (const p of paramsToStrip) {
		url.searchParams.delete(p);
	}
}

export function normalizeUrl(input: string): string {
	try {
		const url = new URL(input);
		url.hash = '';
		stripUtmParams(url);
		// lower-case host; keep path as-is; sort params for stability
		url.hostname = url.hostname.toLowerCase();
		const sorted = new URLSearchParams(url.searchParams);
		const keys = Array.from(sorted.keys()).sort();
		const normalizedSearch = new URLSearchParams();
		for (const k of keys) {
			const values = sorted.getAll(k);
			for (const v of values) normalizedSearch.append(k, v);
		}
		url.search = normalizedSearch.toString() ? `?${normalizedSearch.toString()}` : '';
		return url.toString();
	} catch {
		return input.trim();
	}
}

export function generateCanonicalId(url: string): string {
	const normalized = normalizeUrl(url);
	return crypto.createHash('sha256').update(normalized).digest('hex');
}



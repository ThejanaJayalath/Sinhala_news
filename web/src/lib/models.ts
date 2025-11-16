import { type Collection, type Db, ObjectId } from 'mongodb';
import { getDb } from './db';

export type SourceCategory = 'global' | 'entertainment' | 'anime_comics' | 'tech';

export interface Source {
	id?: ObjectId;
	_id?: ObjectId;
	name: string;
	type: 'rss' | 'newsapi';
	url?: string;
	apiKeyRef?: string;
	category: SourceCategory;
	enabled: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface RawArticle {
	id?: ObjectId;
	_id?: ObjectId;
	sourceId: ObjectId;
	sourceName: string;
	title: string;
	url: string;
	canonicalId: string; // typically a normalized URL hash
	publishedAt?: Date;
	author?: string;
	description?: string;
	content?: string;
	imageUrl?: string;
	language?: string;
	status: 'queued' | 'processed' | 'failed';
	errorMessage?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface GeneratedPost {
	id?: ObjectId;
	_id?: ObjectId;
	rawArticleId: ObjectId;
	category: SourceCategory;
	headlineSi: string;
	summarySi: string;
	hashtagsSi: string[];
	sourceAttribution: string;
	imageAssetUrl?: string; // composed image URL
	status: 'draft' | 'approved' | 'rejected' | 'scheduled' | 'published';
	scheduledAt?: Date;
	fbPostId?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface Template {
	id?: ObjectId;
	_id?: ObjectId;
	name: string;
	version: number;
	category?: SourceCategory;
	layout: unknown; // JSON structure describing overlay positions etc.
	active: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export interface User {
	id?: ObjectId;
	_id?: ObjectId;
	email: string;
	passwordHash: string;
	role: 'admin' | 'editor' | 'viewer';
	createdAt: Date;
	updatedAt: Date;
}

export interface ModerationReview {
	id?: ObjectId;
	_id?: ObjectId;
	generatedPostId: ObjectId;
	reviewerId?: ObjectId;
	status: 'approved' | 'rejected' | 'needs_changes' | 'flagged';
	reasons?: string[];
	notes?: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface FbMetric {
	id?: ObjectId;
	_id?: ObjectId;
	generatedPostId: ObjectId;
	fbPostId: string;
	reach?: number;
	engagement?: number;
	reactions?: number;
	comments?: number;
	shares?: number;
	collectedAt: Date;
}

type NamedCollections =
	| 'sources'
	| 'raw_articles'
	| 'generated_posts'
	| 'templates'
	| 'users'
	| 'moderation_reviews'
	| 'fb_metrics';

export async function getCollection<T>(name: NamedCollections): Promise<Collection<T>> {
	const db = await getDb();
	return db.collection<T>(name);
}

export async function collections(db?: Db) {
	const database = db ?? (await getDb());
	return {
		sources: database.collection<Source>('sources'),
		rawArticles: database.collection<RawArticle>('raw_articles'),
		generatedPosts: database.collection<GeneratedPost>('generated_posts'),
		templates: database.collection<Template>('templates'),
		users: database.collection<User>('users'),
		moderationReviews: database.collection<ModerationReview>('moderation_reviews'),
		fbMetrics: database.collection<FbMetric>('fb_metrics'),
	};
}

export async function ensureIndexes(db?: Db) {
	const database = db ?? (await getDb());
	const { sources, rawArticles, generatedPosts, users, fbMetrics } = await collections(database);

	await Promise.all([
		sources.createIndex({ name: 1 }, { unique: true }),
		sources.createIndex({ category: 1, enabled: 1 }),
		rawArticles.createIndex({ canonicalId: 1 }, { unique: true }),
		rawArticles.createIndex({ sourceId: 1, createdAt: -1 }),
		generatedPosts.createIndex({ rawArticleId: 1 }, { unique: true }),
		generatedPosts.createIndex({ status: 1, scheduledAt: 1 }),
		users.createIndex({ email: 1 }, { unique: true }),
		fbMetrics.createIndex({ fbPostId: 1 }, { unique: true }),
	]);
}



## Sinhala AI News Console (Foundations)

This directory hosts the zero-cost foundations for the Sinhala AI News automation stack:

- Next.js 14 App Router + Tailwind CSS for the admin console UI.
- Custom Sinhala typography using Noto Sans Sinhala + Space Grotesk display.
- Theme system, UI primitives (buttons, cards, badges, table), and placeholder flows for landing, dashboard, and admin login.

## Scripts

```bash
npm run dev          # start local dev server
npm run build        # production build
npm run start        # run production build locally
npm run lint         # ESLint
npm run type-check   # TypeScript diagnostics
npm run format       # Prettier write
npm run format:check # Prettier check
```

## Environment

Create a `.env` file (or configure via Vercel) with:

```
MONGODB_URI=your-mongodb-connection-string
MONGODB_DB=sinhalanews
# Optional: override seeded admin
# ADMIN_EMAIL=admin@sinhala.news
# ADMIN_PASSWORD=SinhalaNews#2025
# NewsAPI (optional, for /api/ingest/newsapi)
# NEWSAPI_KEY=your_newsapi_key
# OpenAI (Step 4 generation and translation)
# OPENAI_API_KEY=your_openai_key
# Translation APIs (priority order: Google Cloud > Gemini > OpenAI > LibreTranslate > MyMemory)
# GOOGLE_TRANSLATE_API_KEY=your_google_key  # Best quality, free: 500k chars/month. Get at https://console.cloud.google.com
# GEMINI_API_KEY=your_gemini_key  # Free tier available, good quality. Get at https://aistudio.google.com
# GEMINI_MODEL=gemini-1.5-flash  # Optional: default is gemini-1.5-flash (fast) or use gemini-1.5-pro (better quality)
# OPENAI_API_KEY=your_openai_key  # Paid, requires credits
# USE_LIBRETRANSLATE=1       # Use LibreTranslate (free) instead of OpenAI for translations
# LIBRETRANSLATE_API_KEY=your_libretranslate_key  # Get free key at https://portal.libretranslate.com
# LIBRETRANSLATE_URL=https://libretranslate.com/translate  # Optional: custom LibreTranslate server URL
# MyMemory is used as automatic fallback (free, 10k words/day, no API key needed)
# Local development fallback (no API cost)
# MOCK_AI=1                  # always generate mock Sinhala text
# MOCK_AI_FALLBACK=1         # fallback to mock when OpenAI fails/quota
```

Additional keys (Facebook Graph, OpenAI) can be added later as new features land.

### Default admin credentials

For now, admin is seeded and can also be configured via env:

- Email: `admin@sinhala.news`
- Password: `SinhalaNews#2025`

You can override using `ADMIN_EMAIL` and `ADMIN_PASSWORD` (see environment above).

## Next steps

1. Seed the database (templates and example sources only; admin is hardcoded):

   - Start dev server: `npm run dev`
   - Call the seed endpoint: `POST http://localhost:3000/api/admin/seed`

2. Implement ingestion endpoints and queues.
3. Add AI pipeline function to generate Sinhala drafts.
4. Expand dashboard widgets to show queue + FB Insights.

## Ingestion (RSS)

- List sources:
  - GET `/api/sources`
- Add/enable a source:
  - POST `/api/sources` with JSON:
    ```
    { "name": "BBC World RSS", "type": "rss", "url": "https://feeds.bbci.co.uk/news/world/rss.xml", "category": "global", "enabled": true }
    ```
- Update/disable a source:
  - PATCH `/api/sources` with JSON:
    ```
    { "name": "Reuters World RSS", "enabled": false }
    ```
  - Or update URL:
    ```
    { "name": "Reuters World RSS", "url": "https://feeds.reuters.com/reuters/worldNews" }
    ```
- Run RSS ingestion:
  - POST `/api/ingest/rss`
  - Response contains counts: inserted vs skipped (duplicates)

## Ingestion (NewsAPI)

- Add a NewsAPI source (uses global `NEWSAPI_KEY`):
  - POST `/api/sources` with JSON:
    ```
    { "name": "NewsAPI Global", "type": "newsapi", "category": "global", "enabled": true }
    ```
  - Or specify a custom endpoint in `url` (advanced use).
- Run NewsAPI ingestion:
  - POST `/api/ingest/newsapi`
  - Returns `{ ok, sources, inserted, skipped, errors }`

## Automation (Vercel Cron)

Configure scheduled ingestion in `vercel.json`:

```
{
  "crons": [
    { "path": "/api/ingest/rss", "schedule": "*/15 * * * *" },
    { "path": "/api/ingest/newsapi", "schedule": "*/30 * * * *" }
  ]
}
```

Alternatively trigger from an external scheduler or GitHub Actions curl.

## Generation (Step 4 - Sinhala drafts)

- Configure `OPENAI_API_KEY` in your `.env`.
- Generate drafts from queued raw articles:
  - POST `/api/generate/text?limit=10`
  - Response: `{ ok, processed, created, skipped }`
  - Creates documents in `generated_posts` with fields: `headlineSi`, `summarySi`, `hashtagsSi`, `status: "draft"`.
  - Generate for a specific raw article ID:
    - POST `/api/generate/text?id=<raw_article_id>`
    - Useful when you want to retry or target a single item.

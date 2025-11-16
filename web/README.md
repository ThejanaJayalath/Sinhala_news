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
```

Additional keys (Facebook Graph, OpenAI) can be added later as new features land.

### Default admin credentials

For now, admin is seeded and can also be configured via env:

- Email: `admin@sinhala.news`
- Password: `SinhalaNews#2025`

You can override using `ADMIN_EMAIL` and `ADMIN_PASSWORD` (see environment above).

## Next steps

1. Seed the database (admin user, templates, example sources):

   - Start dev server: `npm run dev`
   - Call the seed endpoint: `POST http://localhost:3000/api/admin/seed`

2. Implement ingestion endpoints and queues.
3. Add AI pipeline function to generate Sinhala drafts.
4. Expand dashboard widgets to show queue + FB Insights.

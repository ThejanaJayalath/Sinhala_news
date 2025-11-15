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
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://todoListApp:sinhalanews@cluster0.gdcsnzk.mongodb.net/
MONGODB_DB=sinhalanews
```

Additional keys (Facebook Graph, OpenAI) can be added later as new features land.

### Default admin credentials

Hard-coded for the MVP:

- Email: `admin@sinhala.news`
- Password: `SinhalaNews#2025`

Update `src/lib/auth.ts` when you want to change these values or plug in a real auth provider.

## Next steps

1. Wire the login form to your auth provider (Clerk, Auth0, custom).
2. Implement MongoDB connection utilities and data models.
3. Add source registry + ingestion job status endpoints.
4. Expand dashboard widgets to show real metrics from the queue + FB Insights.

# Inukki

**Your AI-powered digital closet and style assistant.**

Inukki helps you organize your wardrobe, plan outfits, track what you wear, and get personalized style recommendations — all from your phone.

## Features

- 📦 **Digital Closet** — Catalog clothing items with photos, categories, colors, and metadata
- 👗 **Outfit Builder** — Combine items into outfits, score them, and save favorites
- 📅 **Outfit Planner** — Plan what to wear on a calendar with weather previews
- 🤖 **AI Style Assistant (Inukki)** — Get personalized outfit suggestions and style advice
- 📊 **Wardrobe Insights** — Track wear frequency, category breakdowns, and style patterns
- 🌤️ **Weather Integration** — Weather-aware outfit recommendations
- 🔍 **Discover** — Browse curated style inspiration

## Architecture

```
┌─────────────────────────────────────────┐
│           React SPA (Vite)              │
│  TypeScript · Tailwind CSS · shadcn/ui  │
│  Framer Motion · TanStack Query         │
├─────────────────────────────────────────┤
│         Supabase (via Lovable Cloud)    │
│  Auth · PostgreSQL · Edge Functions     │
│  Storage (closet-images bucket)         │
├─────────────────────────────────────────┤
│           AI Integration                │
│  Lovable AI Models (Gemini / GPT)       │
│  Clothing analysis · Style suggestions  │
└─────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| State | TanStack React Query, React Context |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions, Storage) |
| AI | Lovable AI (Gemini, GPT) via Edge Functions |
| Testing | Vitest, React Testing Library |

## Folder Structure

```
src/
├── assets/          # Static assets (logos, icons)
├── components/
│   ├── auth/        # Authentication (ProtectedRoute)
│   ├── closet/      # Closet item cards, filters, editors
│   ├── discover/    # Style discovery feed
│   ├── home/        # Dashboard widgets (weather, daily outfit)
│   ├── insights/    # Wardrobe analytics components
│   ├── layout/      # App shell (header, bottom nav)
│   ├── planner/     # Calendar outfit planner
│   ├── settings/    # User preference controls
│   ├── style/       # AI style assistant UI
│   └── ui/          # shadcn/ui primitives
├── hooks/           # Custom React hooks (auth, closet, outfits, weather)
├── integrations/    # Supabase client & generated types
├── lib/             # Utilities (auth-fetch, cn helper)
├── pages/           # Route-level page components
├── test/            # Test setup and test files
└── types/           # TypeScript type definitions

supabase/
├── functions/       # Edge Functions (AI analysis, weather, scraping)
│   ├── _shared/     # Shared utilities (auth, validation, sanitization)
│   ├── analyze-clothing/
│   ├── analyze-outfit/
│   ├── daily-outfit/
│   ├── get-weather/
│   ├── scrape-product/
│   └── style-assistant/
└── config.toml      # Supabase project configuration
```

## Environment Variables

The following environment variables are required (auto-configured by Lovable Cloud):

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anonymous/public key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

Edge Function secrets (configured via Lovable Cloud):

| Secret | Description |
|--------|-------------|
| `LOVABLE_API_KEY` | Lovable AI model access |
| `FIRECRAWL_API_KEY` | Product page scraping |

## Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd inukki

# Install dependencies
npm install

# Start the dev server (runs on port 8080)
npm run dev
```

## Testing

```sh
# Run all tests
npm run test
```

Tests use **Vitest** with **jsdom** environment and **React Testing Library**.

Current coverage:
- `useClosetItems` hook — success, empty state, error handling, input validation
- Additional coverage planned for auth flows and outfit operations

## Deployment

The app is deployed via **Lovable Cloud** with automatic publishing.

For manual deployment (e.g., Vercel):

1. Connect your Git repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User profile data (display name, style preferences, body info) |
| `closet_items` | Clothing items with metadata, images, wear tracking |
| `outfits` | Saved outfit combinations |
| `outfit_plans` | Calendar-based outfit planning |
| `wear_history` | Wear log with weather conditions |
| `saved_discover_items` | Bookmarked discover feed content |

All tables use Row-Level Security (RLS) scoped to `auth.uid()`.

## License

Proprietary — All rights reserved.

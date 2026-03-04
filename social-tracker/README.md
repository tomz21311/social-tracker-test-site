# Social Campaign Impact Tracker — Setup Guide

## Prerequisites

- **Node.js 18+** installed ([download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Supabase project** already created (you have this)
- **Git** (optional, for version control)

---

## Step 1: Install Dependencies

Open a terminal in the `social-tracker` folder and run:

```bash
npm install
```

This installs Next.js, React, Supabase client, Recharts, and all other dependencies.

---

## Step 2: Set Up the Database

You need to run the SQL script to create all tables in your Supabase project.

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `scripts/setup-database.sql` from this project
6. Copy the **entire contents** and paste into the SQL Editor
7. Click **Run**

You should see a success message. This creates all 8 tables (settings, content, campaigns, audiences, vendors, production_costs, campaign_content, campaign_audiences), plus indexes, triggers, and row-level security policies.

---

## Step 3: Create Your User Account

Since this is a single-user app, you need to create one account in Supabase:

1. In the Supabase Dashboard, go to **Authentication** (left sidebar)
2. Click **Users** tab
3. Click **Add User** → **Create New User**
4. Enter your **email** and a **password**
5. Make sure **Auto Confirm User** is checked
6. Click **Create User**

This is the email/password you'll use to log in to the app.

---

## Step 4: Verify Environment Variables

The `.env.local` file already contains your Supabase credentials. Verify it looks like this:

```
NEXT_PUBLIC_SUPABASE_URL=https://ryezaxeoqgtaisynisrn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Important:** Never commit `.env.local` to a public Git repository. It's already in `.gitignore`.

---

## Step 5: Run the App Locally

```bash
npm run dev
```

Open **http://localhost:3000** in your browser. You should see the login page.

Sign in with the email and password you created in Step 3.

---

## Step 6: Configure Settings

After logging in, click **Settings** in the left sidebar. Set your:

- **CPM rates** for Instagram, Facebook, and LinkedIn (used for EMV calculations)
- **Annual budget** (used for budget pacing)

Click **Save Settings**.

---

## Step 7: Deploy to Vercel

1. Push this project to a **GitHub repository** (or GitLab/Bitbucket)
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click **Add New Project** → Import your repo
4. In **Environment Variables**, add these three:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   (Copy the values from your `.env.local` file)
5. Click **Deploy**

Your app will be live at a `*.vercel.app` URL. You can add a custom domain from GoDaddy by pointing DNS to Vercel.

---

## Project Structure

```
social-tracker/
├── .env.local                    # Supabase credentials (never commit)
├── package.json                  # Dependencies and scripts
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind theme (brand colors, fonts)
├── scripts/
│   └── setup-database.sql        # Full database schema (run in Supabase SQL Editor)
├── src/
│   ├── middleware.ts              # Auth protection (redirects to /login if not signed in)
│   ├── app/
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── globals.css           # Global styles (buttons, cards, tables, badges, modals)
│   │   ├── page.tsx              # Redirects to /dashboard
│   │   ├── login/page.tsx        # Login page
│   │   ├── dashboard/page.tsx    # Dashboard (Phase 1: KPI placeholders)
│   │   ├── content/page.tsx      # Content Library (Phase 2 placeholder)
│   │   ├── campaigns/page.tsx    # Campaigns (Phase 3 placeholder)
│   │   ├── audiences/page.tsx    # Audiences (Phase 3 placeholder)
│   │   ├── budget/page.tsx       # Budget (Phase 4 placeholder)
│   │   ├── reports/page.tsx      # Reports (Phase 5 placeholder)
│   │   └── settings/page.tsx     # Settings (fully functional)
│   ├── components/layout/
│   │   ├── AppShell.tsx          # Conditional sidebar/topbar wrapper
│   │   ├── Sidebar.tsx           # Left navigation
│   │   └── TopBar.tsx            # Year, platform, search filters
│   ├── hooks/
│   │   ├── useAuth.tsx           # Auth context and provider
│   │   ├── useGlobalFilters.tsx  # Global filter state (year, platform, search)
│   │   └── useSettings.ts       # Settings CRUD hook
│   ├── lib/
│   │   ├── supabase.ts          # Browser Supabase client
│   │   ├── supabase-server.ts   # Server Supabase client
│   │   ├── auth.ts              # Auth helpers (signIn, signOut, getSession)
│   │   ├── calculations.ts      # EMV and budget pacing calculations
│   │   ├── constants.ts         # Dropdown options, formatters, helpers
│   │   └── utils.ts             # cn() class merge utility
│   └── types/
│       └── index.ts             # All TypeScript interfaces and types
```

---

## What's Working in Phase 1

- ✅ Login / authentication with password gate
- ✅ Sidebar navigation across all 7 sections
- ✅ Top bar with year selector, platform filter, and search
- ✅ Global filter state that persists across sections
- ✅ Settings page: edit CPM rates and annual budget (reads/writes to Supabase)
- ✅ Dashboard with KPI tile layout (values will populate in Phase 4)
- ✅ Placeholder pages for all other sections
- ✅ Full database schema deployed with RLS
- ✅ Auth middleware protecting all routes
- ✅ TypeScript types for every entity
- ✅ Calculation helpers for EMV and budget pacing

## Next: Phase 2 — Content Library

Phase 2 will build the full Content section: list view with sortable/filterable table, new content modal, quick add form, content detail page, production costs, vendor auto-suggest, and EMV calculations.

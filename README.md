# Mom's Medicine Tracker

A private, mobile-first web application for tracking your mother's medicines, daily doses, photo proof of administration, stock levels, and doctor visits.

---

## Features

- **Daily dose schedule** grouped by Early Morning / Morning / Afternoon / Evening
- **Record a dose** with an optional photo taken directly on a mobile phone camera
- **Automatic stock deduction** — every recorded dose atomically deducts stock from a ledger
- **Low-stock alerts** when supply falls below the configured threshold (default 5 days)
- **Dose history** — browse any previous day, see photos and notes
- **Doctor visit log** — record appointments, summaries, prescriptions, and follow-up dates
- **Private photo storage** — photos stored in a private Supabase bucket, never public
- Responsive, mobile-first design with a bottom navigation bar on mobile
- Works as a normal browser website; no app store required

---

## Technology Stack

| Layer         | Technology                |
|---------------|---------------------------|
| Frontend      | React 18 + TypeScript + Vite |
| Styling       | Tailwind CSS v4           |
| Icons         | Lucide React              |
| State / Data  | TanStack Query v5         |
| Routing       | React Router v6           |
| Backend       | Supabase (PostgreSQL + Auth + Storage) |
| Hosting       | Netlify                   |

---

## Local Development

### Prerequisites

- Node.js 20 or later
- npm 9 or later
- A Supabase account (free tier is fine)

### Setup

```bash
# 1. Clone / navigate to the project
cd mom-medicine-tracker

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env.local

# 4. Fill in your Supabase credentials (see Supabase Setup below)
#    Edit .env.local and set:
#    VITE_SUPABASE_URL=https://your-project-id.supabase.co
#    VITE_SUPABASE_ANON_KEY=your-anon-key

# 5. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Supabase Setup

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, choose a name (e.g. `moms-medicine-tracker`), set a strong database password, and pick your region.
3. Wait for the project to be ready (about 2 minutes).

### 2. Get your credentials

In the Supabase dashboard, go to **Project Settings → API**:

- Copy the **Project URL** — this is your `VITE_SUPABASE_URL`
- Copy the **anon public** key — this is your `VITE_SUPABASE_ANON_KEY`

⚠️ **Never use the `service_role` key in the frontend. Use only the `anon` key.**

### 3. Run the database migrations

1. In the Supabase dashboard, open the **SQL Editor**.
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`.
3. Paste it into the editor and click **Run**.
4. Verify: click **Table Editor** — you should see `medicines`, `dose_records`, `stock_transactions`, `medicine_schedules`, `doctor_visits`, and `profiles`.

### 4. Create the storage bucket

1. In the Supabase dashboard, go to **Storage**.
2. Click **New bucket**.
3. Name it exactly: `dose-photos`
4. **Uncheck** "Public bucket" — it must be **private**.
5. Click **Create bucket**.

### 5. Apply storage policies

1. In the SQL Editor, copy and run the contents of `supabase/migrations/002_storage_policies.sql`.

### 6. Create the first user account

1. In the Supabase dashboard, go to **Authentication → Users**.
2. Click **Invite user** or **Add user**.
3. Enter your email address and set a password.
4. The app will automatically create a profile for this user on first sign-in (via the database trigger).

### 7. (Optional) Add sample data

After signing in, you can uncomment and run the seed data in `supabase/migrations/003_seed_data.sql` after replacing `<YOUR_USER_ID>` with your actual user UUID (visible in **Authentication → Users**).

---

## Netlify Deployment

> ⚠️ Only deploy after reviewing the app on localhost first.

### 1. Build the project

```bash
npm run build
```

### 2. Deploy to Netlify

**Option A — Netlify CLI:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir dist
```

**Option B — Netlify dashboard:**
1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Click **Add new site → Deploy manually**.
3. Drag the `dist/` folder onto the page.

**Option C — Continuous deployment from Git:**
1. Push this project to a GitHub repository.
2. In Netlify, click **Add new site → Import an existing project**.
3. Connect your GitHub repository.
4. Set the build command: `npm run build`
5. Set the publish directory: `dist`

### 3. Configure environment variables in Netlify

In your Netlify site: **Site settings → Environment variables**

```
VITE_SUPABASE_URL    = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
```

### 4. Redirects (already configured)

The `netlify.toml` file in this project already includes the redirect rule needed for React Router:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Security Notes

- All tables are protected with **Row Level Security (RLS)** — users can only access their own data.
- Photos are stored in a **private Supabase Storage bucket** and accessed via short-lived signed URLs.
- The Supabase **anon key** is safe to expose in the browser (it's the public key). It cannot bypass RLS.
- The `service_role` key is never used in the frontend.
- Authentication sessions are managed by Supabase Auth with automatic token refresh.

---

## Project Structure

```
src/
  components/
    layout/       BottomNav, Sidebar, Layout
    common/       EmptyState, LoadingSpinner, StockBadge
    doses/        DoseCard, RecordDoseModal
    medicines/    MedicineForm, AddStockModal
  context/        AuthContext
  hooks/          useMedicines, useDoses, useDoctorVisits
  lib/            supabase.ts, utils.ts
  pages/          Home, Medicines, History, DoctorVisits, Settings, Login
  types/          database.ts

supabase/
  migrations/
    001_initial_schema.sql   — Tables, RLS policies, database functions
    002_storage_policies.sql — Storage bucket policies
    003_seed_data.sql        — Optional demo data (commented out)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Missing Supabase environment variables" | Make sure `.env.local` exists with both variables filled in |
| Login fails with valid credentials | Check that the Supabase project is active (not paused on free tier) |
| Photo upload fails | Verify the `dose-photos` bucket exists and is **private**, and that the storage policies are applied |
| Stock doesn't deduct | Ensure `001_initial_schema.sql` was run fully — check the `record_dose_with_stock` function exists |
| Page shows blank after login | Open browser DevTools → Console and check for errors |
| Supabase project paused | Free-tier projects pause after 1 week of inactivity. Restore via the Supabase dashboard |

---

## Free-Tier Limits

Supabase free tier provides:
- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users

Photos are compressed before upload (max ~5 MB per photo after compression). The app will show a clear error if an upload fails — it will **never** mark a dose as successfully recorded if the photo upload failed.

---

## Acceptance Criteria Status

- [x] Secure login
- [x] Add, edit, archive, view medicines
- [x] Configure Early Morning / Morning / Afternoon / Evening schedules
- [x] Add stock — balance updates
- [x] Recording a dose deducts the correct quantity exactly once (via atomic DB function)
- [x] Remaining days of supply calculated from schedule
- [x] Low-stock warnings at ≤5 days
- [x] Phone camera or gallery photo selection (via `capture="environment"`)
- [x] Photo uploads to private storage, linked to dose record
- [x] Failed uploads never appear as successfully recorded
- [x] Browse history by date with dose records and photos
- [x] Record and review doctor visits
- [x] Historical records survive medicine edits and archiving
- [x] Works on mobile (375px) and desktop
- [x] RLS + private storage protecting all data
- [x] Builds successfully with complete deployment instructions

# Bakey 🥖

A mobile-first recipe book based on baker's percentages. Installable as an app (PWA), works offline, syncs via Supabase.

## Concepts

- **Scale by**:
  - **Total weight**: enter the dough weight and every ingredient follows (`base = total ÷ Σ%`).
  - **Portions**: portions × portion size gives the total weight.
  - **One ingredient**: enter the weight of one ingredient, e.g. eggs. All percentages are relative to it.
- **Amount types**:
  - **Percent**: a fixed percentage.
  - **Remainder of group**: fills the *flour* group up to 100%, or the *liquid* group up to the hydration target. Examples: `whole wheat = 100% − others`, `water = hydration − oil`.
  - **% of another ingredient**: for example poolish water = 100% of poolish flour, or baking powder = 12.5% of eggs.
  - **To taste**: listed, with no amount.
- **Sections**: group ingredients into parts such as a poolish or roux, each with its own subtotal.
- **Variants**: several versions of one recipe, e.g. Regular / Tangzhong.
- **Modifier**: a ± % applied to the ingredients you select.
- **Set-aside portions**: fixed-weight portions taken out before the rest is split.
- **Weighing checklist**: tap an ingredient row to tick it off.
- **Keep screen awake**: the sun icon on the recipe screen.

Inputs you change on the recipe screen (weight, portions, hydration, modifier) are remembered.

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # calculation tests (checked against the original Numbers sheets)
npm run build
```

Without Supabase env vars the app runs in **local-only mode**: no login, and data is stored in the browser only.

## Supabase setup

1. Create a project at <https://supabase.com>.
2. In the **SQL Editor**, run [supabase/migrations/001_recipes.sql](supabase/migrations/001_recipes.sql).
3. Go to **Authentication → URL Configuration**:
   - Set **Site URL** to your Vercel URL.
   - Add `http://localhost:5173` and your Vercel URL to **Redirect URLs**.
4. Go to **Authentication → Email Templates → Magic Link** and add the one-time code to the template, for example `<p>Or enter this code: {{ .Token }}</p>`.

   An app installed on the iOS home screen has its own storage, separate from Safari. Tapping the link signs you in within Safari, so in the installed app you sign in by typing the code instead.
5. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. You'll find both under **Project Settings → API**.
6. Sign in once, then disable new sign-ups so the app stays single-user: **Authentication → Sign In / Providers → Allow new users to sign up** → off.

Recipes are stored as one JSON row per recipe in `public.recipes`. Row-level security limits each user to their own rows.

## Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel. It is detected as a Vite project: build command `npm run build`, output directory `dist`.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
3. On your phone, open the site and choose **Share → Add to Home Screen**.

## Backup

**Settings → Export recipes** downloads all recipes as JSON. **Import** restores them; recipes with the same id are replaced.

# Bakey: agent notes

A mobile-first PWA recipe book that uses baker's percentages. It replaces a set of Apple Numbers sheets. There's a single user (the owner). It's used on a phone in portrait mode and almost never on a larger screen. It should stay simple to use and simple to edit, with very little text in the UI.

## Stack

- Vite + React 19 + TypeScript (strict). `vite-plugin-pwa` handles installability and offline caching.
- Supabase handles auth (email OTP/magic link) and storage. The app is hosted on Vercel as a static site.
- No router library: hash routing lives in `src/router.ts`. No CSS framework: CSS modules, one per component (see [Styling](#styling)). There is only a dark theme; there's no light mode and no theme toggle.

## Commands

```sh
npm run dev      # dev server
npm run build    # tsc -b && vite build (also the typecheck)
npm run preview  # serve the build on :4173
npm run lint     # oxlint (config in .oxlintrc.json)
npm run lint:fix # oxlint with safe autofixes
npm run format   # oxfmt (config in .oxfmtrc.json): single quotes, no semicolons, 120 columns
npm run format:check
npm run typecheck # tsc -b
npm run check    # lint:fix, then format, then typecheck
```

**After every completed feature, run `npm run check` and make sure it passes before handing over to the user for verification.** If it fails, fix the cause; don't silence rules to get it green unless the rule is genuinely wrong for that line, in which case use a one-line `oxlint-disable-next-line <rule> -- <reason>`.

Linting uses Oxlint, not ESLint: typescript-eslint doesn't support TypeScript 7. Formatting uses oxfmt, not Prettier. Markdown is not formatted.

## Testing policy

**The repo keeps no permanent tests.** Write tests during development to verify the outcome you want (calculation tests with vitest, or browser checks with `playwright-core` against `npm run preview`). Once the outcome is achieved, delete them along with any test-only dependencies or scripts. Use the scratchpad for throwaway scripts where possible.

To verify calculations, use the reference values in [Original sheets](#original-sheets). For UI checks, use a 390×844 mobile viewport.

**Local and production share the same Supabase database** (`.env` points at the production project). Tests must never write to it, or even sign in to it:
- Build with the Supabase vars overridden. Vite never overwrites env vars that are already set, so `VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx vite build --outDir <scratch>` gives local-only mode. To test sync, set `VITE_SUPABASE_URL=https://fakeproj.supabase.co` and a dummy key, seed a fake session in localStorage (`sb-fakeproj-auth-token`), and answer every request to that host with Playwright's `page.route`.
- Before running a test, grep the bundle to make sure the real project host isn't in it.
- In Playwright, abort every request that isn't to localhost or the fake host.

## Code map

| File | Purpose |
| --- | --- |
| `src/types.ts` | Data model (`Recipe`, `Variant`, `Section`, `Ingredient`, `Amount`). Percentages are in percent units (72 = 72%). Also `categories` (list grouping, in display order). |
| `src/model.ts` | `newRecipe()` (the single source of recipe defaults, also used by `seed.ts`), `normalizeRecipe(s)` and the backup format (`exportRecipes`, `parseBackup`). |
| `src/calc.ts` | Pure calculation engine (`computeVariant`), recipe helpers shared by screens (`variantOf`, `inputsOf`, `findAnchor`, `showsPortions`), plus number formatting and parsing. |
| `src/seed.ts` | Starter recipes converted from the original Numbers sheets. |
| `src/store.tsx` | `StoreProvider`: recipes, auth, a localStorage cache, the offline write queue and Supabase sync. |
| `src/storeContext.ts` | The `Store` interface, its context, `useStore()` and `RECIPES_KEY`. Kept out of `store.tsx` so that file only exports components (Fast Refresh). |
| `src/supabase.ts` | Supabase client. It is `null` when env vars are missing, which puts the app in local-only mode with no login. |
| `src/styles/tokens.css` | Colour, radius and font tokens as CSS custom properties. The only place colours are defined. |
| `src/styles/global.css` | Reset and `body` styles. The only global CSS besides tokens. |
| `src/pages/<Name>/` | One folder per screen: `RecipeList`, `RecipeView` (the baking screen), `RecipeEdit`, `Settings`, `Login`. Larger screens keep their subcomponents next to `index.tsx` (e.g. `RecipeEdit/IngredientEditor.tsx`), and screen-specific helpers in a plain `.ts` file (e.g. `RecipeEdit/recipe.ts`). |
| `src/components/<Name>/` | Shared UI: `Page`, `TopBar`, `Card`, `Row`/`RowValue`, `SectionTitle`, `Button` (`IconButton`, `TextButton`, `PrimaryButton`), `Input`/`Select`/`TextArea`, `NumField` (decimal input that accepts a comma or a dot, with an optional stepper), `Segmented`, `Switch`, `Warning`/`WarningList`, `Hint`, `ErrorBoundary` (wraps the whole app in `main.tsx`; its fallback offers Reload, Back to recipes and an export of the raw cache), `Icon` (inline SVG paths). |
| `src/util.ts` | Small generic helpers: `uid`, `clone`, `cx`, `updateById` (immutable update of one item in an id'd list) and `readJson`/`writeJson` (localStorage that never throws). |
| `src/hooks.ts` | `useWakeLock` (always on in `RecipeView`) and `useLocalState` (per-device localStorage state). |
| `supabase/migrations/` | SQL for the `recipes` table + RLS. |

## Component conventions

- Every component that takes props declares a named `<Component>Props` interface directly above it (e.g. `AddButtonProps`), never inline object types or a generic `Props`. Put per-prop doc comments on the interface fields.
- Components without props (e.g. `Settings`) need no interface.

## Reuse

- Before writing a helper or component, check `src/util.ts`, `src/calc.ts`, `src/hooks.ts` and `src/components/` for one that already does it.
- Don't extract something that is used once. When the same pattern shows up a second or third time, weigh extracting it: it's worth it when it names a rule that must stay consistent (e.g. `showsPortions`, `variantOf`) or removes real noise (e.g. `updateById`, `WarningList`). It isn't worth it when the shared version needs more options than the copies it replaces.
- Put an extraction where its users are: next to the screen if only one screen uses it (e.g. `RecipeEdit/MoveButtons.tsx`), in `src/components/` once two screens do, and in `util.ts`/`calc.ts`/`hooks.ts` for non-UI code. Pure recipe logic belongs in `calc.ts`, not in components.
- When you add a shared helper, update the [Code map](#code-map).

## Styling

- Each component is `index.tsx` + `index.module.css`; a subcomponent in a page folder is `Foo.tsx` + `Foo.module.css`. Class names are camelCase (`s.tableNote`).
- Colours always come from the tokens in `src/styles/tokens.css`. Never hardcode a colour in a module. The background colour is also repeated in `index.html` (`theme-color`) and `vite.config.ts` (manifest), so keep those in sync.
- A `className` passed to a shared component may only *add* properties the component doesn't set itself (margins, `flex`). To override a property it does set, use a prop (e.g. `NumField narrow`, `Hint flush`) or a parent-scoped selector such as `.editor > .head`. That gives two-class specificity, so the result never depends on CSS bundle order.
- `cx()` in `src/util.ts` joins conditional class names.

## Calculation model

- **Scaling mode** (`recipe.mode`):
  - `total`: `base = totalWeight / Σ effective% × 100`.
  - `portions`: the total is `portions × portionSize`, then the same as `total`.
  - `anchor`: `base = anchorWeight / anchor% × 100`. The anchor ingredient is matched **by name** (`recipe.anchorName`) so it works across variants.
- **Amount kinds**:
  - `percent`: a fixed percentage.
  - `remainder`: fills its group up to the target. The flour target is 100%; the liquid target is `variant.hydration`. Only one remainder is allowed per group.
  - `relative`: `factor`% of another ingredient's percentage, referenced by id.
  - `toTaste`: no amount; it doesn't count toward totals.
- **Groups** (`flour` / `liquid` / `other`) exist only to resolve remainders.
- **Modifier:** when it's enabled, ingredients flagged `modified` get `pct × (1 + modifier/100)` *before* the totals and base are computed.
- **Portions:** `portionSize = total / portions`. When there are set-asides, `remaining = (total − Σ set-aside weights) / portions`.
- **Sections** only group ingredients for display and give each group a subtotal. **Variants** are alternative ingredient lists that share the recipe's inputs. `hydration` is stored per variant. A variant can also override `portions`, `portionSize` and `modifier`; `inputsOf()` resolves them, falling back to the recipe's values. On the recipe screen, an overridden input is saved on the variant.
- **Rounding:** weights show 2 dp below 1 g, 1 dp below 50 g, and whole grams otherwise.
- **Errors** (negative remainders, circular references, a missing hydration target) are returned in `result.errors` and shown as warnings, not thrown.

## Data & sync

- Each Supabase row is `public.recipes(id uuid, user_id, data jsonb, updated_at, created_at)` with RLS `user_id = auth.uid()`. The whole `Recipe` object is stored in `data`, so model changes don't need migrations.
- Everything read from outside the app goes through `normalizeRecipe()`: the localStorage cache, rows pulled from Supabase and imported backups. It fills missing or invalid fields with defaults, drops broken list items and keeps unknown fields. When you add a field to the model, add it to `normalizeRecipe()` as well; components can then rely on the types without defensive checks.
- Local-first:
  - The UI reads from state that is cached in localStorage (`bakey.recipes.v1`).
  - Writes go into a pending queue (`bakey.pending.v1`) and are flushed to Supabase.
  - The app pulls on sign-in, on focus and when it comes back online. Pending local changes win over server copies; otherwise it's last write wins.
- `saveSoon` debounces saves (800 ms) for inputs changed on the recipe screen. These are "remembered last used" values, saved on the recipe itself. It marks the recipe as pending straight away, so a pull during the debounce window doesn't overwrite the edit.
- Per-device state in localStorage: checklist ticks (`bakey.checked.<recipeId>`) and the last login email.

## Setup (Supabase + Vercel)

1. Create a Supabase project and run `supabase/migrations/001_recipes.sql` in the SQL editor.
2. Go to Auth → URL Configuration:
   - Set the Site URL to the Vercel URL.
   - Add the redirect URLs `http://localhost:5173` and the Vercel URL.
3. Go to Auth → Email Templates → Magic Link and add `{{ .Token }}` so the email contains a code.

   An app installed on the iOS home screen has its own storage, separate from Safari. A magic link opens in Safari and signs in there, not in the installed app, so `Login.tsx` also accepts the code via `verifyOtp`.
4. Fill `.env` from `.env.example`: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Set the same variables in Vercel.
5. After the owner's first sign-in, disable new sign-ups so the app stays single-user.

## Original sheets

The source Numbers files are in `examples_and_inspiration/`. To read cells, formulas and cell comments (where the notes live), use the Python package `numbers-parser` in a scratch venv. Reference values, with the default inputs from `seed.ts`:

| Recipe | Expected |
| --- | --- |
| Pizza – Regular (6 × 210 g, 72% hydration) | Σ 175.3%, whole wheat 71.87 g, water 503.14 g |
| Pizza – Poolish (6 × 210 g) | Σ 175.15%, poolish flour/water 215.82 g, remaining water 287.75 g, poolish subtotal 431.63 g |
| Seeded (2200 g) | base 1132.56 g, spelt 158.56 g |
| Pan de Coco regular (1400 g) | Σ 204.5%, coconut milk 547.68 g |
| Pan de Coco tangzhong | Σ 212.5%, flour 625.88 g, coconut milk 428.24 g, roux liquid 164.71 g |
| Waffles (332 g eggs) | milk 398.4 g, baking powder 41.5 g, total 1319.7 g |
| Crêpe (175 g eggs, −15%, 3 portions, 165 g set-aside) | milk 133.875 g, flour 89.25 g, total 398.125 g, portion 132.71 g, remaining 77.71 g |

Some displayed cell values in the sheets were rounded, so these are the real values:
- Waffle butter is 45% (it displayed as 0.5).
- Seeded yeast is 0.25% (it displayed as 0.3%).
- Waffle baking powder = eggs ÷ 8.

The waffle sheet's total left out baking powder; Bakey deliberately includes every measured ingredient.

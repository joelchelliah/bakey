# Bakey 🥖

A mobile recipe book based on baker's percentages.

## Using the app

- **Recipe list:** tap a recipe to open it, or **+** to create one. **Settings** (the gear icon) has backup export/import and lets you add the starter recipes.
- **Recipe screen:** change the inputs at the top (dough weight, portions, egg weight, hydration, modifier) and the weights update. Your inputs are remembered. Tap an ingredient to tick it off while weighing. The screen stays awake while a recipe is open.
- **Editing:** tap the pencil to edit ingredients, percentages, variants, sections and notes. Tap **Save** to keep your changes.
- **Install on your phone:** open the site in Safari, then **Share → Add to Home Screen**.

## Development

```sh
npm install
cp .env.example .env   # add Supabase URL + anon key, or leave empty for local-only mode
npm run dev            # http://localhost:5173
npm run build
```

# Cravings.. (fridge-to-recipe)

Cravings turns ingredients in a user's kitchen into dish ideas and interactive recipes. Users can:

- **Live demo:** https://cravings.aerinpatel.me  <!-- update if different -->
- **Screen recording:** https://www.youtube.com/watch?v=mfXfYhh66Nc

| Home | Results | Recipe |
| --- | --- | --- |
|<img width="1517" height="737" alt="image" src="https://github.com/user-attachments/assets/be6e2d69-94c3-450d-8be4-45e6d1072ce7" /> | <img width="1281" height="737" alt="image" src="https://github.com/user-attachments/assets/d846d9aa-f86f-4565-bb9d-b53df20a820a" />| <img width="1270" height="733" alt="image" src="https://github.com/user-attachments/assets/49257468-1231-4700-b542-1de2a9781365" /> |

## Tech stack

- **Frontend:** React 18 (hooks, functional components), Vite, React Router, Tailwind CSS
- **Backend:** Node.js + Express (a small API; on Vercel it runs as a serverless function)
- **AI:** Groq API, model `openai/gpt-oss-120b` (configurable with `GROQ_MODEL`)
- **Validation:** Zod

## Time spent

About 8 hours in total.

| Area | Time | What I did |
| --- | --- | --- |
| Planning and setup | 0.5 h | Chose fridge-to-recipe, defined the data shapes, set up Vite, Express and Tailwind |
| Prompts and server | 1.5 h | Wrote the three prompts, the Groq client, timeouts and error-code mapping |
| Validation and error handling | 2 h | Zod schemas, `callApi` (one retry for bad output), error codes |
| Core UI | 2 h | Ingredient input, category cards, dish cards, recipe page with steps, servings and swaps |
| Loading, error and empty states | 0.5 h | State components and retry flows |
| Responsive layout and polish | 0.75 h | Mobile layout, dark mode, About page, footer |
| Deploy, README and recording | 0.75 h | Vercel setup, domain, README, screen recording |
| **Total** | **8 h** | |

## Running locally

Requires Node 20.6 or newer.

```bash
npm install
npm start
```

The web app runs on `http://localhost:5173` and the API runs on `http://localhost:8787`.

Create a `.env` file containing:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=openai/gpt-oss-120b
PORT=8787
```

`GROQ_MODEL` and `PORT` are optional. `GET /api/health` reports the configured model and whether a key is present.

## How to use it

1. **Add ingredients (free-form input).** Type `eggs, tomato, onion` and press Enter: each comma-separated part becomes an ingredient. You can also tap suggestions or browse by group.
2. **Pick a dish.** The app shows 2 dishes. "Generate more dishes" adds 2 more (the model is told which ones to skip) up to 6.
3. **Cook along.** The recipe shows ingredients and steps. Tick steps off, and change the number of people to rescale amounts.
4. **Swap an ingredient.** Choose a swap for anything you are missing, then press "Update recipe". The model rewrites the whole recipe with your swaps.

## Swap Ingredients flow

<img width="1148" height="592" alt="image" src="https://github.com/user-attachments/assets/aad0f7a2-4edd-435e-8150-4dd69f5a2a47" />


Selecting a swap only records the pending choice. The AI is called once when the user presses “Update recipe”. The complete recipe is replaced because ingredient substitutions can change amounts, timings, and cooking methods. If the request fails, the previous recipe remains visible.

## Architecture decisions

### Shared providers preserve the active cooking session

`IngredientsProvider` and `RecipeFlowProvider` are mounted above the routed pages in `RootLayout`. Ingredient selections, dish suggestions, the current recipe, selected swaps, and completed steps therefore survive navigation between Home, Results, and Recipe pages. The state is intentionally in memory; it is not persisted across a browser refresh.

### Suggestions and recipes use separate AI stages

`/api/suggest` returns compact dish cards, while `/api/recipe` generates details only for the selected dish. This reduces latency and token usage on the results screen. `/api/swap` is a third specialized request because a substitution may require a complete rewrite of the recipe.

### One Express API owns all model communication

The frontend does not import the Groq client or expose `GROQ_API_KEY`. Express routes build the endpoint-specific prompt, call the shared Groq client, parse the provider response, and return an application-level JSON response. Locally the Express app listens on a port; on Vercel the same exported app is used by the configured API function.

### Prompt construction treats user text as data

[`api/_prompts.js`](api/_prompts.js) cleans and length-limits dish names, descriptions, ingredient names, exclusions, and swap values before inserting them into prompts. The prompt rules explicitly tell the model not to follow instructions embedded in those values. This reduces prompt-injection risk and keeps request sizes bounded.

### JSON mode is combined with defensive parsing

[`api/_groq.js`](api/_groq.js) requests Groq JSON mode, rejects empty output, detects token-limit truncation, tolerates an accidental code fence, and calls `JSON.parse`. Provider failures are mapped to stable application codes such as `TIMEOUT`, `RATE_LIMITED`, `CONFIG_ERROR`, `UPSTREAM_ERROR`, and `MALFORMED_JSON`.

JSON mode guarantees parseable JSON, not a correct recipe shape. The browser therefore performs a second, separate contract check with Zod.

### Zod normalizes small model inconsistencies without accepting broken data

[`src/lib/schemas.js`](src/lib/schemas.js) validates suggestions and recipes before they enter React state. It requires the fields used by the UI, enforces recipe step limits, converts numeric amounts to strings, normalizes common difficulty labels, and keeps only the first emoji grapheme. Nullable duration and tip values are normalized to `null`.

Invalid output becomes a `SCHEMA_MISMATCH` result instead of being rendered. `callApi` makes one additional attempt for malformed or schema-invalid output, then the UI displays a retryable error.

### Application IDs are generated locally

The model does not provide trusted identifiers. `withIds` assigns `ing-0`, `step-0`, and similar IDs after validation. Dish IDs are assigned by `addDishes`. These IDs are used for React keys, step completion, and swap selection.

### Keys prevent stale data from being displayed

`suggestKey` and `recipeKey` record which ingredient and dish inputs the current data belongs to. `ResultsPage` and `RecipePage` compare those keys with the current route and ingredient state before rendering existing results. This prevents a previous result from being shown as if it belonged to newly selected ingredients.

This is key-based freshness protection, not request cancellation or numeric request versioning. The current implementation does not use `AbortController` for browser requests.

### Errors preserve useful existing state

The first suggestion or recipe failure produces an error state because there is no usable result yet. A failed “Generate more” request keeps the existing dishes. A failed recipe swap keeps the previous recipe and exposes a retry action. This prevents a secondary AI failure from destroying content the user was already using.

### Serving changes are local UI transformations

Changing servings does not call the AI. `IngredientList` scales numeric values in amount strings locally and leaves values such as “to taste” unchanged. The AI is called again only when the user requests a recipe rewrite through ingredient swaps.

## Validation and failure protection

```text
User input
  → express JSON size limit
  → prompt input cleaning and endpoint checks
  → Groq JSON mode
  → provider response/error mapping
  → JSON.parse()
  → client Zod safeParse()
  → normalized data enters React state
```
### Loading, error and mismatch states

| Loading | Error | Mismatch |
| --- | --- | --- |
| <img width="972" height="652" alt="image" src="https://github.com/user-attachments/assets/9639a353-5df6-4f9a-b093-ce6669890c76" />| <img width="1022" height="385" alt="image" src="https://github.com/user-attachments/assets/68fbe55c-faf1-4dcd-8848-5bc001752e6f" /> | <img width="1310" height="410" alt="image" src="https://github.com/user-attachments/assets/e1f31b86-242d-4ce9-b122-1f229a11c931" />|

The current Zod validation is client-side. The API currently returns parsed JSON before schema validation, so server-side Zod validation is a planned hardening step rather than an implemented guarantee.

## Known limitations

- In-memory React state is lost on refresh, so a pasted recipe URL cannot restore its dish.
- There is no streaming; each result appears after the complete model response arrives.
- AI quantities, timings, nutrition, and food-safety guidance are not independently verified.
- The browser retries malformed or schema-invalid output once.
- The current API does not validate the final response shape with Zod before returning it.
- Groq model availability and free-tier rate limits can change.
- Dish deduplication is based on normalized dish names, not semantic similarity.

## AI usage note

I used Claude (Anthropic) to help design the system architecture, write the Zod schemas, structure the prompt engineering, and plan the request versioning pattern. The implementation — component logic, hook design, state management, error classification, and UI decisions — is my own. I can explain every line of this code and the reasoning behind every decision.

Groq with openai/gpt-oss-120b is used for recipe generation at runtime via two serverless functions. The model was switched mid-development from llama-3.1-70b-versatile (decommissioned by Groq on Sep 11 2026) to openai/gpt-oss-120b. This required a two-line change isolated to the backend — The frontend was unaffected.

## Future improvements

- Validate AI response schemas on the server before returning success.
- Add focused tests for `callApi`, schemas, prompt cleaning, and state transitions.
- Add request cancellation or explicit request sequencing for overlapping calls.
- Persist ingredients, suggestions, and recipes across refreshes.
- Add streaming or progress feedback for long recipe requests.
- Allow users to refine an existing recipe with a follow-up instruction.

## API routes

| Route | Input purpose | Output |
| --- | --- | --- |
| `GET /api/health` | Check API configuration | `{ ok, hasKey, model }` |
| `POST /api/suggest` | Ingredient names and optional excluded dish names | `{ suggestions: [...] }` |
| `POST /api/recipe` | Selected dish and available ingredients | `{ recipe: {...} }` |
| `POST /api/swap` | Dish, serving count, updated ingredients, and requested swaps | `{ recipe: {...} }` |

The API accepts JSON request bodies up to 50 KB. Invalid request input, unknown API routes, model errors, timeouts, and malformed responses are returned as JSON with a stable `code`.



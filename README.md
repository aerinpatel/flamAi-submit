# Cravings.. (fridge-to-recipe)

Tell the app what is in your kitchen and it suggests dishes you can cook. Each dish opens into an interactive recipe: steps to tick off, servings that rescale the amounts, and ingredient swaps that rewrite the recipe.

It is **not a chatbot**. The AI returns structured JSON, the app validates it, and it renders it as interactive components.

- **Live demo:** https://cravings.aerinpatel.me  <!-- update if different -->
- **Screen recording:** <!-- paste your video link here -->

| Home | Results | Recipe |
| --- | --- | --- |
|<img width="1517" height="737" alt="image" src="https://github.com/user-attachments/assets/be6e2d69-94c3-450d-8be4-45e6d1072ce7" /> | <img width="1281" height="737" alt="image" src="https://github.com/user-attachments/assets/d846d9aa-f86f-4565-bb9d-b53df20a820a" />| <img width="1270" height="733" alt="image" src="https://github.com/user-attachments/assets/49257468-1231-4700-b542-1de2a9781365" /> |

## Tech stack

- **Frontend:** React 18 (hooks, functional components), Vite, React Router, Tailwind CSS
- **Backend:** Node.js + Express (a small API; on Vercel it runs as a serverless function)
- **AI:** Groq API, model `openai/gpt-oss-120b` (configurable with `GROQ_MODEL`)
- **Validation:** Zod

The API key never reaches the browser: the browser calls our own `/api/*` routes, and only the server talks to Groq.

## Setup

Requires Node 20.6 or newer.

```bash
npm install
cp .env.example .env     # then put your key in GROQ_API_KEY (free at https://console.groq.com/keys)
npm start                # web on http://localhost:5173, API on http://localhost:8787
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `GROQ_API_KEY` | yes | Groq API key (server only, no `VITE_` prefix on purpose) |
| `GROQ_MODEL` | no | Defaults to `openai/gpt-oss-120b` |
| `PORT` | no | Local API port, defaults to `8787` |

`GET /api/health` reports whether the key and model are set.

## How to use it

1. **Add ingredients (free-form input).** Type `eggs, tomato, onion` and press Enter: each comma-separated part becomes an ingredient. You can also tap suggestions or browse by group.
2. **Pick a dish.** The app shows 2 dishes. "Generate more dishes" adds 2 more (the model is told which ones to skip) up to 6.
3. **Cook along.** The recipe shows ingredients and steps. Tick steps off, and change the number of people to rescale amounts.
4. **Swap an ingredient.** Choose a swap for anything you are missing, then press "Update recipe". The model rewrites the whole recipe with your swaps.

<img width="1148" height="592" alt="image" src="https://github.com/user-attachments/assets/aad0f7a2-4edd-435e-8150-4dd69f5a2a47" />

## Architecture decisions
 
### Staged AI flow
Instead of generating full recipes up front, the app asks the model in stages. `/api/suggest` returns only 2 lightweight dishes (name, description, cuisine, time, difficulty); "Generate more" appends 2 more, up to 6, telling the model which dishes to skip. A full recipe (4 to 14 steps, chosen by the model) is requested by `/api/recipe` only for the dish the user opens. Swaps are a third call, `/api/swap`, made once when the user presses "Update recipe". This avoids paying for detailed recipes nobody reads.
 
### Server as an API proxy
The Groq key never reaches the browser. The browser only calls our own `/api/*` routes; the Express server builds the prompts, calls Groq with `response_format: json_object`, and returns JSON. Locally it runs as a normal server. On Vercel the same app is exported from `api/index.js` and runs as a serverless function, so there is one codebase for both.
 
### Request ids and stale responses
Every call gets a unique id that the server echoes back. The provider keeps the id of the latest request in a ref, aborts any older request still in flight, and ignores any answer whose id is no longer the latest. `callApi` also rejects an answer whose echoed id does not match (`ID_MISMATCH`). Together these stop an old answer from overwriting a newer one when the user acts quickly.
 
### Zod validation before rendering
Every response is parsed with a Zod schema before it reaches React state, so components never render unvalidated data. A wrong shape is classified as `SCHEMA_MISMATCH`, retried once automatically, and then shown as a retryable error. The schemas are strict on what matters (required text, 4 to 14 steps) and forgiving on harmless noise (see the next point).
 
### Keeping results across pages
`RecipeFlowContext` holds the suggestions and the current recipe, so going back from a recipe to the results does not trigger a new AI call. Results are keyed by the ingredient list, so a page never shows an answer made for different ingredients.
 
### Swaps are picked first, applied once
Choosing a swap only marks it, and the steps are rewritten in one model call when the user confirms. This avoids a model call per click and gives a recipe whose steps match the swaps, instead of string-replacing words inside instructions. If the update fails, the old recipe stays on screen.
 
### Shared constants
Limits such as the number of dishes and the step range live in `shared/constants.js`. The prompts and the Zod schemas both read them, so the instructions given to the model and the checks on its answer cannot drift apart.
 
## Handling bad AI output
 
This is the core of the project. Each failure has a defined result, and none of them crash the app.
 
| What goes wrong | What happens |
| --- | --- |
| Malformed or truncated JSON | The server reports `MALFORMED_JSON` (a reply cut off at the token limit counts too). The browser retries once automatically, then shows an error with a retry button. |
| Valid JSON but the wrong shape | Zod rejects it (`SCHEMA_MISMATCH`). One automatic retry, then an error state. Zod is forgiving where it is safe (wording of difficulty, several emojis, numeric amounts, a broken swaps array becomes `[]`) and strict where it matters (required text, 4 to 14 steps). |
| Empty reply | `EMPTY_RESPONSE` / `NULL_RESPONSE`: one retry, then an error or empty state. |
| Slow reply | The server times out (15 s suggest, 25 s recipe and swap) and the browser has its own deadline (20 s / 32 s), then shows a retry. |
| Provider failure | Groq errors map to stable codes: `RATE_LIMITED`, `UPSTREAM_ERROR`, `CONFIG_ERROR`, `TIMEOUT`. Each has a clear message and a retry flag. |
| Stale response | Every call has a unique request id that the server echoes back. Answers from superseded requests are dropped, and a mismatched id is treated as an error (`ID_MISMATCH`), so an old answer can never overwrite a newer one. |
| Failure while something is on screen | A failed "Generate more" or "Update recipe" keeps what is already shown and offers a retry. |
| Bad request or unknown route | The server always answers with JSON (`INVALID_INPUT`, `NOT_FOUND`, `INTERNAL_ERROR`), never an HTML error page. |
 

### Loading, error and empty states

| Loading | Error | Empty |
| --- | --- | --- |
| <img width="972" height="652" alt="image" src="https://github.com/user-attachments/assets/9639a353-5df6-4f9a-b093-ce6669890c76" />| <img width="1022" height="385" alt="image" src="https://github.com/user-attachments/assets/68fbe55c-faf1-4dcd-8848-5bc001752e6f" /> | <img width="1310" height="410" alt="image" src="https://github.com/user-attachments/assets/e1f31b86-242d-4ce9-b122-1f229a11c931" />|

## Works on mobile

Phones get one category card per row, full-width buttons and larger tap targets. The hero becomes a normal block on small screens, and grid columns use `minmax(0, 1fr)` so long dish names wrap instead of overflowing.

| Home (mobile) | Results (mobile) | Recipe (mobile) |
| --- | --- | --- |
| <img width="315" height="648" alt="image" src="https://github.com/user-attachments/assets/cddb7564-a4e1-4f40-bb51-e0365d2a403e" /> | <img width="281" height="630" alt="image" src="https://github.com/user-attachments/assets/3610140f-23d6-4b0b-ba87-be8adadc4e8c" /> |<img width="305" height="642" alt="image" src="https://github.com/user-attachments/assets/377c852f-4c4d-4f2b-82d6-3bb74f165e0a" />|

## Project structure

```
src/
  App.jsx                 route table (+ 404 page)
  lib/api.js              Zod schemas, parsing, callApi (timeout, abort, one retry, request id check)
  context/                IngredientsContext, RecipeFlowContext (suggestion + recipe logic)
  pages/                  Home, About, Results, Recipe
  components/             one folder per component (Navbar, Footer, CategoryCard, DishCard,
                          IngredientPicker, IngredientModal, IngredientList, RecipeSteps,
                          LoadingState, ErrorState, EmptyState, PanelLoading)
server/                   index.js (routes), groq.js (client + error mapping), prompts.js
shared/constants.js       limits used by both server and client
api/index.js              Vercel entry that re-exports the Express app
```

## AI usage note

I used Claude (Anthropic) to help design the system architecture, write the Zod schemas, structure the prompt engineering, and plan the request versioning pattern. The implementation component logic, hook design, state management, error classification, and UI decisions is my own. I can explain every line of this code and the reasoning behind every decision.

Groq with openai/gpt-oss-120b is used for recipe generation at runtime via two serverless functions. The model was switched mid-development from llama-3.1-70b-versatile (decommissioned by Groq on Sep 11 2026) to openai/gpt-oss-120b. This required a two-line change isolated to the backend The frontend was unaffected.

## Known limitations

- Dishes and recipes live in memory only. Refreshing a recipe page loses them (the page shows a "lost track" state). There are no saved sessions.
- A swap needs a full model call (up to ~25 s) because the steps are rewritten rather than string-replaced.
- No streaming: results appear when the full response arrives.
- The free Groq tier has per-minute and per-day limits, so a `429` shows as a rate-limit message.
- Open models follow the JSON shape less strictly than paid ones, so the Zod schema and the single automatic retry matter more.
- Groq retires models now and then. If the app reports the model is unavailable, set `GROQ_MODEL` to a current one and restart.
- Quantities and cooking times come from the model and are not verified.

## What I would do next

- Save recipes and sessions (localStorage or a small database) so a refresh does not lose them.
- Stream the recipe as it is generated.
- Add tests for the Zod schemas and `callApi` (retry, timeout, stale responses).
- Let users refine a recipe with follow-up instructions (for example "make it spicier").
- Add different UI themes switchable by buttons

## Time spent

About 8 hours in total.

| Area | Time | What I did |
| --- | --- | --- |
| Planning and setup | 0.5 h | Chose fridge-to-recipe, defined the data shapes, set up Vite, Express and Tailwind |
| Prompts and server | 1.5 h | Wrote the three prompts, the Groq client, timeouts and error-code mapping |
| Validation and error handling | 2 h | Zod schemas, `callApi` (retry, timeout, request ids), stale-response handling |
| Core UI | 2 h | Ingredient input, category cards, dish cards, recipe page with steps, servings and swaps |
| Loading, error and empty states | 0.5 h | State components and retry flows |
| Responsive layout and polish | 0.75 h | Mobile layout, dark mode, About page, footer |
| Deploy, README and recording | 0.75 h | Vercel setup, domain, README, screen recording |
| **Total** | **8 h** | |

# Cravings.. (fridge-to-recipe)

React + Vite + React Router + Tailwind CSS, with a small Express server that calls Groq.

## Setup

    npm install
    cp .env.example .env     # then put your key in GROQ_API_KEY (free at console.groq.com/keys)
    npm start                # web on :5173, API on :8787 (needs Node 20.6+)

## Flow

The server has 3 LLM endpoints and a health check. The browser does the validation (zod) and the state handling.

1. Home: the user adds ingredients. The text box is free-form: type `eggs, tomato, onion` and each comma-separated part becomes its own ingredient (`lib/splitIngredients.js`). Suggestions and group popups work too. The server splits stray commas again before building the prompt.
2. Results: `POST /api/suggest` returns 2 dishes, stored in an array. "Generate more dishes" appends 2 more (the model is told which dishes to skip) until the array holds 6.
3. Recipe: clicking a dish calls `POST /api/recipe`. The model decides the number of steps (4 to 14) and also returns the description, emoji and possible swaps for every ingredient. Servings scale, steps can be checked off.
4. Swap: picking a swap only marks it (the steps do not change). An "Update recipe" button appears; it calls `POST /api/swap` with the ingredient list and the picked swaps, the model rewrites the whole recipe, and the ingredients and steps show a loading skeleton until the new recipe arrives and replaces the old one. If it fails, the old recipe stays and the button offers a retry.
5. `GET /api/health` reports whether the key and model are set.

## Structure

    src/
      App.jsx               route table (+ 404 page)
      lib/api.js            zod schemas, parsing, callApi (timeout, abort, one retry, request id check)
      context/              IngredientsContext; RecipeFlowContext (suggestions + recipe logic, keeps AI results across pages)
      pages/                Home, About, Results, Recipe
      components/           one folder per component (Navbar, Footer, CategoryCard, DishCard, IngredientPicker,
                            IngredientModal, IngredientList, RecipeSteps, LoadingState, ErrorState, EmptyState, PanelLoading)
    server/                 index.js (routes), groq.js (client), prompts.js
    shared/constants.js     counts used by both server and client

## Failure handling

- Server: input cleaned and validated; Groq is called with `response_format: json_object` and a timeout (15 s suggest, 25 s recipe and swap); the reply is parsed (so the client always gets parsable JSON) and Groq errors map to codes (RATE_LIMITED, TIMEOUT, UPSTREAM_ERROR, CONFIG_ERROR, EMPTY_RESPONSE, MALFORMED_JSON; a reply cut off at the token limit counts as MALFORMED_JSON).
- Client: every response is checked with zod before rendering; deadlines of 20 s (suggest) and 32 s (recipe, swap); one automatic retry when the output was empty, malformed or the wrong shape; every call has a unique request id that the server echoes back: a mismatch is an error (back to home), and answers of superseded requests are dropped; every error has a code and a retry flag. A failed "generate more" or swap update keeps what is already on screen.
- zod is forgiving where it is safe (difficulty wording, several emoji, "null" strings, numeric amounts, broken swaps arrays become `[]`) and strict where it matters (required text, 4 to 14 steps).

## AI usage note

- The app calls Groq (model set by `GROQ_MODEL`, default `openai/gpt-oss-120b`) from the Express server only; the key never reaches the browser.
- I used Claude as a coding assistant for parts of this project (prompt drafts, hook and schema structure, the swap feature, tests of the error handling). I read and can explain all of it.
- TODO (fill in honestly): which other parts you wrote yourself or used other tools for.

## Responsive layout

Checked in a headless browser at 320, 360, 390, 768, 1024 and 1440 px on every page: no sideways scroll. Phones get one category card per row, full-width buttons and larger tap targets; the hero is a normal block below 860 px; grid columns use `minmax(0, 1fr)` so long dish names wrap instead of overflowing.

## Known limitations

- Groq retires models now and then. If the app says the model is not available, set `GROQ_MODEL` in `.env` to a current one and restart the server.

- Dishes and recipes live in memory only: a page refresh on a recipe page loses them (the page shows a "lost track" state).
- A swap needs a full model call (up to ~25 s) because the steps are rewritten, not string-replaced.
- Free-tier rate limits can return `RATE_LIMITED`; the user can retry.
- The free Groq tier has per-minute and per-day limits; a 429 shows as a rate-limit message.
- Open models like Llama follow the JSON shape less strictly, so the zod schema and the one automatic retry matter more.
- No streaming and no saved sessions.

## Time spent

- TODO: add your actual hours (the assignment asks for at most ~8).

## Deploy on Vercel

1. Push the repo to GitHub and import it in Vercel (framework: Vite, defaults are fine).
2. In Project Settings → Environment Variables add `GROQ_API_KEY` (and optionally `GROQ_MODEL`).
3. Deploy. `vercel.json` routes `/api/*` to the Express app in `api/index.js` and every other path to the React app.

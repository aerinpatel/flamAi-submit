# Cravings.. (fridge-to-recipe)

Tell the app what is in your kitchen and it suggests dishes you can cook. Each dish opens into an interactive recipe: steps to tick off, servings that rescale the amounts, and ingredient swaps that rewrite the recipe.

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

## Swap Ingredients flow

<img width="1148" height="592" alt="image" src="https://github.com/user-attachments/assets/aad0f7a2-4edd-435e-8150-4dd69f5a2a47" />

## Architecture decisions
 
### 1. Ask the AI in stages instead of all at once
My first thought was to generate a full recipe for every dish, but that is slow and wasteful, because most people only open one dish. So the first call (`/api/suggest`) returns just two short dish ideas. If the user wants more, "Generate more" asks for two more (and tells the model which ones to skip), up to six. The full recipe is only generated when someone opens a dish. The first screen loads fast, and I only pay for recipes that actually get read.
 
### 2. Keep the API key on the server
The assignment said not to ship the key in the browser, so the React app never talks to Groq. It only calls my own `/api/*` routes, and a small Express server builds the prompts, calls the model and sends back JSON. I wanted one codebase for both local development and hosting, so the same Express app runs normally on my machine and gets exported as a serverless function on Vercel.
 
### 3. Never trust the model's output
Models do not always follow the format, so nothing the AI returns goes straight into the UI. Every response is checked with a Zod schema first, and components only ever receive data that passed. I made the schema strict where it matters (names, steps, the 4 to 14 step range) and forgiving where the mistakes are harmless, such as "easy" vs "Medium" difficulty or a broken swaps list. Rejecting a good recipe over a capital letter would be worse for the user than quietly fixing it.
 
### 4. Make failures recoverable, not just visible
Slow, empty, malformed or rate-limited replies are all things that will happen with a free model. Each failure gets its own error code on the server, the browser retries once on its own, and the server and browser both have timeouts, so the user never stares at an endless spinner. If something fails while a result is already on screen, for example a failed "Generate more", I keep what they already have and just show a retry. The goal was that an AI failure never makes the app lose the user's progress.
 
### 5. Stop old answers from overwriting new ones
If someone adds an ingredient and searches again while the first request is still running, the slower, older answer could arrive last and replace the newer one. To prevent that, every request gets a unique id, an older request is aborted when a newer one starts, and a response is only used if its id is still the latest. The server also echoes the id back, so a mismatched answer is rejected.
 
### 6. Keep the flow state in one place, and apply swaps once
The suggestions and the current recipe live in a React context, so going back from a recipe to the results does not trigger another AI call. Results are tied to the ingredient list they were made for, so the app never shows an answer for different ingredients. For swaps, clicking only marks the choice, and the recipe is rewritten once when the user presses "Update recipe". Replacing words in the steps myself would break the instructions (cooking times and methods change with the ingredient), so I let the model rewrite the whole recipe in one call. If that call fails, the original recipe stays on screen.

### Loading, error and empty states

| Loading | Error | Empty |
| --- | --- | --- |
| <img width="972" height="652" alt="image" src="https://github.com/user-attachments/assets/9639a353-5df6-4f9a-b093-ce6669890c76" />| <img width="1022" height="385" alt="image" src="https://github.com/user-attachments/assets/68fbe55c-faf1-4dcd-8848-5bc001752e6f" /> | <img width="1310" height="410" alt="image" src="https://github.com/user-attachments/assets/e1f31b86-242d-4ce9-b122-1f229a11c931" />|


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
- Retry on Server itself if the zod validation fail for a set amout of times and only return error if still bad response after retrying
- Stream the recipe as it is generated.
- Add tests for the Zod schemas and `callApi` (retry, bad output).
- Let users refine a recipe with follow-up instructions (for example "make it spicier").
- Add different UI themes switchable by buttons

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

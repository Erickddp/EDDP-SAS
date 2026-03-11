# A. Executive summary
MyFiscal currently stands as an **Advanced MVP**. It features a polished Next.js App Router front-end, a structured chat interface, and a well-designed internal framework for retrieving legal context. However, under the hood, the live application relies on hardcoded static data rather than its database, and it utilizes OpenAI with a robust but static fallback ("MockEngine") for safety. 

# B. Current architecture
- **Public layer**: React Server Components handling marketing routes (`/`) and authentication entry points (`/login`, `/register`).
- **Auth/access layer**: A lightweight, JWT-based authentication layer (using `jose`) controlled via Next.js `middleware.ts` to protect routes.
- **Product/chat layer**: The core user interface (`/chat`) that handles state, memory, and prompts.
- **API layer**: A single endpoint (`/api/chat/route.ts`) bridging the client UI with the retrieval generation cycle.
- **Legal retrieval layer**: A hybrid RAG approach relying on keyword + basic semantic rules (`lib/hybrid-retrieval.ts` and `lib/legal-search.ts`). *Currently offline/static.*
- **Data ingestion layer**: Scripts to parse raw `.txt` files driven by a `manifest.json` into structured, normalized `.json` arrays.
- **Database layer**: PostgreSQL schema and connection structure (`pg`), heavily scripted for setup and data loading, but completely detached from the live UI.
- **AI/LLM layer**: OpenAI integration (`gpt-4o`/`gpt-4o-mini`) tasked to act based on context, gracefully degrading to `MockEngine` upon failure or timeout.

# C. Route map
- `/` - Marketing Landing Page (Public)
- `/login` - Auth Entry (Public)
- `/register` - Sign up / Account creation (Public)
- `/chat` - Main application shell and chat interface (Protected via middleware)
- `/api/chat` - API for message processing and AI completion
- `/api/articles` - API endpoint for retrieving source data (used by article viewers)

# D. Component map
- `components/marketing/` (Hero, Features, Pricing): Composes the public-facing landing page.
- `components/product/` (Chat Interface, Sidebar, Legal Context Viewer): Composes the SaaS application.
- `components/ui/` (Buttons, Inputs, Cards): Base reusable UI primitives.
- `components/layout/` (Navbars, Footers, Mobile Menu): Global wrappers.

# E. Backend/service map
- `lib/db.ts`: PostgreSQL connection pool.
- `lib/hybrid-retrieval.ts`: Core search, scoring, and ranking logic.
- `lib/legal-search.ts`: Lexical search and NLP parsing helpers.
- `lib/legal-ingestion.ts`: Parsing engine to extract articles from raw `.txt`.
- `lib/laws.ts` & `lib/laws/`: **Hardcoded TS files** holding the active data.
- `lib/mock-engine.ts`: Hardcoded knowledge base and logic to bypass OpenAI when needed.
- `lib/auth.ts` / `session.ts`: JWT management.
- `scripts/build-laws.ts`: Script converting TXT via `manifest.json` to JSON.
- `scripts/load-laws.ts`: Script migrating JSON to PostgreSQL.
- `scripts/setup-db.ts`: Script formatting the SQL schema.

# F. Data flow map
1. **Raw text ingestion**: `manifest.json` + `data/legal/raw/*.txt` ➡️ `scripts/build-laws.ts` ➡️ `data/legal/normalized/*.json`.
2. **Database loading (Offline)**: `data/legal/normalized/*.json` ➡️ `scripts/load-laws.ts` ➡️ PostgreSQL `documents` & `articles` tables.
3. **Live Chat Request**: `UI` ➡️ `POST /api/chat` ➡️ `hybrid-retrieval.ts` (queries **static TS arrays**, NOT PostgreSQL) ➡️ Context passed to OpenAI ➡️ JSON Response ➡️ `UI`.
4. **Auth flow**: Login ➡️ Formulates JWT `Session Cookie` ➡️ `middleware.ts` intercepts `/chat` to enforce access.

# G. Current storage map
- **Memory/Static Code**: `ALL_LAW_ARTICLES` exported from `lib/laws/index.ts` serves all live data to the app. 
- **JSON files**: `data/legal/normalized/` acts as an intermediate artifact map.
- **PostgreSQL/Supabase**: Tables (`documents`, `articles`) exist and are populated via offline scripts, but are **not queried by the live application**.
- **Env variables**: `.env` stores the critical values (`DATABASE_URL`, `OPENAI_API_KEY`).
- **Cookies**: Session tokens.

# H. Current production readiness level
**Level: Advanced MVP**
The project is structurally excellent on the frontend, possessing realistic UI states, middleware protection, and error-handling fallbacks. However, technically, the "brain" of the app is mocked. The data retrieval is hardcoded to static TypeScript arrays rather than the live PostgreSQL database, and there are no actual pgvector embeddings operating in the chat API. It requires a database wiring phase before being production-stable for real users.

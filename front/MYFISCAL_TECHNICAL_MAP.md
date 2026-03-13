# A. Executive summary
MyFiscal currently stands as an **Advanced MVP (Pre-Release)**. It features a polished Next.js App Router front-end, a structured chat interface, and a well-designed internal framework for retrieving legal context. Under the hood, the live application relies on JSON files loaded into memory for legal retrieval (transitioning away from hardcoded TypeScript arrays). It utilizes OpenAI (`gpt-4o`) as the primary intelligence engine for structured JSON responses, with a robust static fallback ("MockEngine") for safety and timeouts.

# B. Current architecture
- **Public layer**: React Server Components handling marketing routes (`/`) and authentication entry points (`/login`, `/register`).
- **Auth/access layer**: A lightweight, JWT-based authentication layer (using `jose`) controlled via Next.js `middleware.ts` to protect routes.
- **Product/chat layer**: The core user interface (`/chat`) that handles state, formatting (citations), and real-time interaction.
- **API layer**: A single endpoint (`/api/chat/route.ts`) bridging the client UI with the retrieval generation cycle. Maneja memoria conversacional e intención de usuario.
- **Legal retrieval layer**: A context-aware RAG approach relying on keyword, deterministic law-article matching, and memory extensions (`lib/normalized-retrieval.ts`, `lib/context-builder.ts`). *Currently queries JSON files in memory.*
- **Data ingestion layer**: Scripts to parse raw `.txt` files driven by a `manifest.json` into structured, normalized `.json` arrays.
- **Database layer**: PostgreSQL schema and connection structure (`pg`), heavily scripted (`scripts/setup-db.ts`, `scripts/load-laws.ts`) but currently detached from the live UI.
- **AI/LLM layer**: OpenAI integration (`gpt-4o`) tasked to act based on context, utilizing dynamic token limits and complexity depth rules (`lib/llm-prompt.ts`), gracefully degrading to `MockEngine` upon failure.

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
- `lib/normalized-retrieval.ts`: Core retrieval engine reading `data/legal/normalized/` JSONs into RAM memory for search.
- `lib/context-builder.ts`: Orchestrator for building retrieval context objects.
- `lib/query-analyzer.ts`: Analyzes user query for complexity, intent, and structuring logic.
- `lib/conversation-context.ts`: In-memory state tracking to detect follow-ups and preserve topics.
- `lib/legal-authority-ranker.ts`: Classifies retrieved articles into primary, supporting, or rejected sources.
- `lib/hybrid-retrieval.ts` & `lib/laws.ts`: **Deprecated/Legacy** TS fallback files and logic.
- `lib/mock-engine.ts`: Hardcoded knowledge base and logic to bypass OpenAI when needed.
- `lib/auth.ts` / `session.ts`: JWT management.
- `scripts/build-laws.ts`: Script converting TXT via `manifest.json` to JSON.
- `scripts/load-laws.ts`: Script migrating JSON to PostgreSQL.
- `scripts/setup-db.ts`: Script formatting the SQL schema.

# F. Data flow map
1. **Raw text ingestion**: `manifest.json` + `data/legal/raw/*.txt` ➡️ `scripts/build-laws.ts` ➡️ `data/legal/normalized/*.json`.
2. **Database loading (Offline)**: `data/legal/normalized/*.json` ➡️ `scripts/load-laws.ts` ➡️ PostgreSQL `documents` & `articles` tables.
3. **Live Chat Request**: `UI` ➡️ `POST /api/chat` ➡️ `normalized-retrieval.ts` (queries **JSON files in memory**, NOT PostgreSQL) ➡️ Filtering & Authority Ranking ➡️ Context passed to OpenAI (`gpt-4o`) ➡️ Structured JSON Response ➡️ `UI`.
4. **Auth flow**: Login ➡️ Formulates JWT `Session Cookie` ➡️ `middleware.ts` intercepts `/chat` to enforce access.

# G. Current storage map
- **JSON files**: `data/legal/normalized/` acts as the primary data source, loaded into memory upon initialization in `normalized-retrieval.ts`.
- **Memory/Static Code**: Legacy `ALL_LAW_ARTICLES` exported from `lib/laws/index.ts` is in process of deprecation.
- **PostgreSQL/Supabase**: Tables (`documents`, `articles`) exist and are populated via offline scripts, but are **not queried by the live chat application**.
- **Env variables**: `.env` stores the critical values (`DATABASE_URL`, `OPENAI_API_KEY`).
- **Cookies**: Session tokens.

# H. Current production readiness level
**Level: Advanced MVP (Pre-Release)**
The project is structurally excellent on the frontend, possessing realistic UI states, middleware protection, advanced intent classification, conversational memory, and robust error-handling fallbacks. Technically, the "brain" of the app is fully operational via OpenAI. However, the data retrieval is fundamentally an in-memory search over JSON maps. Although significantly better than static TS arrays, it still lacks `pgvector` semantic matching capabilities and does not query the live PostgreSQL database. It requires one final database-wiring phase (connecting `context-builder` to pg) before being considered 100% production-stable and scalable.

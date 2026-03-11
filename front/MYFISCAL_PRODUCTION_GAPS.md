# A. Critical blockers (Preventing Production Release)

### 1. Disconnected Database Retrieval
- **Current status**: The live search logic (`lib/hybrid-retrieval.ts` and `lib/legal-search.ts`) relies entirely on static TypeScript arrays imported from `lib/laws/index.ts` (e.g., `CFF_ARTICLES`).
- **Why it matters**: The app cannot dynamically read updated laws, scale efficiently, or use advanced database indexes. The PostgreSQL infrastructure built via scripts is completely bypassed in production.
- **Recommended fix**: Rewrite the retrieval methods to query PostgreSQL using the `lib/db.ts` connection pool instead of iterating over the `ALL_LAW_ARTICLES` array.
- **Priority**: Critical

### 2. Missing Vector Embeddings in Live Flow
- **Current status**: While `pgvector` dependencies exist and `scripts/build-embeddings.ts` is staged, live chats do not generate user-query embeddings, nor do they run cosine-similarity queries against the DB.
- **Why it matters**: True semantic Search (RAG) is impossible without vector similarity. The current semantic search merely matches hardcoded synonyms and keyword stems.
- **Recommended fix**: Finalize embedding generation scripts, insert embeddings into the `articles` table, and integrate `pgvector` distance queries into the `/api/chat` route.
- **Priority**: Critical

### 3. Missing Production Authentication & User Persistence
- **Current status**: The auth relies on a basic stateless JWT cookie. There is no live PostgreSQL `users` table managing accounts, quotas, or passwords securely.
- **Why it matters**: You cannot gate premium access, limit usage, or store user chat history permanently without a relational auth system.
- **Recommended fix**: Integrate Supabase Auth or standard PostgreSQL `user_accounts` and `chat_sessions` tables.
- **Priority**: Critical

---

# B. Important but not blocking

### 1. Missing Rate Limiting and Quota Management
- **Current status**: The `/api/chat` route is naked. Any logged-in user can spam the endpoint.
- **Why it matters**: Malicious or heavy users can exhaust the OpenAI API budget instantly.
- **Recommended fix**: Implement Upstash Ratelimit or Vercel KV rate limiting by user ID.
- **Priority**: High

### 2. Lack of Error Boundaries and Telemetry
- **Current status**: Errors are simply logged to the console, and OpenAI failures fall back to a MockEngine.
- **Why it matters**: The team has no visibility into production crashes, latency, or the frequency of LLM fallback events.
- **Recommended fix**: Integrate an error logging platform (e.g., Sentry) and React Error Boundaries around the chat interface.
- **Priority**: Medium

---

# C. Nice to have

### 1. Automated Pipeline Triggering
- **Current status**: Adding laws requires a developer to manually alter `manifest.json` and run `npm run build:laws` and `npm run load:laws`.
- **Why it matters**: Legal catalog expansion requires developer intervention, slowing down content teams.
- **Recommended fix**: Build a secure internal admin dashboard to upload a `.txt` file, which automatically triggers the manifest, normalization, and DB upsert pipeline.
- **Priority**: Low

### 2. Conversation History Persistence
- **Current status**: Chat history is handled transiently via the local React state.
- **Why it matters**: Users will lose their context if they refresh the tab.
- **Recommended fix**: Save chat transcripts to a `conversations` table in PostgreSQL mapped to their user ID.
- **Priority**: Low

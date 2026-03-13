# A. Critical blockers (Preventing Production Release)

### 1. Disconnected Database Retrieval
- **Current status**: The live search logic (`lib/normalized-retrieval.ts`) relies on loading normalized JSON files (`data/legal/normalized/`) into server memory. It no longer uses static TS arrays, but it still bypasses the database.
- **Why it matters**: While better than hardcoded arrays, the app cannot dynamically read updated laws from a central source, scale efficiently across serverless functions, or use advanced database indexes (pgvector). The PostgreSQL infrastructure built via scripts is completely bypassed in production.
- **Recommended fix**: Connect `lib/context-builder.ts` to query PostgreSQL using the `lib/db.ts` connection pool instead of iterating over JSON maps in memory.
- **Priority**: Critical

### 2. Missing Vector Embeddings in Live Flow
- **Current status**: While `pgvector` dependencies exist and `scripts/build-embeddings.ts` is staged, live chats do not generate user-query embeddings, nor do they run cosine-similarity queries against the DB.
- **Why it matters**: True semantic Search (RAG) is impossible without vector similarity. The current semantic search merely matches hardcoded synonyms and keyword stems.
- **Recommended fix**: Finalize embedding generation scripts, insert embeddings into the `articles` table, and integrate `pgvector` distance queries into the `/api/chat` route.
- **Priority**: Critical

### 3. Missing Production Authentication & User Persistence
- **Current status**: The auth relies on a basic stateless JWT cookie (`jose`). There is no live PostgreSQL `users` table managing accounts, quotas, or passwords securely.
- **Why it matters**: You cannot gate premium access, limit usage, or store user chat history permanently without a relational auth system.
- **Recommended fix**: Integrate standard PostgreSQL `user_accounts` and `chat_sessions` tables or use Supabase Auth.
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

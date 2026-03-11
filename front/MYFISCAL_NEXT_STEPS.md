# Phase 1 — Stabilize current beta
- **Goal**: Lock down the UI, ensure components compile flawlessly, and polish the static fallbacks.
- **Tasks**: 
  - Cleanup unused or duplicated components.
  - Verify `middleware.ts` routes properly handle edge cases.
  - Ensure the `MockEngine` is strictly scoped as an emergency fallback, not the primary path.
- **Dependencies**: None.
- **Expected outcome**: A visually perfect application ready for heavy backend wiring without front-end debt.

---

# Phase 2 — Production data layer
- **Goal**: Connect the actual application code to the PostgreSQL (Supabase) database.
- **Tasks**:
  1. Deprecate and remove `lib/laws/*.ts` static arrays.
  2. Rewrite `lib/hybrid-retrieval.ts` to perform standard `SELECT` operations via `lib/db.ts` to fetch articles upon query.
  3. Ensure `scripts/load-laws.ts` correctly upserts the output of the ingestion pipeline.
- **Dependencies**: Phase 1.
- **Expected outcome**: The live chat reads actual database records, paving the way for scalable data management.

---

# Phase 3 — Real semantic retrieval
- **Goal**: Enable actual AI semantic search via embeddings, replacing the static linguistic match logic.
- **Tasks**:
  1. Complete and run `scripts/build-embeddings.ts` to generate vectors for all normalized JSON articles via OpenAI's `text-embedding-3-small`.
  2. Implement `pgvector` cosine similarity (`<=>`) inside PostgreSQL queries in `hybrid-retrieval.ts`.
  3. Wire the retrieval output sequentially to the OpenAI LLM prompt in `/api/chat`.
- **Dependencies**: Phase 2.
- **Expected outcome**: Highly accurate contextual retrieval based on meaning, not just exact keywords.

---

# Phase 4 — SaaS controls
- **Goal**: User persistence, security, and rate limiting.
- **Tasks**: 
  1. Create a `users` table and replace the mock `jose` stateless JWT with robust session tracking.
  2. Implement rate limits to `/api/chat` to protect LLM quotas.
  3. Add a `chat_history` table so users can revisit previous sessions.
- **Dependencies**: Phase 2.
- **Expected outcome**: A defensible, monetizable application that safely manages users.

---

# Phase 5 — Scaling
- **Goal**: Hardening, monitoring, and performance.
- **Tasks**:
  1. Integrate Sentry for error boundary tracking.
  2. Add Redis/KV caching to frequently asked LLM queries to save costs.
  3. Automate the ingestion pipeline so admin users can upload new laws without developer scripts.
- **Dependencies**: Phase 4.
- **Expected outcome**: A fully matured SaaS ready for heavy user traffic.

---

# Immediate next 5 actions
1. **Refactor Retrieval**: Change `lib/hybrid-retrieval.ts` to execute `SELECT` queries against PostgreSQL instead of mapping over static TS arrays.
2. **Generate Embeddings**: Finalize `scripts/build-embeddings.ts` and run it against your PostgreSQL `articles` table to initialize `pgvector`.
3. **Connect Embeddings to API**: Update the `POST /api/chat` route to use vector similarity for context building.
4. **Remove Static Law Files**: Safely delete the `lib/laws/cff.ts` (and similar) hardcoded files to ensure the app doesn't accidentally rely on mocked data.
5. **Implement Rate Limiting**: Add an IP-based or Session-based API rate limit to `/api/chat` to protect against immediate quota exhaustion.

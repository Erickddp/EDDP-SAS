# MASTER PLAN: SASFiscal

Este documento consolida el estado arquitectónico, las rutas, las integraciones y el backlog técnico del sistema operativo institucional. Constituye la ÚNICA fuente de verdad para el estado de producción de la aplicación.

---

## 1. MAPA DE RUTAS OFICIAL

### Rutas de Aplicación Front-End (UI)
- **Públicas / Marketing:**
  - `/` - Landing comercial principal
  - `/login` - Acceso de usuarios
  - `/register` - Creación de cuenta
- **Privadas / App:**
  - `/chat` - Interfaz principal de asistente fiscal (Protegido por RBAC/Middleware)
  - `/account` - Gestión de cuenta de usuario, planes y cuotas
- **Administrativas:**
  - `/admin` - Panel de control y carga de documentos (CMS local)

### Rutas de API (Backend)
- **Chat & RAG:**
  - `POST /api/chat` - Orquestador principal, maneja el flujo RAG, ranking legal e interacción con el LLM.
  - `GET /api/chat/history` - Recuperación del historial persistente de conversaciones.
- **Documental:**
  - `GET /api/articles/[id]` - Acceso a documentos fuente estructurados y referenciados.
- **Autenticación y Usuario:**
  - `GET /api/auth/google/callback` - Callback de autenticación OAuth.
  - `GET /api/session/avatar` / `GET /api/user/profile` - Gestión de datos de usuario (Sujeto a unificación).
- **Pagos & Billing:**
  - `POST /api/billing/create-checkout` - Generación de sesión de Stripe.
  - `GET /api/billing/status` - Verificación de vigencia de plan.
  - `POST /api/billing/webhook` - Escucha de eventos asíncronos de subscripción.
  - *(Nota: `billing/checkout` en proceso de purga vs `create-checkout`)*
- **Administración & Infra:**
  - `GET /api/health` - Estado del sistema.
  - `POST /api/admin/ingest` - Disparo manual de ingesta documental en RAG.

---

## 2. ESTADO DE INTEGRACIONES TÉCNICAS

| Integración | Estado | Observaciones Clínicas |
| :--- | :--- | :--- |
| **OpenAI** (`gpt-4o`) | **Operativo** | Funciona como motor cognitivo principal. Genera respuestas estructuradas en streaming iterativo. |
| **Supabase (PostgreSQL)** | **Operativo y Crítico** | Totalmente integrado. El Retrieval Híbrido (`lib/pg-retrieval.ts`) ejecuta consultas avanzadas combinando Similitud Vectorial (índices `pgvector` y distancia del coseno `<=>`), Coincidencia Léxica (`ILIKE`) y Referencias Exactas en la tabla `articles`. |
| **Stripe** | **Operativo** | Procesamiento de pagos activo mediante Webhooks (`api/billing/webhook/route.ts`). Actualiza automáticamente los estados de subscripción y cuotas ('pro') en la base de datos de usuarios (`lib/user-storage.ts`). |
| **Redis (Upstash/KV)** | **Operativo y Crítico** | Activo a través de `lib/cache-manager.ts`. Implementa un "Semantic Cache" para respuestas RAG frecuentes (Reranking/Hit Cache), y un "Edge Rate Limiting" estricto que protege `/api/chat` de abusos e IPs. |

---

## 3. BACKLOG DE CORRECCIONES RESTANTES

1. **Purga y Consolidación de API (Completado)**
   - Rutas redundantes de `billing/checkout` consolidadas hacia `create-checkout`.
   - APIs de perfil unificadas bajo `user/profile`.
   - RBAC revisado y validado en `proxy.ts`.

2. **Aislamiento de Admin (Completado)**
   - El panel de administración ha sido encapsulado en el Route Group `front/app/(admin)/admin` para evitar colisiones del layout principal (`(app)`) con el dominio público.

3. **Telemetría y Observabilidad**
   - Integrar Sentry u observabilidad externa para monitorear latencias y fallos en producción (actualmente se apoya solo en capturas de `AppErrorType` centralizadas y telemetría de OpenAI interna).

4. **Expansión del Dataset Legal**
   - Continuar con la ingesta, limpieza estructural y vectorización masiva de más cuerpos legales usando los pipelines existentes.

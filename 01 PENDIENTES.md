    - Sistema de usuarios persistente
    - Modelo de planes (Basic / Pro / Despacho)
    - Control de uso por usuario (rate + cuotas)
    - Middleware de autenticación y autorización
    - Sistema de suscripciones preparado para Stripe
    - Registro de uso (usage logs / métricas)
    - Historial persistente de conversaciones
    - Panel de perfil de usuario
    - Observabilidad y error tracking (Sentry o similar)
    - Protección anti-abuso / rate limiting
    - Deploy estable + variables seguras + backups BD
    - Onboarding y modo invitado controlado



    Lista Técnica para Completar MyFiscal SaaS
1. Modelo de Usuarios en Base de Datos

Crear tablas

users
id (uuid pk)
email
password_hash
created_at
plan
status
subscriptions
id
user_id
plan
stripe_customer_id
stripe_subscription_id
status
current_period_end
usage_logs
id
user_id
endpoint
tokens_used
query
created_at

Archivos a crear/modificar

lib/auth.ts
lib/user-service.ts
lib/subscription-service.ts
2. Middleware de Autenticación

Archivo

middleware.ts

Debe:

1 validar cookie/jwt
2 identificar usuario
3 adjuntar metadata al request

request context esperado:

request.user = {
  id,
  plan,
  usageToday
}
3. Control de Uso del Chat

Modificar

app/api/chat/route.ts

Antes de ejecutar RAG:

await enforceUsageLimit(user.id, user.plan)

Crear:

lib/usage-limits.ts

Ejemplo límites

const LIMITS = {
  guest: 10,
  basic: 50,
  pro: 300,
  despacho: 2000
}

Registrar cada consulta

logUsage({
 userId,
 endpoint:"chat",
 tokens,
 query
})
4. Persistencia de Conversaciones

Tablas:

conversations
id
user_id
created_at
title
messages
id
conversation_id
role
content
sources
created_at

Archivos nuevos

lib/conversation-store.ts

Modificar

app/api/chat/route.ts

para guardar

user_message
assistant_response
citations
5. Sistema de Planes

Crear configuración central

lib/plans.ts

Ejemplo

export const PLANS = {
 basic: {
  queries:50
 },
 pro: {
  queries:300
 },
 despacho:{
  queries:2000
 }
}

Usado por

usage-limits.ts
subscription-service.ts
6. Preparar Stripe (sin romper nada)

Crear

lib/stripe.ts

Endpoints nuevos

app/api/billing/create-checkout
app/api/billing/webhook

Eventos Stripe a manejar

checkout.session.completed
invoice.payment_succeeded
customer.subscription.deleted

Actualizar tabla

subscriptions
7. Observabilidad

Instalar

Sentry

Modificar

app/layout.tsx

Capturar errores en

app/api/chat/route.ts
lib/pg-retrieval.ts

Registrar

LLM errors
DB errors
rate limits
8. Rate Limiting Infraestructura

Crear

lib/rate-limit.ts

Opciones

Upstash Redis
Vercel KV

Aplicar en

middleware.ts

y

/api/chat
9. Protección del Endpoint Chat

Validaciones obligatorias

user exists
plan active
usage limit ok
rate limit ok

Orden correcto

auth
rate limit
usage limit
RAG retrieval
LLM
log usage
save conversation
10. Panel de Usuario

Ruta

app/profile/page.tsx

Mostrar

plan actual
queries usadas
historial
11. Seguridad Básica

Agregar

helmet headers
CSP

sanitizar

queries
inputs
exports
12. Backups y Protección BD

Configurar

daily backup postgres

índices obligatorios

articles.embedding
articles.article_number
documents.code
13. Admin Content Panel (opcional pero recomendado)

Ruta

/admin

Endpoints

/api/admin/ingest
/api/admin/rebuild-embeddings
Flujo Final del Sistema
User
 ↓
middleware auth
 ↓
rate limit
 ↓
usage limit
 ↓
/api/chat
 ↓
context-builder
 ↓
pg-retrieval (exact + lexical + vector)
 ↓
LLM
 ↓
save conversation
 ↓
log usage
 ↓
response
Cuando todo esto esté listo

Tu sistema pasa de:

AI prototype

a

SaaS legal AI defendible.
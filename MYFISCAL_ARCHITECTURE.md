# MYFISCAL_ARCHITECTURE.md

## 1. VISIÓN GENERAL DEL SISTEMA

MyFiscal es un motor de análisis jurídico-fiscal diseñado para proporcionar orientación estructurada basada en el marco normativo mexicano (CFF, LISR, LIVA).

### Flujo de Datos Actual:
1. **Usuario**: Envía consulta y/o seguimientos vía Chat UI.
2. **Chat API**: Recibe solicitud, analiza intención (Intent Detection) y maneja memoria de conversación.
3. **Retrieval (Normalized)**: Busca en archivos JSON normalizados cargados en memoria (motor híbrido léxico+reglas). No usa PostgreSQL todavía.
4. **Context Builder**: Filtra por relevancia y realiza un ranking de autoridad legal (Phase 7B).
5. **Generación LLM**: Procesa el contexto filtrado usando OpenAI (gpt-4o) para generar respuestas estructuradas. Utiliza `MockEngine` solo como fallback en caso de error.
6. **Frontend**: Renderiza la respuesta con citas estructuradas y permite visor lateral de artículos.

---

## 2. MAPA DEL SISTEMA

### Capa de Aplicación (Frontend - Next.js)
- `ChatWindow`: Contenedor principal de la experiencia de chat.
- `MessageBubble`: Renderizado de mensajes con soporte para respuestas estructuradas.
- `SourceCard`: Tarjetas de referencia a artículos legales.
- `ArticleViewer`: Drawer lateral para lectura profunda de leyes.

### Capa de API (Backend - Next API Routes)
- `/api/chat/route.ts`: Orquestador principal del flujo RAG.
- `/api/articles/[id]/route.ts`: Servicio de entrega de contenido legal completo.

### Capa de Servicios (Core Logic)
- `normalized-retrieval.ts`: Motor de búsqueda cargando artículos normalizados (JSON) en memoria.
- `legal-search.ts` / `hybrid-retrieval.ts`: Herramientas heredadas de búsqueda por tokens/temas.
- `context-builder.ts`: Generador de contexto para el LLM.
- `query-analyzer.ts` / `conversation-context.ts`: Detección de intención y memoria de sesiones.
- `legal-authority-ranker.ts`: Clasificador para priorizar leyes (Primary vs Supporting).
- `mock-engine.ts`: Generador de respuestas estructuradas Offline/Fallback.

### Capa de Datos (Dataset)
- `data/legal/normalized/`: Contiene artículos indexados (CFF, LISR, LIVA) en JSON. (Fuente de verdad actual).
- `lib/laws/`: Datos estáticos de TypeScript (En proceso de deprecación).

---

## 3. ESTADO ACTUAL (NIVEL MVP AVANZADO / PRERELEASE)

| Módulo | Estatus | Observaciones |
| :--- | :--- | :--- |
| **Dataset Legal** | Parcial | Ingestión vía `manifest.json` hacia archivos JSON funcionales. BD PostgreSQL preparada pero desconectada. |
| **Search Engine** | Operativo | Búsqueda léxica determinística en JSON de memoria. (Vector Search pendiente). |
| **RAG Avanzado** | Operativo | Filtros de relevancia (Intents) y ranking de autoridad integrados. |
| **UI/UX** | Avanzado | Interfaz pulida, controles de chat, modo claro/oscuro integrados. |
| **Memoria** | Operativo | Historial manejado en la API para detección de preguntas de seguimiento. |
| **Motor AI** | Integrado | OpenAI GPT-4o activo en `/api/chat/route.ts` con tipado estricto. (MockEngine es fallback). |

---

## 4. ROADMAP TÉCNICO

### Fase 1: Transición a Base de Datos (Prioridad Crítica)
- [ ] **PostgreSQL en Producción**: Conectar el `context-builder` a `lib/db.ts` eliminando el uso de `data/legal/normalized/` cargado en RAM.
- [ ] **Deprecación Estática**: Borrar/remover referencias finales a `lib/laws/*.ts`.
- [ ] **Rate Limiting**: Implementar control de peticiones para proteger el uso de tokens con OpenAI.

### Fase 2: Búsqueda Vectorial (Real Inteligencia)
- [ ] **Embeddings**: Inyectar cronjobs o endpoints para procesar vectores con text-embedding-3-small.
- [ ] **pgvector Search**: Implementar cosine similarity `<=>` a la consulta PostgreSQL en RAG.

### Fase 3: Dataset Completo
- [ ] **Ingesta Masiva**: Indexar el 100% de CFF, LISR y LIVA.
- [ ] **Jerarquía Legal**: Implementar navegación por Capítulos y Títulos en el visor.

---

## 5. DIAGNÓSTICO FINAL
El sistema tiene una arquitectura **sólida y escalable**. La separación entre la recuperación de leyes (`retrieval`) y la generación de respuestas (`generation`) es el estándar de la industria. El siguiente paso crítico es la transición de un motor de simulación a uno de inteligencia real.

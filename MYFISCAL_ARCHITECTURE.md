# MYFISCAL_ARCHITECTURE.md

## 1. VISIÓN GENERAL DEL SISTEMA

MyFiscal es un motor de análisis jurídico-fiscal diseñado para proporcionar orientación estructurada basada en el marco normativo mexicano (CFF, LISR, LIVA).

### Flujo de Datos Actual:
1. **Usuario**: Envía consulta vía Chat UI.
2. **Chat API**: Recibe la solicitud y activa el motor de recuperación.
3. **Hybrid Retrieval**: Combina búsqueda por palabras clave y expansión de sinónimos legales.
4. **Context Builder**: Construye un bloque de contexto con los artículos más relevantes.
5. **MockEngine**: Procesa el mensaje del usuario junto con el contexto legal para generar una respuesta estructurada.
6. **Frontend**: Renderiza la respuesta y permite la visualización de artículos en un visor lateral.

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
- `legal-search.ts`: Motor de scoring y ranking basado en tokens y relevancia.
- `hybrid-retrieval.ts`: Coordinador de búsqueda híbrida.
- `context-builder.ts`: Generador de contexto para el motor de respuestas.
- `legal-synonyms.ts`: Diccionario de términos equivalentes para expansión de consultas.
- `mock-engine.ts`: Generador de respuestas estructuradas (Actual: Reglas-fijas).

### Capa de Datos (Dataset)
- `lib/laws/`: Contiene los artículos indexados de CFF, LISR y LIVA.

---

## 3. ESTADO ACTUAL (NIVEL MVP AVANZADO)

| Módulo | Estatus | Observaciones |
| :--- | :--- | :--- |
| **Dataset Legal** | Parcial | Contiene artículos clave, no las leyes completas. |
| **Search Engine** | Operativo | Ranking funcional por tokens y temas. |
| **RAG Híbrido** | Operativo | Simulado localmente con expansión de sinónimos. |
| **UI/UX** | Avanzado | Interfaz fluida, modo oscuro, visor lateral. |
| **Memoria** | Ausente | Cada mensaje es independiente. |
| **Motor AI** | Mock | Respuestas predefinidas basadas en coincidencia de temas. |

---

## 4. ROADMAP TÉCNICO

### Fase 1: Cierre de MVP (Reparaciones)
- [ ] **Conectar Botones Muertos**: Implementar handlers para "Descargar reporte", "Copiar", y "Compartir".
- [ ] **Persistencia de Sesión**: Asegurar que el historial en `Storage` sea consistente con la UI.
- [ ] **Feedback Loop**: Agregar botones de "Pulgar arriba/abajo" para recolectar datos de precisión.

### Fase 2: Inteligencia Real (Evolución)
- [ ] **Memoria de Conversación**: Implementar `contextWindow` en la API para recordar mensajes previos.
- [ ] **Embeddings & Vector Search**: Migrar de búsqueda por tokens a búsqueda vectorial (Pinecone/Supabase Vector).
- [ ] **LLM Integration**: Reemplazar `MockEngine` por OpenAI (GPT-4o) o Claude 3.5 Sonnet.

### Fase 3: Dataset Completo
- [ ] **Ingesta Masiva**: Indexar el 100% de CFF, LISR y LIVA.
- [ ] **Jerarquía Legal**: Implementar navegación por Capítulos y Títulos en el visor.

---

## 5. DIAGNÓSTICO FINAL
El sistema tiene una arquitectura **sólida y escalable**. La separación entre la recuperación de leyes (`retrieval`) y la generación de respuestas (`generation`) es el estándar de la industria. El siguiente paso crítico es la transición de un motor de simulación a uno de inteligencia real.

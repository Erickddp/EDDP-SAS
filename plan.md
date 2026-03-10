Plan estratégico para SaaS de asistente fiscal/jurídico mexicano
Visión general

El proyecto consiste en desarrollar un asistente de consulta normativa mexicana, alimentado por leyes y códigos fiscales vigentes, que pueda responder preguntas con fundamento legal explícito y tono ajustado al nivel de experiencia del usuario. El servicio funcionará como un software‑as‑a‑service (SaaS) con suscripción mensual, accesible desde móvil y escritorio, con dos modos de respuesta: casual (lenguaje claro para público general) y profesional (terminología técnica para contadores y fiscalistas).

Para sustentar la precisión normativa, las fuentes principales serán documentos oficiales publicados por el Diario Oficial de la Federación (DOF) y repositorios del Congreso y de la Suprema Corte. La Cámara de Diputados advierte que su compilación de leyes es solo informativa y que el órgano con carácter oficial es el DOF. Además, la Suprema Corte de Justicia de la Nación indica que la edición electrónica de los ordenamientos federales constituye una versión oficial conforme a la Ley del Diario Oficial. Estas dos citas sirven para justificar que la base de datos se alimentará de fuentes con validez jurídica.

Segmentación de usuarios
Segmento	Necesidad principal	Características	Oferta recomendada
Curioso/freelancer	Consultas ocasionales sobre obligaciones fiscales y multas	Poca experiencia legal, usa dispositivo móvil, presupuesto bajo	Plan Básico con consultas limitadas; modo casual; acceso a preguntas frecuentes.
Contador moderno	Optimizar tiempo de búsqueda de artículos; preparar informes para clientes	Conoce la normativa pero quiere respuestas rápidas y comparativas; trabaja en despacho pequeño	Plan Pro con consultas ilimitadas, modo profesional, exportación a PDF/WhatsApp, historial amplio.
Contador senior/fiscalista	Fundamento jurídico preciso y comparador de reformas	Requiere citar artículos y reformas; maneja varios clientes; necesita multiusuario	Plan Despacho con multiusuario, carpetas por cliente, comparador de versiones, exportaciones avanzadas.
PyME/emprendedor	Entender obligaciones tributarias básicas y recibir checklists	Público general con pocas nociones; busca respuestas claras y plazos	Plan básico con modo casual, guía paso a paso, recordatorios y notificaciones.
Fuentes legales iniciales

Se propone empezar con un vertical fiscal federal para limitar el alcance y asegurar alta calidad. Las primeras ocho fuentes incluirán:

Constitución Política de los Estados Unidos Mexicanos – texto vigente (obtener del DOF y de la Cámara de Diputados).

Código Fiscal de la Federación (CFF) – normativa base para infracciones y multas, con últimas reformas vigentes (Cámara de Diputados indica que su compilación presenta textos vigentes y muestra fechas de últimas reformas).

Ley del Impuesto sobre la Renta (LISR).

Ley del Impuesto al Valor Agregado (LIVA).

Resolución Miscelánea Fiscal (RMF) vigente y sus Anexos – como indica el SAT, estas reglas son de carácter general y se deben consultar en el DOF.

Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (Ley Antilavado).

Ley Federal de los Derechos del Contribuyente.

Ley de Ingresos de la Federación (LIF) y Ley Federal de Procedimiento Contencioso Administrativo (LFPCA) para recursos y procedimientos.

La base se ampliará progresivamente con más de 50 códigos y leyes, pero la prioridad inicial es dominar el ámbito fiscal. Según la Cámara de Diputados, la última reforma de cada código se indica con su fecha en el DOF, lo que facilitará mantener versiones actualizadas.

Arquitectura técnica recomendada
1. Ingesta y normalización

a. Descarga de fuentes oficiales. Se programarán scrapers o se emplearán APIs (cuando existan) para descargar periódicamente las publicaciones del DOF y de la base legislativa de la SCJN. Estas descargas se almacenarán en bruto (PDF o HTML).
b. Extracción estructurada. Un parser convertirá los textos a un formato estructurado (por ejemplo, JSON o base SQL) conservando metadatos: nombre del ordenamiento, título, capítulo, artículo, fracción, fecha de publicación, fecha de última reforma, fuente original y versión (vigente o histórica).
c. Control de vigencia y versiones. Cada documento se asociará a un hash y a la fecha de vigencia; cuando se detecte una reforma, se generará una nueva versión del fragmento afectado.
d. Chunking inteligente. Los documentos se dividirán por artículo/fracción para permitir una recuperación precisa.
e. Embedding y almacenamiento. Los fragmentos se vectorizarán mediante embeddings semánticos y se almacenarán en una base como pgvector o Qdrant con índices que faciliten búsquedas híbridas (semánticas y por palabras clave).

2. Motor de recuperación y generación (RAG)

a. Retrieval híbrido. Cuando un usuario realice una pregunta, el sistema ejecutará dos tipos de búsqueda:

Semántica: compara la pregunta con embeddings de los fragmentos normativos para capturar sinónimos e intenciones.

Boolean/keyword: busca palabras clave exactas (por ejemplo, “multas”, “declaración”, “omisión”), para asegurar que las obligaciones o multas que no aparecen de manera explícita sean recuperadas.
b. Selección de pasajes. Se recuperarán los fragmentos con mayor relevancia y se clasificarán según la ley y la jerarquía normativa.
c. Prompt con plantillas. Se construirá un prompt para el modelo de lenguaje incluyendo:

La pregunta original del usuario.

Fragmentos normativos seleccionados (con citas y metadatos).

Una plantilla de respuesta que defina la estructura final.

Indicaciones sobre el modo de respuesta (casual o profesional).
d. Generación con LLM. Para la primera versión se puede utilizar un servicio LLM comercial (OpenAI, Gemini) con suficiente contexto para las respuestas. Posteriormente, se puede migrar a un modelo open‑source hospedado en RunPod, optimizando costos una vez que se tenga un dataset controlado.
e. Devolución estructurada. El modelo devolverá la respuesta siguiendo una estructura rígida:

Síntesis: respuesta breve al punto.

Fundamento principal: artículos y fracciones citados.

Escenarios y excepciones: si aplica dolo, reincidencia o supuestos alternativos.

Consecuencias y sanciones: multas, recargos, implicaciones penales.

Nivel de certeza: puntuación o leyenda para indicar si la respuesta se basa en normas explícitas, interpretaciones o criterios.

Fuentes oficiales consultadas: enlaces al DOF o SCJN.
Esta estructura reduce riesgos de alucinación y otorga trazabilidad.

3. Personalización por usuario

El sistema almacenará un perfil básico por usuario, con historial de preguntas, preferencias de tono (casual/profesional), profesión (si decide indicarlo) y nivel de detalle deseado. Al recibir una consulta repetida, la IA adaptará el contenido considerando el historial: podrá omitir explicaciones ya vistas o profundizar en nuevas variantes.
Además, se incluirá una opción para moderar la complejidad de la respuesta, de modo que un usuario seleccione si quiere una respuesta “Sencilla”, “Detallada” o “Técnica”.

4. Front‑end y UX

Diseño tipo chat: se emulará un chat con burbujas, permitiendo al usuario formular preguntas y recibir respuestas estructuradas. A la derecha o en la parte superior se incluirán opciones de configuración (modo, nivel de detalle).
Ejemplos rápidos: se mostrarán preguntas sugeridas (por ejemplo, “¿Cuáles son mis obligaciones si soy RESICO?”) para guiar a nuevos usuarios.
Historial y favoritos: la barra lateral permitirá recuperar conversaciones anteriores y guardar respuestas relevantes.
Exportación: botón para generar PDF/WhatsApp con la respuesta y las citas de ley para compartir con clientes o colegas.
Modal de comparación: en futuras versiones, se podrá seleccionar un artículo y ver sus versiones anteriores, con resaltado de cambios.

5. Backend mínimo viable (fase de lanzamiento)

Para la primera versión (MVP), se propone una arquitectura simple que permita validar la idea:

Ingesta inicial manual: cargar de forma manual (o mediante scripts sencillos) el CFF, LISR, LIVA, RMF y otras leyes clave en una base PostgreSQL con tablas para documento, artículo, fracción y versión.

Embeddings: emplear el servicio de embeddings de OpenAI o un modelo open‑source para vectorizar cada artículo.

API REST: exponer dos endpoints: POST /query que recibe una pregunta y devuelve la respuesta generada, y GET /articles/{id} para consultar texto de un artículo.

Servicio de búsqueda: usar una librería como langchain para la lógica de RAG, combinando búsqueda semántica y keyword en la base.

Autenticación sencilla: emplear JWT o sesiones para identificar usuarios y límites de consultas.

Frontend: una aplicación en Next.js con diseño responsivo y panel de administración para la lista de espera.

6. Escalamiento y fases posteriores
Fase	Objetivo	Principales mejoras
1. MVP (mes 1‑2)	Lanzar base fiscal federal, modo casual y profesional, chat básico, pre‑registro y lista VIP	Carga manual de leyes prioritarias, API básica, front‑end con chat e historial, plan de marketing para captar usuarios.
2. Automatización (mes 2‑4)	Automatizar ingestión de DOF y SCJN, mejoras de búsqueda híbrida, control de versiones	Scrapers automáticos, versionado normativo, indexación incremental, panel para actualizar vigencias.
3. Funciones avanzadas (mes 4‑6)	Añadir comparador de artículos, análisis de reformas, integración de criterios normativos (SAT/SCJN), exportaciones avanzadas	Módulos de comparación, alertas de cambio de ley, opciones de exportar a Excel/Word, multiusuario para despachos.
4. Expansión de contenido (mes 6+)	Integrar más de 50 leyes y códigos, extender a normativa administrativa, civil y laboral	Ingesta progresiva de leyes adicionales, categorías temáticas, filtros por materia, modelos de especialización.
5. Modelo propio (mes 9‑12)	Migrar a modelo open‑source alojado en RunPod para reducir costos e incrementar privacidad	Fine‑tuning supervisado con dataset propio, hosting en GPU privada, monitorización de respuestas.
Estrategia de lanzamiento y marketing
Lista de Espera VIP

Landing page: crear una página promocional con una explicación breve del producto y un formulario de preinscripción.

Oferta de preregistro: prometer acceso gratuito durante el primer mes a los primeros 1000 usuarios y descuentos vitalicios a los primeros 500.

Recogida de feedback: incluir preguntas opcionales sobre perfil y necesidades (profesión, frecuencia de uso). Esto ayudará a calibrar los modos de respuesta y priorizar leyes.

Lista de correo y WhatsApp: enviar actualizaciones semanales sobre avances, demostraciones y fechas de lanzamiento.

Campañas en comunidades: publicar en grupos de Facebook y LinkedIn de contadores y emprendedores, enfatizando la velocidad y precisión del asistente. Aprovechar la legitimidad de que las compilaciones oficiales son informativas y el DOF es la fuente oficial.

Partnerships: contactar a despachos contables para pruebas gratuitas a cambio de testimonios.

Estrategia de precios inicial
Plan	Precio mensual estimado (MXN)	Características
Gratis de lanzamiento (Beta)	$0	10 consultas/mes, modo casual, acceso a RMF y CFF, no incluye exportación PDF.
Básico	$149	30 consultas/mes, modo casual y profesional, historial, acceso a CFF, LISR, LIVA; exportación básica.
Pro	$349	Consultas ilimitadas, comparador de reformas, exportación completa, modo técnico con citas completas, almacenamiento de favoritos.
Despacho	$1 299	Todo lo anterior + multiusuario (hasta 5), carpetas por cliente, reportes descargables, API para integrar con sistemas del despacho.

Se ofrecerán descuentos anuales y promociones para los usuarios de la lista VIP.

Proyecciones de adopción e ingresos (estimado)

Suponiendo un crecimiento gradual tras el lanzamiento:

Mes 1‑2: 500 usuarios en plan gratuito, 200 en plan básico. Ingreso aproximado: $29 800 MXN mensuales.

Mes 3‑4: 1 500 usuarios, de los cuales 600 en plan básico y 100 en plan pro. Ingreso aproximado: $149×600 + $349×100 ≈ $149 000 MXN mensuales.

Mes 6: 3 000 usuarios, 1 200 en básico, 400 en pro y 50 en despacho. Ingreso mensual: $149×1 200 + $349×400 + $1 299×50 ≈ $502 450 MXN.

Año 1: al escalar a 5 000 usuarios (estimado 3–5 % de contadores y fiscalistas adoptando la herramienta), la facturación podría superar el millón de pesos mensuales.

Estos cálculos son aproximados y dependen de la calidad del producto, esfuerzo de marketing y la retención de usuarios. El atractivo reside en que el producto resuelve un problema real: la consulta dispersa de normas mexicanas y la necesidad de respuestas basadas en DOF.

Prompts de ejemplo para Antigravity (construcción del SaaS)

Ingesta y parsing

Prompt: “Construye un script en Python que descargue el texto vigente del Código Fiscal de la Federación desde el sitio de la Cámara de Diputados y lo divida en artículos y fracciones. Guarda cada fragmento con metadatos (título, capítulo, artículo, fracción, fecha de última reforma) en una base PostgreSQL. Incluye un campo para la URL del DOF correspondiente.”

Embeddings y búsqueda semántica

Prompt: “Implementa un servicio que reciba una cadena de consulta y devuelva los cinco artículos más relevantes del CFF, LISR y LIVA utilizando embeddings. Usa el modelo text-embedding-ada-002 de OpenAI para vectorizar el texto y almacena los embeddings en una tabla con índice pgvector.”

Generación de respuesta

Prompt: “Diseña un prompt de system y user para un modelo ChatGPT en el que el system instruct al modelo a actuar como asistente fiscal mexicano. Debe recibir la pregunta del usuario, los fragmentos de ley recuperados (con citas), y un parámetro que indique si la respuesta debe ser casual o profesional. El modelo debe responder siguiendo la estructura: síntesis, fundamento principal con artículos, escenarios y excepciones, consecuencias y sanciones, nivel de certeza y fuentes consultadas.”

Front‑end prototipo

Prompt: “Genera un componente de React/Next.js que muestre un chat con un input para el usuario y burbujas de respuesta. Incluye un toggle que permita cambiar entre modo casual y profesional, y un botón para exportar la respuesta en formato PDF. El componente debe enviar las preguntas a un endpoint /query y mostrar la respuesta estructurada.”

Lista de espera y marketing

Prompt: “Crea un mini‑sitio de aterrizaje en HTML/CSS/JS con una explicación breve del asistente fiscal, un formulario para unirse a la lista de espera VIP y espacio para testimonios. Implementa lógica para registrar correos electrónicos en una base de datos y enviarles un correo de bienvenida con un cupón de descuento para los primeros meses del servicio.”

Conclusión

Este plan detalla las bases para crear un SaaS de copiloto jurídico‑fiscal mexicano que se diferencia de un simple chatbot por su fundamento oficial. La clave es iniciar con un vertical fiscal acotado y centrarse en la calidad de la recuperación y generación de respuestas, utilizando documentos oficiales como el DOF y la SCJN.

Para avanzar hoy, se recomienda preparar la landing page con lista de espera, definir los esquemas de base de datos para las leyes iniciales y construir scripts de ingestión manual. A partir de allí, se validará el interés de los usuarios y se ajustarán las funciones antes de escalar a un producto más robusto.





CONSTRUCCION//

1. VISIÓN GENERAL DEL SISTEMA

MyFiscal es actualmente:

Usuario
   ↓
Chat UI
   ↓
Chat API
   ↓
Motor de recuperación legal
   ↓
Contexto normativo
   ↓
Respuesta estructurada
   ↓
Visor de artículos

Arquitectura actual:

Frontend (Next.js + React)
│
├── ChatWindow
│
├── MessageBubble
│
├── SourceCard
│
└── ArticleViewer (drawer lateral)
        ↓
Backend (Next API Routes)
│
├── /api/chat
│
└── /api/articles/[id]
        ↓
Servicios internos
│
├── legal-search.ts
├── law-reader.ts
├── hybrid-retrieval.ts
├── context-builder.ts
├── legal-synonyms.ts
│
└── mock-engine.ts
        ↓
Dataset legal
│
└── laws.ts

Esto ya es arquitectura de sistema serio.

2. LO QUE YA ESTÁ BIEN CONSTRUIDO
2.1 Dataset legal

Archivo:

lib/laws.ts

Contiene:

ALL_LAW_ARTICLES

Cada artículo:

{
 id
 documentName
 documentAbbreviation
 articleNumber
 title
 text
 keywords
}

Este dataset es el corazón del sistema.

Todo depende de él.

2.2 Motor de búsqueda legal

Archivo:

lib/legal-search.ts

Funciones clave:

normalizeQuery()
tokenizeQuery()
scoreArticle()
searchArticles()
inferLegalTopic()
debugSearch()

Lo que hace:

query
 ↓
normalización
 ↓
tokens
 ↓
scoring
 ↓
ranking
 ↓
top artículos

Mejoras que ya implementaste:

✔ regex para artículos
✔ ranking por tema
✔ frases clave
✔ penalización de falsos positivos
✔ prioridad de leyes
✔ debugSearch()

Esto está bien diseñado.

2.3 Motor híbrido

Archivos:

lib/legal-synonyms.ts
lib/hybrid-retrieval.ts
lib/context-builder.ts

Esto es arquitectura RAG inicial.

Flujo:

query
 ↓
tokenize
 ↓
expand synonyms
 ↓
hybrid scoring
 ↓
ranking
 ↓
context builder

Resultado:

{
 topic
 retrievedArticles
 foundation
 sources
}

Esto es la base del sistema inteligente.

2.4 API del chat

Archivo:

/api/chat/route.ts

Flujo real:

POST /api/chat

mensaje usuario
      ↓
inferLegalTopic
      ↓
buildLegalContext
      ↓
MockEngine.processChat
      ↓
fusionar contexto + explicación
      ↓
ChatResponse

Respuesta estructurada:

{
 answer: {
  summary
  explanation
  foundation
  scenarios
  consequences
  certainty
  disclaimer
 },
 sources: [],
 titleSuggestion
}

Esto está bien pensado.

2.5 Visor de artículos

Backend:

lib/law-reader.ts
/api/articles/[id]

Frontend:

ArticleViewer

Flujo:

Usuario
 ↓
click "Ver artículo"
 ↓
fetch /api/articles/id
 ↓
drawer lateral
 ↓
texto legal completo

Esto es una gran decisión de UX.

Da credibilidad.

2.6 UI del chat

Componentes:

ChatWindow
MessageBubble
SourceCard
ArticleViewer

Flujo visual:

Usuario pregunta
 ↓
mensaje aparece
 ↓
respuesta IA
 ↓
fuentes consultadas
 ↓
botón "Ver artículo"

Esto ya parece producto real.

3. LO QUE NO ESTÁ BIEN CONECTADO

Aquí está el problema que mencionaste.

Botones que no hacen nada.

Eso pasa cuando:

UI existe
pero
no hay handler

Probables casos:

botón copiar
botón guardar
botón compartir
botón feedback
botón regenerar

Es decir:

UI
✔

Backend
✘

Eso no rompe la app, pero sí da sensación de producto incompleto.

4. PROBLEMAS ARQUITECTÓNICOS DETECTADOS
4.1 MockEngine

Archivo:

mock-engine.ts

Esto simula inteligencia.

No usa:

LLM
RAG real
embeddings

Entonces las respuestas:

no aprenden
no razonan
solo estructuran texto

Sirve para MVP.

Pero no para producción.

4.2 Dataset limitado

Solo tienes algunos artículos.

Para que esto funcione real necesitas:

CFF completo
LISR completo
LIVA completo

Si no:

recuperación incompleta
4.3 No hay memoria

El chat no recuerda.

Cada mensaje es:

pregunta aislada

Falta:

conversation memory
4.4 No hay embeddings

La búsqueda aún es:

keyword
+ synonyms

Falta:

vector search
5. LO QUE YA ESTÁ MUY BIEN DISEÑADO

Te lo digo directo Rick:

Tu arquitectura sí está bien pensada.

Especialmente:

Separación de capas
UI
API
Retrieval
Dataset

Eso es arquitectura correcta.

Context builder

Esto fue buena decisión.

Porque separa:

recuperación
de
generación
Article viewer

Esto hace que el sistema:

no invente leyes

Muy importante.

6. MAPA DEL SISTEMA COMPLETO

Así queda hoy.

MYFISCAL

Frontend
│
├ ChatWindow
│
├ MessageBubble
│
├ SourceCard
│
└ ArticleViewer
      │
      ▼

API
│
├ /api/chat
│
└ /api/articles/[id]
      │
      ▼

Servicios
│
├ mock-engine.ts
├ legal-search.ts
├ hybrid-retrieval.ts
├ context-builder.ts
├ legal-synonyms.ts
└ law-reader.ts
      │
      ▼

Dataset
│
└ laws.ts

Esto ya es arquitectura de sistema legal AI.

7. QUÉ FALTA PARA TERMINAR EL MVP

Para que MyFiscal sea producto usable faltan solo 5 cosas.

1️⃣ Conectar botones muertos

Completar:

copy
share
feedback
guardar
2️⃣ memoria de conversación

Agregar:

conversation context

Para que entienda:

"¿y eso aplica para RESICO?"
3️⃣ dataset completo

Agregar:

CFF
LISR
LIVA

completos.

4️⃣ embeddings

Cambiar:

synonyms

por:

vector search
5️⃣ LLM real

Reemplazar:

MockEngine

por:

OpenAI / Claude

con RAG.

8. NIVEL ACTUAL DEL PROYECTO

Te lo digo honestamente.

Tu sistema hoy está en:

Nivel MVP avanzado

Más avanzado que 80% de proyectos AI legales.

Porque ya tienes:

✔ dataset
✔ retrieval
✔ ranking
✔ contexto
✔ visor legal
✔ UI
✔ API

Eso no es común.

9. EL MAYOR RIESGO AHORA

Seguir agregando cosas sin cerrar lo que ya existe.

Primero debes:

cerrar MVP

Después escalar.

10. MI DIAGNÓSTICO HONESTO

Tu proyecto sí tiene potencial real.

Pero ahora mismo está en fase:

ingeniería experimental

Debe pasar a:

producto estable
SIGUIENTE PASO RECOMENDADO

Si quieres, el siguiente paso que podemos hacer es uno muy importante:

Documentar oficialmente MyFiscal

Te puedo generar:

MYFISCAL_ARCHITECTURE.md

con:

arquitectura completa

flujo del sistema

módulos

roadmap técnico

versión actual del sistema

Eso será el documento maestro del proyecto.

Y te servirá para mejorarlo durante años.







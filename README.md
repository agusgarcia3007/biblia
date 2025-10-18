# Biblia Católica AI - MVP

Una aplicación web para explorar la Biblia Católica en español con la ayuda de inteligencia artificial. Los usuarios pueden chatear con la Biblia, generar oraciones personalizadas al estilo de santos católicos, recibir versículos del día y mantener un diario espiritual.

## 🌟 Características Principales

- **Chat Bíblico con IA**: Haz preguntas sobre las Escrituras y recibe respuestas fundamentadas con citas específicas
- **Oraciones Personalizadas**: Genera oraciones en el estilo de santos católicos (San Agustín, Santa Teresa de Ávila, San Francisco de Asís)
- **Versículo del Día**: Recibe un versículo diario con reflexión pastoral
- **Diario Espiritual**: Guarda versículos, conversaciones y oraciones favoritas
- **Sistema de Rachas**: Mantén tu práctica espiritual diaria
- **Lectio Divina**: Guía contemplativa para meditar sobre pasajes bíblicos

## 🛠 Stack Tecnológico

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, AI-Elements
- **Base de Datos**: Supabase (PostgreSQL + pgvector)
- **Autenticación**: Supabase Auth (Email/Password + Google OAuth)
- **IA**: OpenAI GPT-4 + text-embedding-3-small
- **RAG**: Vector similarity search con Supabase pgvector

## 📋 Requisitos Previos

- Node.js 18+
- npm o pnpm
- Cuenta de Supabase (gratuita)
- API Key de OpenAI

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd biblia
npm install
```

### 2. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Copia tu URL del proyecto y las API keys
3. Ve a SQL Editor y ejecuta los siguientes scripts en orden:
   - `supabase/schema.sql` (crea todas las tablas y RLS policies)
   - `supabase/seed-personas.sql` (inserta las personas de santos)

### 3. Configurar Variables de Entorno

Copia `.env.example` a `.env.local` y completa los valores:

```bash
cp .env.example .env.local
```

Edita `.env.local`:

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENV=development

# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# AI / LLM Provider
AI_PROVIDER=openai
AI_API_KEY=tu-openai-api-key
AI_MODEL_CHAT=gpt-4
AI_MODEL_EMBEDDINGS=text-embedding-3-small

# RAG / Retrieval
RAG_TOP_K=5
RAG_MIN_SCORE=0.75

# Timezone
APP_TZ=America/Montevideo
```

### 4. Habilitar Google OAuth (Opcional)

En tu proyecto de Supabase:
1. Ve a Authentication > Providers
2. Habilita Google
3. Configura las credenciales de OAuth desde Google Cloud Console
4. Añade `http://localhost:3000` a las URLs permitidas

### 5. Sembrar la Base de Datos

#### Opción A: Datos de Prueba (Desarrollo)

Ejecuta el script de sembrado con versículos de muestra:

```bash
npx tsx scripts/seed-sample-bible.ts
```

Este script inserta ~23 versículos de muestra para pruebas.

#### Opción B: Biblia Completa (Producción)

Para producción, necesitarás:

1. Obtener una traducción católica española de dominio público (ej: Torres Amat)
2. Formatear los datos en el mismo formato que `seed-sample-bible.ts`
3. Ejecutar tu script de sembrado personalizado

### 6. Generar Embeddings

Después de sembrar los versículos, genera los embeddings vectoriales:

```bash
npx tsx scripts/generate-embeddings.ts
```

Este proceso:
- Genera embeddings para cada versículo usando OpenAI
- Almacena los vectores en Supabase para búsqueda semántica
- Procesa en lotes para evitar límites de tasa
- Con ~23 versículos toma ~30 segundos

**Nota**: Una Biblia completa (~31,000 versículos) tomará ~8 horas y costará ~$0.50 en API de OpenAI.

### 7. Ejecutar el Servidor de Desarrollo

```bash
npm run dev
```

Visita `http://localhost:3000` para ver la aplicación.

## 📁 Estructura del Proyecto

```
biblia/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── chat/          # Chat con RAG
│   │   │   ├── prayer/        # Generación de oraciones
│   │   │   ├── verse-of-day/  # Versículo del día
│   │   │   ├── streak/        # Sistema de rachas
│   │   │   └── journal/       # CRUD del diario
│   │   ├── auth/              # Página de autenticación
│   │   ├── chat/              # Página de chat bíblico
│   │   ├── prayer/            # Página de oraciones
│   │   ├── journal/           # Página del diario
│   │   ├── settings/          # Configuración de usuario
│   │   ├── verse/[date]/      # Detalle de versículo
│   │   ├── layout.tsx         # Layout raíz
│   │   └── page.tsx           # Página de inicio
│   ├── components/            # Componentes reutilizables
│   │   ├── ui/               # shadcn/ui components
│   │   ├── persona-select.tsx
│   │   ├── streak-badge.tsx
│   │   └── verse-card.tsx
│   ├── lib/                   # Utilidades y configuraciones
│   │   ├── supabase/         # Cliente Supabase
│   │   ├── personas.ts       # Configuración de personas
│   │   └── bible-books.ts    # Mapeo de libros bíblicos
│   └── middleware.ts          # Auth middleware
├── supabase/                  # Scripts de base de datos
│   ├── schema.sql            # Schema principal
│   └── seed-personas.sql     # Seed de personas
├── scripts/                   # Scripts de utilidad
│   ├── seed-sample-bible.ts  # Sembrar datos de prueba
│   └── generate-embeddings.ts # Generar embeddings
└── .env.example              # Plantilla de variables de entorno
```

## 🔒 Seguridad y Privacidad

- **RLS (Row Level Security)**: Todas las tablas de usuario están protegidas con políticas RLS
- **Autenticación Segura**: Manejo de sesiones vía Supabase Auth
- **Datos Privados**: Oraciones y entradas del diario son privadas por defecto
- **No se almacenan secretos**: Las API keys nunca se exponen al cliente

## 🎯 Flujos de Usuario Principales

### 1. Onboarding
- Usuario se registra con email/password o Google
- Selecciona persona predeterminada (opcional)
- Llega al home con el Versículo del Día

### 2. Chat Bíblico
- Usuario selecciona persona (San Agustín, Santa Teresa, San Francisco)
- Hace una pregunta sobre las Escrituras
- Recibe respuesta fundamentada con citas bíblicas
- Puede guardar respuestas en el diario

### 3. Oración Personalizada
- Usuario selecciona persona e intención (gratitud, paz, duelo, etc.)
- Opcionalmente añade contexto personal
- Genera oración reverente y pastoral
- Puede guardar o compartir la oración

### 4. Versículo del Día
- Versículo determinístico basado en la fecha
- Incluye reflexión pastoral generada por IA
- Ver contexto muestra versículos cercanos
- Guía de Lectio Divina para meditación contemplativa

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo con Turbopack

# Producción
npm run build        # Build de producción
npm start            # Servidor de producción

# Base de Datos
npx tsx scripts/seed-sample-bible.ts    # Sembrar versículos de muestra
npx tsx scripts/generate-embeddings.ts  # Generar embeddings vectoriales

# Linting
npm run lint         # Ejecutar ESLint
```

## 📊 Schema de Base de Datos

### Tablas Principales

- `profiles` - Perfiles de usuario (persona predeterminada, locale)
- `chat_sessions` - Sesiones de chat
- `chat_messages` - Mensajes del chat (user, assistant, system)
- `prayers` - Oraciones generadas
- `journal_entries` - Entradas del diario (chat, prayer, verse)
- `streaks` - Sistema de rachas diarias
- `bible_verses` - Versículos bíblicos con embeddings vectoriales
- `saints_personas` - Configuración de personas de santos

### Búsqueda Vectorial

La función `match_bible_verses` realiza búsqueda por similitud semántica:

```sql
SELECT * FROM match_bible_verses(
  query_embedding := '[...]',
  match_threshold := 0.75,
  match_count := 5
);
```

## 🎨 Componentes UI

### Componentes Personalizados

- **StreakBadge**: Muestra la racha del usuario con ícono de llama
- **VerseCard**: Card para mostrar versículos con reflexión y acciones
- **PersonaSelect**: Dropdown para seleccionar persona de santo

### shadcn/ui Components

Todos los componentes base de UI vienen de shadcn/ui:
- Button, Card, Input, Textarea, Select, Tabs, Badge, ScrollArea, etc.

## 🌐 API Routes

### `/api/chat` (POST)
Streaming chat con RAG retrieval
- **Body**: `{ messages, personaKey, sessionId }`
- **Response**: Streaming text (AI SDK)

### `/api/prayer` (POST)
Genera oración personalizada
- **Body**: `{ personaKey, intentTag, userContext? }`
- **Response**: `{ prayer, prayerId, personaKey, intentTag }`

### `/api/verse-of-day` (GET)
Obtiene versículo del día
- **Query**: `date` (YYYY-MM-DD, opcional)
- **Response**: `{ verse, reflection, context, date }`

### `/api/streak` (GET/POST)
Maneja rachas de usuario
- **GET**: Obtiene racha actual
- **POST**: Actualiza racha (incrementa si es nuevo día)

### `/api/journal` (GET/POST/DELETE)
CRUD para entradas del diario
- **GET**: Lista entradas (opcional: filter por type)
- **POST**: Crea nueva entrada
- **DELETE**: Elimina entrada por ID

## ⚙️ Configuración de Personas

Las personas afectan solo el **estilo** de las respuestas, no el contenido doctrinal:

### San Agustín
- Profundidad intelectual y rigor teológico
- Referencias breves en latín cuando son conocidas
- Énfasis en gracia divina y conversión del corazón

### Santa Teresa de Ávila
- Interioridad orante y metáforas del alma
- Énfasis en amistad con Dios
- Lenguaje cercano, maternal y lleno de ánimo

### San Francisco de Asís
- Humildad, alegría y sencillez radical
- Amor por la creación como don de Dios
- Caridad concreta y paz

## 🚨 Limitaciones del MVP

- **Solo español**: No hay soporte multi-idioma aún
- **Versículos limitados**: Incluye solo ~23 versículos de muestra
- **Sin Magisterio**: Solo referencias bíblicas (sin Catecismo o documentos papales)
- **Sin notificaciones**: No hay recordatorios push
- **Sin comunidad**: No hay networking entre usuarios ni parroquias

## 🗺 Roadmap Post-MVP

1. **Biblia Completa**: Integrar todos los 73 libros católicos
2. **Magisterium Layer**: Añadir Catecismo y documentos del Magisterio
3. **Planes de Lectio**: Planes temáticos de 7 días
4. **Calendario Litúrgico**: Integración con el calendario de la Iglesia
5. **Examen de Conciencia**: Flujos guiados para preparar confesión
6. **Audio/TTS**: Narración de versículos y oraciones
7. **Multi-idioma**: Soporte para inglés, portugués, francés
8. **Premium Features**: Comentarios profundos, retiros curados

## 🤝 Contribuir

Este es un proyecto MVP. Para contribuir:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto utiliza textos bíblicos de dominio público en español.

El código de la aplicación está disponible bajo licencia MIT.

## 🙏 Atribuciones

- Textos bíblicos: Traducción católica española de dominio público
- UI Components: [shadcn/ui](https://ui.shadcn.com)
- AI SDK: [Vercel AI SDK](https://sdk.vercel.ai)
- Database: [Supabase](https://supabase.com)
- LLM: [OpenAI](https://openai.com)

## 📞 Soporte

Para problemas, preguntas o sugerencias, por favor abre un issue en GitHub.

---

**Hecho con ❤️ para la comunidad católica de habla hispana**

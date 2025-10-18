# Guía Rápida de Configuración - Biblia Católica AI

## 🚀 Pasos para Configurar la Base de Datos

### 1. Verificar Variables de Entorno

Asegúrate de tener un archivo `.env.local` con tus credenciales:

```bash
# Copia el ejemplo si aún no lo has hecho
cp .env.example .env.local
```

Edita `.env.local` y añade tu **OpenAI API Key**:
```env
AI_API_KEY=sk-proj-tu-api-key-aqui
```

### 2. Configurar Supabase

#### Paso A: Ejecutar el Schema Principal

1. Ve a tu proyecto en [Supabase](https://supabase.com/dashboard)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega todo el contenido de `supabase/schema.sql`
5. Click en **Run** (F5)

Deberías ver un mensaje de éxito. Esto crea:
- ✅ 8 tablas (profiles, chat_sessions, chat_messages, prayers, journal_entries, streaks, bible_verses, saints_personas)
- ✅ RLS policies para seguridad
- ✅ Índices para performance
- ✅ Función de búsqueda vectorial

#### Paso B: Sembrar las Personas de Santos

1. En el mismo SQL Editor, crea una nueva query
2. Copia y pega todo el contenido de `supabase/seed-personas.sql`
3. Click en **Run**

Esto inserta las 3 personas de santos:
- ✅ San Agustín
- ✅ Santa Teresa de Ávila
- ✅ San Francisco de Asís

### 3. Sembrar Versículos de Muestra

Desde tu terminal en el proyecto:

```bash
# Instalar tsx si no lo tienes
npm install -g tsx

# Ejecutar el script de seeding
npx tsx scripts/seed-sample-bible.ts
```

Esto insertará ~23 versículos de muestra para pruebas.

**Salida esperada:**
```
🌱 Starting Bible verse seeding...
✅ Successfully seeded 23 Bible verses

📖 Sample verses by book:
   - genesis: 2 verses
   - psalms: 3 verses
   - matthew: 4 verses
   ...
```

### 4. Generar Embeddings Vectoriales

**IMPORTANTE**: Este paso requiere tu OpenAI API Key configurada en `.env.local`

```bash
npx tsx scripts/generate-embeddings.ts
```

Este proceso:
- Genera embeddings para cada versículo (~30 segundos para 23 versículos)
- Costo: ~$0.01 para versículos de muestra
- Almacena vectores en Supabase para búsqueda semántica

**Salida esperada:**
```
🚀 Bible Verse Embeddings Generator

📝 Configuration:
   Model: text-embedding-3-small
   Supabase URL: https://...

🔍 Fetching verses without embeddings...
📊 Found 23 verses to process

Processing batch 1/3 (verses 1-10)
  ✓ genesis 1:1 (1/23)
  ✓ genesis 1:3 (2/23)
  ...

📈 Processing complete:
   ✅ Successfully processed: 23
   ❌ Errors: 0

✨ Embeddings generation complete!
```

### 5. Verificar la Configuración

Reinicia el servidor de desarrollo:

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

Visita `http://localhost:3000` y verifica:

- ✅ El Versículo del Día se carga correctamente
- ✅ No hay errores 500 en la consola
- ✅ Puedes registrarte/iniciar sesión
- ✅ La racha aparece después de autenticarte

## 🔍 Troubleshooting

### Error: "relation 'bible_verses' does not exist"
**Solución**: No ejecutaste `supabase/schema.sql`. Regresa al Paso 2A.

### Error: "No se encontraron versículos"
**Solución**: No ejecutaste el script de seeding. Regresa al Paso 3.

### Error en embeddings: "Invalid API key"
**Solución**: Verifica que tu `AI_API_KEY` en `.env.local` sea válida.

### Error: "No autorizado" en /api/streak
**Solución**: Normal si no has iniciado sesión. Crea una cuenta primero.

## 📝 Próximos Pasos

Una vez configurado:

1. **Crea una cuenta**: Ve a `/auth` y regístrate
2. **Prueba el chat**: Ve a `/chat` y haz una pregunta bíblica
3. **Genera una oración**: Ve a `/prayer` y selecciona una intención
4. **Explora el diario**: Guarda elementos y míralos en `/journal`

## 🚨 Para Producción

Para un deploy real, necesitarás:

1. **Biblia Completa**: Obtener una traducción católica española completa (Torres Amat, ~31,000 versículos)
2. **Embeddings Completos**: Generar embeddings para toda la Biblia (~8 horas, ~$0.50)
3. **Google OAuth**: Configurar credenciales en Supabase
4. **Variables de Entorno**: Configurar en Vercel/tu plataforma de deploy

---

**¿Problemas?** Revisa los logs del servidor o abre un issue en GitHub.

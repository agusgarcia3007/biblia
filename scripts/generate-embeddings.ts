/**
 * Generate Embeddings for Bible Verses
 *
 * This script generates vector embeddings for all Bible verses that don't have them yet.
 * Uses OpenAI's text-embedding-3-small model by default.
 *
 * Usage: npx tsx scripts/generate-embeddings.ts
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - OPENAI_API_KEY (OpenAI API key)
 * - AI_MODEL_EMBEDDINGS (optional, defaults to text-embedding-3-small)
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openaiApiKey = process.env.OPENAI_API_KEY!
const embeddingModel = process.env.AI_MODEL_EMBEDDINGS || 'text-embedding-3-small'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface BibleVerse {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  embedding: string | null
}

/**
 * Generate embedding using OpenAI API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiApiKey}`,
    },
    body: JSON.stringify({
      input: text,
      model: embeddingModel,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

/**
 * Process verses in batches to avoid rate limits
 */
async function processVerses() {
  console.log('🔍 Fetching verses without embeddings...')

  // Fetch all verses that don't have embeddings
  const { data: verses, error: fetchError } = await supabase
    .from('bible_verses')
    .select('id, book, chapter, verse, text, embedding')
    .is('embedding', null)
    .order('book_order, chapter, verse')

  if (fetchError) {
    throw fetchError
  }

  if (!verses || verses.length === 0) {
    console.log('✅ All verses already have embeddings!')
    return
  }

  console.log(`📊 Found ${verses.length} verses to process\n`)

  let processed = 0
  let errors = 0
  const batchSize = 10
  const delayMs = 1000 // 1 second delay between batches to avoid rate limits

  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, Math.min(i + batchSize, verses.length))

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(verses.length / batchSize)} (verses ${i + 1}-${Math.min(i + batchSize, verses.length)})`
    )

    await Promise.all(
      batch.map(async (verse) => {
        try {
          // Generate embedding
          const embedding = await generateEmbedding(verse.text)

          // Convert embedding array to pgvector format
          const embeddingString = `[${embedding.join(',')}]`

          // Update verse with embedding
          const { error: updateError } = await supabase
            .from('bible_verses')
            .update({ embedding: embeddingString })
            .eq('id', verse.id)

          if (updateError) {
            throw updateError
          }

          processed++
          console.log(
            `  ✓ ${verse.book} ${verse.chapter}:${verse.verse} (${processed}/${verses.length})`
          )
        } catch (error) {
          errors++
          console.error(
            `  ✗ Error processing ${verse.book} ${verse.chapter}:${verse.verse}:`,
            error
          )
        }
      })
    )

    // Delay between batches
    if (i + batchSize < verses.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  console.log(`\n📈 Processing complete:`)
  console.log(`   ✅ Successfully processed: ${processed}`)
  console.log(`   ❌ Errors: ${errors}`)
}

// Validate environment variables
function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
  ]

  const missing = required.filter((key) => !process.env[key])

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach((key) => console.error(`   - ${key}`))
    console.error('\nPlease set these variables in your .env file')
    process.exit(1)
  }
}

// Run the script
async function main() {
  console.log('🚀 Bible Verse Embeddings Generator\n')

  validateEnv()

  console.log(`📝 Configuration:`)
  console.log(`   Model: ${embeddingModel}`)
  console.log(`   Supabase URL: ${supabaseUrl}\n`)

  try {
    await processVerses()
    console.log('\n✨ Embeddings generation complete!')
  } catch (error) {
    console.error('\n❌ Failed to generate embeddings:', error)
    process.exit(1)
  }
}

main()

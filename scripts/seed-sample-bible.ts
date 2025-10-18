/**
 * Sample Bible Verse Seeder
 *
 * This script seeds a small sample of Catholic Bible verses in Spanish
 * for testing and development purposes.
 *
 * Usage: npx tsx scripts/seed-sample-bible.ts
 *
 * Note: For production, you'll need to source a complete Catholic Spanish Bible
 * (e.g., Torres Amat translation) that's in the public domain.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Sample verses from various books (Torres Amat or similar public domain translation)
const sampleVerses = [
  // Genesis
  { book: 'genesis', book_order: 1, chapter: 1, verse: 1, text: 'En el principio creó Dios el cielo y la tierra.', is_deuterocanon: false },
  { book: 'genesis', book_order: 1, chapter: 1, verse: 3, text: 'Y dijo Dios: Sea hecha la luz. Y la luz fue hecha.', is_deuterocanon: false },

  // Psalms
  { book: 'psalms', book_order: 23, chapter: 23, verse: 1, text: 'El Señor es mi pastor, nada me falta.', is_deuterocanon: false },
  { book: 'psalms', book_order: 23, chapter: 23, verse: 4, text: 'Aunque pase por el valle tenebroso, ningún mal temeré, porque tú estás conmigo.', is_deuterocanon: false },
  { book: 'psalms', book_order: 23, chapter: 91, verse: 1, text: 'El que habita al abrigo del Altísimo morará bajo la sombra del Omnipotente.', is_deuterocanon: false },

  // Proverbs
  { book: 'proverbs', book_order: 24, chapter: 3, verse: 5, text: 'Confía en el Señor con todo tu corazón y no te apoyes en tu propia prudencia.', is_deuterocanon: false },
  { book: 'proverbs', book_order: 24, chapter: 3, verse: 6, text: 'Reconócelo en todos tus caminos y él enderezará tus sendas.', is_deuterocanon: false },

  // Wisdom (Deuterocanonical)
  { book: 'wisdom', book_order: 27, chapter: 3, verse: 1, text: 'Las almas de los justos están en las manos de Dios, y ningún tormento los tocará.', is_deuterocanon: true },

  // Isaiah
  { book: 'isaiah', book_order: 29, chapter: 40, verse: 31, text: 'Los que esperan en el Señor renovarán sus fuerzas, levantarán el vuelo como águilas.', is_deuterocanon: false },
  { book: 'isaiah', book_order: 29, chapter: 41, verse: 10, text: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios.', is_deuterocanon: false },

  // Matthew
  { book: 'matthew', book_order: 47, chapter: 5, verse: 3, text: 'Bienaventurados los pobres de espíritu, porque de ellos es el reino de los cielos.', is_deuterocanon: false },
  { book: 'matthew', book_order: 47, chapter: 5, verse: 8, text: 'Bienaventurados los limpios de corazón, porque ellos verán a Dios.', is_deuterocanon: false },
  { book: 'matthew', book_order: 47, chapter: 6, verse: 33, text: 'Buscad primero el reino de Dios y su justicia, y todas estas cosas os serán añadidas.', is_deuterocanon: false },
  { book: 'matthew', book_order: 47, chapter: 11, verse: 28, text: 'Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.', is_deuterocanon: false },

  // John
  { book: 'john', book_order: 50, chapter: 3, verse: 16, text: 'Porque tanto amó Dios al mundo que dio a su Hijo unigénito, para que todo el que cree en él no perezca, sino que tenga vida eterna.', is_deuterocanon: false },
  { book: 'john', book_order: 50, chapter: 14, verse: 6, text: 'Yo soy el camino, la verdad y la vida. Nadie viene al Padre sino por mí.', is_deuterocanon: false },
  { book: 'john', book_order: 50, chapter: 14, verse: 27, text: 'La paz os dejo, mi paz os doy; no os la doy como el mundo la da. No se turbe vuestro corazón ni tenga miedo.', is_deuterocanon: false },

  // Romans
  { book: 'romans', book_order: 52, chapter: 8, verse: 28, text: 'Sabemos que todas las cosas cooperan para el bien de los que aman a Dios.', is_deuterocanon: false },
  { book: 'romans', book_order: 52, chapter: 8, verse: 38, text: 'Estoy seguro de que ni la muerte ni la vida podrán separarnos del amor de Dios.', is_deuterocanon: false },

  // 1 Corinthians
  { book: '1corinthians', book_order: 53, chapter: 13, verse: 4, text: 'El amor es paciente, es bondadoso. El amor no es envidioso ni jactancioso ni orgulloso.', is_deuterocanon: false },
  { book: '1corinthians', book_order: 53, chapter: 13, verse: 13, text: 'Ahora permanecen estas tres virtudes: la fe, la esperanza y el amor. Pero la mayor de todas es el amor.', is_deuterocanon: false },

  // Philippians
  { book: 'philippians', book_order: 57, chapter: 4, verse: 6, text: 'No se inquieten por nada; más bien, en toda ocasión, con oración y ruego, presenten sus peticiones a Dios y denle gracias.', is_deuterocanon: false },
  { book: 'philippians', book_order: 57, chapter: 4, verse: 13, text: 'Todo lo puedo en Cristo que me fortalece.', is_deuterocanon: false },
]

async function seedBibleVerses() {
  console.log('🌱 Starting Bible verse seeding...')

  try {
    // Insert sample verses
    const { data, error } = await supabase
      .from('bible_verses')
      .insert(sampleVerses)
      .select()

    if (error) {
      throw error
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} Bible verses`)
    console.log('\n📖 Sample verses by book:')

    const bookCounts = sampleVerses.reduce((acc: Record<string, number>, v) => {
      acc[v.book] = (acc[v.book] || 0) + 1
      return acc
    }, {})

    Object.entries(bookCounts).forEach(([book, count]) => {
      console.log(`   - ${book}: ${count} verses`)
    })

    console.log('\n⚠️  Note: These are sample verses for testing.')
    console.log('For production, you need to source a complete Catholic Spanish Bible.')

  } catch (error) {
    console.error('❌ Error seeding Bible verses:', error)
    throw error
  }
}

// Run the seeder
seedBibleVerses()
  .then(() => {
    console.log('\n✨ Seeding complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  })

export interface BibleBook {
  key: string
  display_name: string
  book_order: number
  is_deuterocanon: boolean
  testament: 'OT' | 'NT'
}

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { key: 'genesis', display_name: 'Génesis', book_order: 1, is_deuterocanon: false, testament: 'OT' },
  { key: 'exodus', display_name: 'Éxodo', book_order: 2, is_deuterocanon: false, testament: 'OT' },
  { key: 'leviticus', display_name: 'Levítico', book_order: 3, is_deuterocanon: false, testament: 'OT' },
  { key: 'numbers', display_name: 'Números', book_order: 4, is_deuterocanon: false, testament: 'OT' },
  { key: 'deuteronomy', display_name: 'Deuteronomio', book_order: 5, is_deuterocanon: false, testament: 'OT' },
  { key: 'joshua', display_name: 'Josué', book_order: 6, is_deuterocanon: false, testament: 'OT' },
  { key: 'judges', display_name: 'Jueces', book_order: 7, is_deuterocanon: false, testament: 'OT' },
  { key: 'ruth', display_name: 'Rut', book_order: 8, is_deuterocanon: false, testament: 'OT' },
  { key: '1samuel', display_name: '1 Samuel', book_order: 9, is_deuterocanon: false, testament: 'OT' },
  { key: '2samuel', display_name: '2 Samuel', book_order: 10, is_deuterocanon: false, testament: 'OT' },
  { key: '1kings', display_name: '1 Reyes', book_order: 11, is_deuterocanon: false, testament: 'OT' },
  { key: '2kings', display_name: '2 Reyes', book_order: 12, is_deuterocanon: false, testament: 'OT' },
  { key: '1chronicles', display_name: '1 Crónicas', book_order: 13, is_deuterocanon: false, testament: 'OT' },
  { key: '2chronicles', display_name: '2 Crónicas', book_order: 14, is_deuterocanon: false, testament: 'OT' },
  { key: 'ezra', display_name: 'Esdras', book_order: 15, is_deuterocanon: false, testament: 'OT' },
  { key: 'nehemiah', display_name: 'Nehemías', book_order: 16, is_deuterocanon: false, testament: 'OT' },
  { key: 'tobit', display_name: 'Tobías', book_order: 17, is_deuterocanon: true, testament: 'OT' },
  { key: 'judith', display_name: 'Judit', book_order: 18, is_deuterocanon: true, testament: 'OT' },
  { key: 'esther', display_name: 'Ester', book_order: 19, is_deuterocanon: false, testament: 'OT' },
  { key: '1maccabees', display_name: '1 Macabeos', book_order: 20, is_deuterocanon: true, testament: 'OT' },
  { key: '2maccabees', display_name: '2 Macabeos', book_order: 21, is_deuterocanon: true, testament: 'OT' },
  { key: 'job', display_name: 'Job', book_order: 22, is_deuterocanon: false, testament: 'OT' },
  { key: 'psalms', display_name: 'Salmos', book_order: 23, is_deuterocanon: false, testament: 'OT' },
  { key: 'proverbs', display_name: 'Proverbios', book_order: 24, is_deuterocanon: false, testament: 'OT' },
  { key: 'ecclesiastes', display_name: 'Eclesiastés', book_order: 25, is_deuterocanon: false, testament: 'OT' },
  { key: 'songofsolomon', display_name: 'Cantar de los Cantares', book_order: 26, is_deuterocanon: false, testament: 'OT' },
  { key: 'wisdom', display_name: 'Sabiduría', book_order: 27, is_deuterocanon: true, testament: 'OT' },
  { key: 'sirach', display_name: 'Eclesiástico (Sirácida)', book_order: 28, is_deuterocanon: true, testament: 'OT' },
  { key: 'isaiah', display_name: 'Isaías', book_order: 29, is_deuterocanon: false, testament: 'OT' },
  { key: 'jeremiah', display_name: 'Jeremías', book_order: 30, is_deuterocanon: false, testament: 'OT' },
  { key: 'lamentations', display_name: 'Lamentaciones', book_order: 31, is_deuterocanon: false, testament: 'OT' },
  { key: 'baruch', display_name: 'Baruc', book_order: 32, is_deuterocanon: true, testament: 'OT' },
  { key: 'ezekiel', display_name: 'Ezequiel', book_order: 33, is_deuterocanon: false, testament: 'OT' },
  { key: 'daniel', display_name: 'Daniel', book_order: 34, is_deuterocanon: false, testament: 'OT' },
  { key: 'hosea', display_name: 'Oseas', book_order: 35, is_deuterocanon: false, testament: 'OT' },
  { key: 'joel', display_name: 'Joel', book_order: 36, is_deuterocanon: false, testament: 'OT' },
  { key: 'amos', display_name: 'Amós', book_order: 37, is_deuterocanon: false, testament: 'OT' },
  { key: 'obadiah', display_name: 'Abdías', book_order: 38, is_deuterocanon: false, testament: 'OT' },
  { key: 'jonah', display_name: 'Jonás', book_order: 39, is_deuterocanon: false, testament: 'OT' },
  { key: 'micah', display_name: 'Miqueas', book_order: 40, is_deuterocanon: false, testament: 'OT' },
  { key: 'nahum', display_name: 'Nahúm', book_order: 41, is_deuterocanon: false, testament: 'OT' },
  { key: 'habakkuk', display_name: 'Habacuc', book_order: 42, is_deuterocanon: false, testament: 'OT' },
  { key: 'zephaniah', display_name: 'Sofonías', book_order: 43, is_deuterocanon: false, testament: 'OT' },
  { key: 'haggai', display_name: 'Ageo', book_order: 44, is_deuterocanon: false, testament: 'OT' },
  { key: 'zechariah', display_name: 'Zacarías', book_order: 45, is_deuterocanon: false, testament: 'OT' },
  { key: 'malachi', display_name: 'Malaquías', book_order: 46, is_deuterocanon: false, testament: 'OT' },

  // New Testament
  { key: 'matthew', display_name: 'Mateo', book_order: 47, is_deuterocanon: false, testament: 'NT' },
  { key: 'mark', display_name: 'Marcos', book_order: 48, is_deuterocanon: false, testament: 'NT' },
  { key: 'luke', display_name: 'Lucas', book_order: 49, is_deuterocanon: false, testament: 'NT' },
  { key: 'john', display_name: 'Juan', book_order: 50, is_deuterocanon: false, testament: 'NT' },
  { key: 'acts', display_name: 'Hechos', book_order: 51, is_deuterocanon: false, testament: 'NT' },
  { key: 'romans', display_name: 'Romanos', book_order: 52, is_deuterocanon: false, testament: 'NT' },
  { key: '1corinthians', display_name: '1 Corintios', book_order: 53, is_deuterocanon: false, testament: 'NT' },
  { key: '2corinthians', display_name: '2 Corintios', book_order: 54, is_deuterocanon: false, testament: 'NT' },
  { key: 'galatians', display_name: 'Gálatas', book_order: 55, is_deuterocanon: false, testament: 'NT' },
  { key: 'ephesians', display_name: 'Efesios', book_order: 56, is_deuterocanon: false, testament: 'NT' },
  { key: 'philippians', display_name: 'Filipenses', book_order: 57, is_deuterocanon: false, testament: 'NT' },
  { key: 'colossians', display_name: 'Colosenses', book_order: 58, is_deuterocanon: false, testament: 'NT' },
  { key: '1thessalonians', display_name: '1 Tesalonicenses', book_order: 59, is_deuterocanon: false, testament: 'NT' },
  { key: '2thessalonians', display_name: '2 Tesalonicenses', book_order: 60, is_deuterocanon: false, testament: 'NT' },
  { key: '1timothy', display_name: '1 Timoteo', book_order: 61, is_deuterocanon: false, testament: 'NT' },
  { key: '2timothy', display_name: '2 Timoteo', book_order: 62, is_deuterocanon: false, testament: 'NT' },
  { key: 'titus', display_name: 'Tito', book_order: 63, is_deuterocanon: false, testament: 'NT' },
  { key: 'philemon', display_name: 'Filemón', book_order: 64, is_deuterocanon: false, testament: 'NT' },
  { key: 'hebrews', display_name: 'Hebreos', book_order: 65, is_deuterocanon: false, testament: 'NT' },
  { key: 'james', display_name: 'Santiago', book_order: 66, is_deuterocanon: false, testament: 'NT' },
  { key: '1peter', display_name: '1 Pedro', book_order: 67, is_deuterocanon: false, testament: 'NT' },
  { key: '2peter', display_name: '2 Pedro', book_order: 68, is_deuterocanon: false, testament: 'NT' },
  { key: '1john', display_name: '1 Juan', book_order: 69, is_deuterocanon: false, testament: 'NT' },
  { key: '2john', display_name: '2 Juan', book_order: 70, is_deuterocanon: false, testament: 'NT' },
  { key: '3john', display_name: '3 Juan', book_order: 71, is_deuterocanon: false, testament: 'NT' },
  { key: 'jude', display_name: 'Judas', book_order: 72, is_deuterocanon: false, testament: 'NT' },
  { key: 'revelation', display_name: 'Apocalipsis', book_order: 73, is_deuterocanon: false, testament: 'NT' },
]

export function getBookByKey(key: string): BibleBook | undefined {
  return BIBLE_BOOKS.find(b => b.key === key)
}

export function getBookByOrder(order: number): BibleBook | undefined {
  return BIBLE_BOOKS.find(b => b.book_order === order)
}

export function formatVerseReference(book: string, chapter: number, verse: number): string {
  const bookData = BIBLE_BOOKS.find(b => b.key === book)
  const bookName = bookData?.display_name || book
  return `${bookName} ${chapter}:${verse}`
}

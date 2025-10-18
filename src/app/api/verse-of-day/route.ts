import { createClient } from "@/lib/supabase/server";
import { formatVerseReference } from "@/lib/bible-books";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { Database } from "@/lib/supabase/database.types";
import { REFLECTION_SYSTEM_PROMPT } from "@/lib/prompts";

type BibleVerse = Database["public"]["Tables"]["bible_verses"]["Row"];

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

/**
 * Deterministic hash function to select verse based on date
 */
function hashDate(dateString: string): number {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    const supabase = await createClient();

    // First, check total count
    const { count, error: countError } = await supabase
      .from("bible_verses")
      .select("*", { count: "exact", head: true });

    if (countError || !count || count === 0) {
      console.error("Error getting verse count:", countError);
      return new Response("Error al contar versículos", { status: 500 });
    }

    // Deterministically select verse based on date
    const hash = hashDate(date);
    const selectedIndex = hash % count;

    console.log("Date:", date);
    console.log("Hash:", hash);
    console.log("Total verses in DB:", count);
    console.log("Selected index:", selectedIndex);

    // Fetch the selected verse
    const { data: verses, error: verseError } = await supabase
      .from("bible_verses")
      .select("*")
      .order("book_order, chapter, verse")
      .range(selectedIndex, selectedIndex)
      .limit(1);

    console.log("Verses:", verses);
    console.log("Verse error:", verseError);

    if (verseError || !verses || verses.length === 0) {
      console.error("Error fetching verse:", verseError);
      return new Response("Error al recuperar versículo", { status: 500 });
    }

    const verse = verses[0] as BibleVerse;

    // Fetch context (previous and next verses)
    const { data: contextVerses, error: contextError } = await supabase
      .from("bible_verses")
      .select("*")
      .eq("book", verse.book)
      .eq("chapter", verse.chapter)
      .gte("verse", Math.max(1, verse.verse - 2))
      .lte("verse", verse.verse + 2)
      .order("verse");

    if (contextError) {
      console.error("Error fetching context:", contextError);
    }

    // Generate reflection using AI
    const reflectionPrompt = `Versículo del día:

${formatVerseReference(verse.book, verse.chapter, verse.verse)}: "${verse.text}"

Escribe una breve reflexión pastoral (2-3 oraciones) que ayude a aplicar este versículo a la vida cotidiana.`;

    const result = await generateText({
      model: openai(process.env.AI_MODEL_CHAT || "gpt-4"),
      system: REFLECTION_SYSTEM_PROMPT,
      prompt: reflectionPrompt,
      temperature: 0.4,
    });

    return Response.json(
      {
        verse: {
          id: verse.id,
          book: verse.book,
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
          reference: formatVerseReference(
            verse.book,
            verse.chapter,
            verse.verse
          ),
          is_deuterocanon: verse.is_deuterocanon,
        },
        reflection: result.text,
        context: contextVerses || [],
        date,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=172800",
        },
      }
    );
  } catch (error) {
    console.error("Error in verse-of-day route:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}

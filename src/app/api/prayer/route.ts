import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createClient } from "@/lib/supabase/server";
import { getPersonaSystemPrompt } from "@/lib/personas";
import { PRAYER_SYSTEM_PROMPT } from "@/lib/prompts";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const {
      personaKey = "augustin",
      intentTag,
      userContext,
    } = await req.json();

    if (!intentTag) {
      return new Response("Se requiere etiqueta de intención", { status: 400 });
    }

    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response("No autorizado", { status: 401 });
    }

    // Build persona-specific prompt
    const personaPrompt = getPersonaSystemPrompt(personaKey);

    // Build prayer request prompt
    const prayerPrompt = `Genera una oración en español para una persona que busca:

Intención: ${intentTag}
${userContext ? `\nContexto adicional: ${userContext}` : ""}

La oración debe ser:
- Breve y reverente
- Pastoral y esperanzadora
- Fundamentada en la fe católica
- Sin especulación doctrinal
- Adecuada para oración personal`;

    const fullSystemPrompt = `${PRAYER_SYSTEM_PROMPT}\n\n${personaPrompt}`;

    // Generate prayer
    const result = await generateText({
      model: openai(process.env.AI_MODEL_CHAT || "gpt-4"),
      system: fullSystemPrompt,
      prompt: prayerPrompt,
      temperature: 0.5, // Slightly higher for creativity but still controlled
    });

    const prayerContent = result.text;

    // Store prayer in database
    const { data: prayerRecord, error: prayerError } = await supabase
      .from("prayers")
      .insert({
        user_id: user.id,
        persona_key: personaKey,
        intent_tag: intentTag,
        content: prayerContent,
        grounding_refs: null,
      })
      .select()
      .single();

    if (prayerError) {
      console.error("Error storing prayer:", prayerError);
      // Return prayer even if storage fails
    }

    return Response.json({
      prayer: prayerContent,
      prayerId: prayerRecord?.id,
      personaKey,
      intentTag,
    });
  } catch (error) {
    console.error("Error in prayer route:", error);
    return new Response("Error interno del servidor", { status: 500 });
  }
}

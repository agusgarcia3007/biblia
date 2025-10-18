import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * GET - Retrieve all journal entries for authenticated user
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('No autorizado', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') // Optional filter by type

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (type && ['chat', 'prayer', 'verse'].includes(type)) {
      query = query.eq('type', type)
    }

    const { data: entries, error: fetchError } = await query

    if (fetchError) {
      return new Response('Error al recuperar entradas del diario', { status: 500 })
    }

    return Response.json({ entries })
  } catch (error) {
    console.error('Error in journal GET route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

/**
 * POST - Create a new journal entry
 */
export async function POST(req: Request) {
  try {
    const { type, payload } = await req.json()

    if (!type || !payload) {
      return new Response('Se requiere tipo y contenido', { status: 400 })
    }

    if (!['chat', 'prayer', 'verse'].includes(type)) {
      return new Response('Tipo inválido', { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('No autorizado', { status: 401 })
    }

    const { data: entry, error: insertError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        type,
        payload,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating journal entry:', insertError)
      return new Response('Error al crear entrada del diario', { status: 500 })
    }

    return Response.json({ entry })
  } catch (error) {
    console.error('Error in journal POST route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

/**
 * DELETE - Delete a journal entry
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return new Response('Se requiere ID', { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('No autorizado', { status: 401 })
    }

    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting journal entry:', deleteError)
      return new Response('Error al eliminar entrada del diario', { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error('Error in journal DELETE route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

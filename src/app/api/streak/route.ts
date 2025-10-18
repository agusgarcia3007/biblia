import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

/**
 * GET - Retrieve current streak for authenticated user
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

    const { data: streak, error: streakError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (streakError) {
      // If no streak exists, create one
      if (streakError.code === 'PGRST116') {
        const { data: newStreak, error: createError } = await supabase
          .from('streaks')
          .insert({
            user_id: user.id,
            current_streak: 0,
            last_active_date: new Date().toISOString().split('T')[0],
          })
          .select()
          .single()

        if (createError) {
          return new Response('Error al crear racha', { status: 500 })
        }

        return Response.json(newStreak)
      }

      return new Response('Error al recuperar racha', { status: 500 })
    }

    return Response.json(streak)
  } catch (error) {
    console.error('Error in streak GET route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

/**
 * POST - Update streak (increment if active today)
 */
export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('No autorizado', { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Get current streak
    const { data: currentStreak, error: getError } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (getError) {
      return new Response('Error al recuperar racha', { status: 500 })
    }

    const lastActiveDate = currentStreak.last_active_date

    // Calculate if streak should continue, break, or stay the same
    let newStreakValue = currentStreak.current_streak

    if (lastActiveDate === today) {
      // Already active today, no change
      return Response.json({
        ...currentStreak,
        alreadyActiveToday: true,
      })
    }

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayString = yesterday.toISOString().split('T')[0]

    if (lastActiveDate === yesterdayString) {
      // Consecutive day, increment streak
      newStreakValue = currentStreak.current_streak + 1
    } else {
      // Streak broken, reset to 1
      newStreakValue = 1
    }

    // Update streak
    const { data: updatedStreak, error: updateError } = await supabase
      .from('streaks')
      .update({
        current_streak: newStreakValue,
        last_active_date: today,
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      return new Response('Error al actualizar racha', { status: 500 })
    }

    return Response.json({
      ...updatedStreak,
      wasIncremented: true,
      wasBroken: lastActiveDate !== yesterdayString,
    })
  } catch (error) {
    console.error('Error in streak POST route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

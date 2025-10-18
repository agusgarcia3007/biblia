import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

interface LeaderboardEntry {
  user_id: string
  score: number
  streak: number
  rank: number
}

/**
 * GET - Retrieve leaderboard with religiosity scores
 *
 * Scoring formula:
 * - Current streak: 10 points per day
 * - Journal entries: 5 points each
 * - Prayers: 8 points each
 * - Chat sessions: 3 points each
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

    // Check if we should return all users or just top 10
    const url = new URL(req.url)
    const limit = url.searchParams.get('limit')

    // Get all unique user_ids from different tables
    const [streaksRes, journalRes, prayersRes, chatRes] = await Promise.all([
      supabase.from('streaks').select('user_id'),
      supabase.from('journal_entries').select('user_id'),
      supabase.from('prayers').select('user_id'),
      supabase.from('chat_sessions').select('user_id'),
    ])

    // Combine all user_ids and get unique ones
    const allUserIds = new Set<string>()

    streaksRes.data?.forEach(s => allUserIds.add(s.user_id))
    journalRes.data?.forEach(j => allUserIds.add(j.user_id))
    prayersRes.data?.forEach(p => allUserIds.add(p.user_id))
    chatRes.data?.forEach(c => allUserIds.add(c.user_id))

    if (allUserIds.size === 0) {
      return Response.json({
        leaderboard: [],
        currentUser: undefined,
        totalUsers: 0,
      })
    }

    // Calculate scores for each user
    const leaderboardPromises = Array.from(allUserIds).map(async (userId) => {
      // Get streak (don't use .single() to avoid errors if no streak exists)
      const { data: streakData } = await supabase
        .from('streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .maybeSingle()

      const currentStreak = streakData?.current_streak || 0

      // Get journal entries count
      const { count: journalCount } = await supabase
        .from('journal_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get prayers count
      const { count: prayersCount } = await supabase
        .from('prayers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Get chat sessions count
      const { count: chatCount } = await supabase
        .from('chat_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Calculate total score
      const score =
        (currentStreak * 10) +
        ((journalCount || 0) * 5) +
        ((prayersCount || 0) * 8) +
        ((chatCount || 0) * 3)

      return {
        user_id: userId,
        score,
        streak: currentStreak,
      }
    })

    const leaderboardData = await Promise.all(leaderboardPromises)

    // Sort by score (descending) and add rank
    const sortedLeaderboard = leaderboardData
      .sort((a, b) => b.score - a.score)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }))

    // Determine what to return based on limit parameter
    const leaderboardToReturn = limit === 'all'
      ? sortedLeaderboard
      : sortedLeaderboard.slice(0, 10)

    // Find current user's position
    const currentUserEntry = sortedLeaderboard.find(
      (entry) => entry.user_id === user.id
    )

    return Response.json({
      leaderboard: leaderboardToReturn,
      currentUser: currentUserEntry,
      totalUsers: sortedLeaderboard.length,
    })
  } catch (error) {
    console.error('Error in leaderboard GET route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

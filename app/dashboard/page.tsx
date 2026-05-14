import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/DashboardClient'
import type { Habit } from '@/types/habit'

/** Convert JS getDay() (0=Sun) to Mon-based index (0=Mon … 6=Sun) */
function toMondayIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

function isScheduledToday(habit: Habit, todayIndex: number): boolean {
  if (habit.frequency === 'daily') return true
  return habit.days_of_week?.includes(todayIndex) ?? false
}

type RawLog = { habit_id: string; completed_at: string }

function computeStreak(habitId: string, logs: RawLog[], today: string): number {
  const dates = new Set(
    logs.filter(l => l.habit_id === habitId).map(l => l.completed_at)
  )
  if (!dates.size) return 0

  let streak = 0
  // Use noon UTC to avoid DST edge cases
  const d = new Date(`${today}T12:00:00Z`)

  // If today isn't logged yet, start counting from yesterday
  if (!dates.has(d.toISOString().split('T')[0])) {
    d.setUTCDate(d.getUTCDate() - 1)
  }

  while (dates.has(d.toISOString().split('T')[0])) {
    streak++
    d.setUTCDate(d.getUTCDate() - 1)
  }

  return streak
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const todayIndex = toMondayIndex(now.getDay())
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [{ data: habits }, { data: todayLogs }, { data: recentLogs }] =
    await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('habit_logs')
        .select('habit_id')
        .eq('user_id', user.id)
        .eq('completed_at', today),
      supabase
        .from('habit_logs')
        .select('habit_id, completed_at')
        .eq('user_id', user.id)
        .gte('completed_at', thirtyDaysAgo),
    ])

  const allHabits = (habits ?? []) as Habit[]
  const todayHabits = allHabits.filter(h => isScheduledToday(h, todayIndex))
  const completedIds = (todayLogs ?? []).map(l => l.habit_id as string)

  const recentLogsTyped = (recentLogs ?? []) as RawLog[]
  const streaks: Record<string, number> = {}
  for (const h of allHabits) {
    streaks[h.id] = computeStreak(h.id, recentLogsTyped, today)
  }

  const meta = user.user_metadata as Record<string, string> | null
  const userName =
    meta?.full_name?.split(' ')[0] ??
    meta?.name?.split(' ')[0] ??
    user.email?.split('@')[0] ??
    'друг'

  return (
    <DashboardClient
      allHabits={allHabits}
      todayHabits={todayHabits}
      initialCompletedIds={completedIds}
      streaks={streaks}
      userId={user.id}
      userName={userName}
      today={today}
    />
  )
}

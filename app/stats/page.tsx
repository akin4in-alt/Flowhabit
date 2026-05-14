import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StatsClient from '@/components/StatsClient'
import type { Habit } from '@/types/habit'

type RawLog = { habit_id: string; completed_at: string }

function toMondayIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

/** Map date string → number of distinct habit completions that day. */
function buildDayCompletions(logs: RawLog[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const log of logs) {
    map[log.completed_at] = (map[log.completed_at] ?? 0) + 1
  }
  return map
}

/**
 * Days in a row (ending today) where the user completed at least one habit.
 * Counts backwards from today until we hit a day with 0 completions.
 */
function computeCurrentStreak(
  dayCompletions: Record<string, number>,
  today: string,
): number {
  let streak = 0
  const d = new Date(`${today}T12:00:00Z`)
  while ((dayCompletions[d.toISOString().split('T')[0]] ?? 0) > 0) {
    streak++
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return streak
}

/** Longest consecutive active-day run within the last `days` calendar days. */
function computeBestStreak(
  dayCompletions: Record<string, number>,
  today: string,
  days: number,
): number {
  let best = 0
  let current = 0
  const base = new Date(`${today}T12:00:00Z`)
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(base)
    dt.setUTCDate(dt.getUTCDate() - i)
    const date = dt.toISOString().split('T')[0]
    if ((dayCompletions[date] ?? 0) > 0) {
      current++
      if (current > best) best = current
    } else {
      current = 0
    }
  }
  return best
}

/**
 * Per-habit stats:
 *  - current streak (consecutive days ending today)
 *  - 30-day completion % (accounts for frequency / days_of_week)
 *  - last 7 days array (oldest first)
 */
function computeHabitStats(
  habit: Habit,
  logs: RawLog[],
  today: string,
  thirtyDaysAgo: string,
) {
  const completedDates = new Set(
    logs.filter(l => l.habit_id === habit.id).map(l => l.completed_at),
  )

  // Current streak — start from today; if today not logged start from yesterday
  let streak = 0
  const d = new Date(`${today}T12:00:00Z`)
  if (!completedDates.has(today)) d.setUTCDate(d.getUTCDate() - 1)
  while (completedDates.has(d.toISOString().split('T')[0])) {
    streak++
    d.setUTCDate(d.getUTCDate() - 1)
  }

  // 30-day completion percentage
  let scheduled30 = 0
  let completed30 = 0
  const from = new Date(`${thirtyDaysAgo}T12:00:00Z`)
  const to = new Date(`${today}T12:00:00Z`)
  const iter = new Date(from)
  while (iter <= to) {
    const date = iter.toISOString().split('T')[0]
    const dow = toMondayIndex(iter.getUTCDay())
    const isScheduled =
      habit.frequency === 'daily' || (habit.days_of_week?.includes(dow) ?? false)
    if (isScheduled) {
      scheduled30++
      if (completedDates.has(date)) completed30++
    }
    iter.setUTCDate(iter.getUTCDate() + 1)
  }
  const completionPct =
    scheduled30 > 0 ? Math.round((completed30 / scheduled30) * 100) : 0

  // Last 7 days (index 0 = 6 days ago, index 6 = today)
  const last7: { date: string; completed: boolean }[] = []
  for (let i = 6; i >= 0; i--) {
    const dt = new Date(`${today}T12:00:00Z`)
    dt.setUTCDate(dt.getUTCDate() - i)
    const date = dt.toISOString().split('T')[0]
    last7.push({ date, completed: completedDates.has(date) })
  }

  return { habitId: habit.id, streak, completionPct, last7, scheduled30, completed30 }
}

export default async function StatsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [{ data: habits }, { data: logs }] = await Promise.all([
    supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('archived', false)
      .order('created_at', { ascending: false }),
    supabase
      .from('habit_logs')
      .select('habit_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', ninetyDaysAgo),
  ])

  const allHabits = (habits ?? []) as Habit[]
  const allLogs = (logs ?? []) as RawLog[]

  const dayCompletions = buildDayCompletions(allLogs)
  const overallCurrentStreak = computeCurrentStreak(dayCompletions, today)
  const overallBestStreak = computeBestStreak(dayCompletions, today, 90)

  const rawHabitStats = allHabits.map(h =>
    computeHabitStats(h, allLogs, today, thirtyDaysAgo),
  )
  const totalScheduled = rawHabitStats.reduce((s, h) => s + h.scheduled30, 0)
  const totalCompleted = rawHabitStats.reduce((s, h) => s + h.completed30, 0)
  const overallCompletionPct30 =
    totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0

  // Strip server-only fields before passing to client
  const habitStats = rawHabitStats.map(({ habitId, streak, completionPct, last7 }) => ({
    habitId,
    streak,
    completionPct,
    last7,
  }))

  return (
    <StatsClient
      habits={allHabits}
      dayCompletions={dayCompletions}
      overallCurrentStreak={overallCurrentStreak}
      overallBestStreak={overallBestStreak}
      overallCompletionPct30={overallCompletionPct30}
      habitStats={habitStats}
      today={today}
    />
  )
}

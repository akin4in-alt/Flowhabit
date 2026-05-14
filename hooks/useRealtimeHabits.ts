'use client'

import { useEffect, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { Habit, HabitLog } from '@/types/habit'

export interface RealtimeHabitsCallbacks {
  /** A new habit row was inserted (e.g. from another device/tab). */
  onHabitInsert: (habit: Habit) => void
  /**
   * An existing habit row was updated. Includes archive events
   * (payload.archived === true) — callers should remove the habit from
   * the visible list when that flag is set.
   */
  onHabitUpdate: (habit: Habit) => void
  /** A habit row was hard-deleted. */
  onHabitDelete: (habitId: string) => void
  /**
   * A habit_log row was inserted for today.
   * NOTE: only fires when the log's `completed_at` matches `today`.
   */
  onLogInsert: (log: Pick<HabitLog, 'habit_id' | 'completed_at'>) => void
  /**
   * A habit_log row was deleted.
   * NOTE: `habit_id` is only available in the payload when the table has
   * `REPLICA IDENTITY FULL`. Run:
   *   ALTER TABLE habit_logs REPLICA IDENTITY FULL;
   * Without it this callback is never fired (silently skipped).
   */
  onLogDelete: (habitId: string) => void
}

interface Options extends RealtimeHabitsCallbacks {
  userId: string
  today: string
}

/**
 * Subscribes to real-time Postgres changes on `habits` and `habit_logs`
 * for the given user. Automatically unsubscribes on unmount.
 *
 * Prerequisites in Supabase dashboard:
 *  - Realtime enabled for both `habits` and `habit_logs` tables.
 *  - For DELETE log events: `ALTER TABLE habit_logs REPLICA IDENTITY FULL;`
 */
export function useRealtimeHabits({ userId, today, ...callbacks }: Options): void {
  // Store the latest version of every callback in a ref.
  // This lets the subscriptions (set up once per [userId, today]) always
  // call the most-recent handler without needing to re-subscribe.
  const cbRef = useRef<RealtimeHabitsCallbacks>(callbacks)
  useEffect(() => {
    cbRef.current = callbacks
  })

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    let channel: RealtimeChannel

    channel = supabase
      .channel(`dashboard:${userId}`)

      // ── habits: INSERT ────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          cbRef.current.onHabitInsert(payload.new as Habit)
        }
      )

      // ── habits: UPDATE (includes archive) ────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          cbRef.current.onHabitUpdate(payload.new as Habit)
        }
      )

      // ── habits: DELETE ────────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          // With default REPLICA IDENTITY only the PK arrives in `old`
          const id = (payload.old as { id?: string }).id
          if (id) cbRef.current.onHabitDelete(id)
        }
      )

      // ── habit_logs: INSERT ────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'habit_logs',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          const log = payload.new as HabitLog
          // Only care about today's logs for the dashboard
          if (log.completed_at === today) {
            cbRef.current.onLogInsert(log)
          }
        }
      )

      // ── habit_logs: DELETE ────────────────────────────────────────
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'habit_logs',
          filter: `user_id=eq.${userId}`,
        },
        payload => {
          // `habit_id` is only present when REPLICA IDENTITY FULL is set
          const old = payload.old as Partial<HabitLog>
          if (old.habit_id) {
            cbRef.current.onLogDelete(old.habit_id)
          }
        }
      )

      .subscribe(status => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(`[Realtime] habits channel: ${status}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
    // Re-subscribe only when the user or the reference date changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, today])
}

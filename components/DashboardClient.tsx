'use client'

import { useState } from 'react'
import type { Habit } from '@/types/habit'
import HabitCheckCard from './HabitCheckCard'
import AddHabitModal from './AddHabitModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import Toast from './Toast'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeHabits } from '@/hooks/useRealtimeHabits'

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Доброе утро'
  if (hour >= 12 && hour < 17) return 'Добрый день'
  if (hour >= 17 && hour < 23) return 'Добрый вечер'
  return 'Доброй ночи'
}

function toMondayIndex(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

function isScheduledToday(habit: Habit, dayIndex: number): boolean {
  if (habit.frequency === 'daily') return true
  return habit.days_of_week?.includes(dayIndex) ?? false
}

interface Props {
  allHabits: Habit[]
  todayHabits: Habit[]
  initialCompletedIds: string[]
  streaks: Record<string, number>
  userId: string
  userName: string
  today: string
}

export default function DashboardClient({
  allHabits: serverAllHabits,
  todayHabits: serverTodayHabits,
  initialCompletedIds,
  streaks: serverStreaks,
  userId,
  userName,
  today,
}: Props) {
  const [allHabits, setAllHabits] = useState<Habit[]>(serverAllHabits)
  const [todayHabits, setTodayHabits] = useState<Habit[]>(serverTodayHabits)
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(initialCompletedIds)
  )
  const [streaks, setStreaks] = useState<Record<string, number>>(serverStreaks)

  // Modal state
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)

  const [toast, setToast] = useState<string | null>(null)

  const supabase = createClient()

  const now = new Date()
  const greeting = getGreeting(now.getHours())
  const dateStr = now.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const dateFormatted = dateStr.charAt(0).toUpperCase() + dateStr.slice(1)

  const completedToday = todayHabits.filter(h => completedIds.has(h.id)).length
  const totalToday = todayHabits.length
  const progress = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0
  const allDone = totalToday > 0 && completedToday === totalToday

  // ── Pure state mutators (shared by modal handlers AND realtime callbacks) ───

  function applyHabitDelete(habitId: string) {
    setAllHabits(prev => prev.filter(h => h.id !== habitId))
    setTodayHabits(prev => prev.filter(h => h.id !== habitId))
    setCompletedIds(prev => { const n = new Set(prev); n.delete(habitId); return n })
    setStreaks(prev => { const n = { ...prev }; delete n[habitId]; return n })
  }

  function applyHabitInsert(habit: Habit) {
    const dayIndex = toMondayIndex(new Date().getDay())
    // Guard against duplicates from optimistic updates on the same device
    setAllHabits(prev => prev.some(h => h.id === habit.id) ? prev : [habit, ...prev])
    if (isScheduledToday(habit, dayIndex)) {
      setTodayHabits(prev => prev.some(h => h.id === habit.id) ? prev : [habit, ...prev])
    }
    setStreaks(prev => habit.id in prev ? prev : { ...prev, [habit.id]: 0 })
  }

  function applyHabitUpdate(habit: Habit) {
    // Treat archived habits the same as deleted ones
    if (habit.archived) {
      applyHabitDelete(habit.id)
      return
    }
    const dayIndex = toMondayIndex(new Date().getDay())
    const scheduled = isScheduledToday(habit, dayIndex)
    setAllHabits(prev => prev.map(h => h.id === habit.id ? habit : h))
    setTodayHabits(prev => {
      const inList = prev.some(h => h.id === habit.id)
      if (scheduled && inList) return prev.map(h => h.id === habit.id ? habit : h)
      if (scheduled && !inList) return [habit, ...prev]
      return prev.filter(h => h.id !== habit.id)
    })
  }

  function applyLogInsert(habitId: string) {
    setCompletedIds(prev => {
      if (prev.has(habitId)) return prev
      return new Set([...prev, habitId])
    })
    setStreaks(prev => ({ ...prev, [habitId]: (prev[habitId] ?? 0) + 1 }))
  }

  function applyLogDelete(habitId: string) {
    setCompletedIds(prev => { const n = new Set(prev); n.delete(habitId); return n })
    setStreaks(prev => ({ ...prev, [habitId]: Math.max(0, (prev[habitId] ?? 0) - 1) }))
  }

  // ── Realtime subscription ────────────────────────────────────────────────────

  useRealtimeHabits({
    userId,
    today,
    onHabitInsert: applyHabitInsert,
    onHabitUpdate: applyHabitUpdate,
    onHabitDelete: applyHabitDelete,
    onLogInsert: log => applyLogInsert(log.habit_id),
    onLogDelete: applyLogDelete,
  })

  // ── Toggle completion ───────────────────────────────────────────────────────

  async function handleToggle(habitId: string, markDone: boolean) {
    // Optimistic update
    setCompletedIds(prev => {
      const next = new Set(prev)
      markDone ? next.add(habitId) : next.delete(habitId)
      return next
    })

    if (markDone) {
      const { error } = await supabase.from('habit_logs').insert({
        habit_id: habitId,
        user_id: userId,
        completed_at: today,
      })
      if (error) {
        // Rollback optimistic update
        setCompletedIds(prev => { const n = new Set(prev); n.delete(habitId); return n })
        setToast('Ошибка при сохранении')
      } else {
        setStreaks(prev => ({ ...prev, [habitId]: (prev[habitId] ?? 0) + 1 }))
        // The realtime INSERT event will arrive but applyLogInsert deduplicates it
      }
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('completed_at', today)
      if (error) {
        setCompletedIds(prev => { const n = new Set(prev); n.add(habitId); return n })
      } else {
        setStreaks(prev => ({ ...prev, [habitId]: Math.max(0, (prev[habitId] ?? 0) - 1) }))
      }
    }
  }

  // ── Add ─────────────────────────────────────────────────────────────────────

  function handleHabitAdded(habit: Habit) {
    applyHabitInsert(habit)
    setAddModalOpen(false)
    setToast('Привычка добавлена!')
  }

  // ── Edit ─────────────────────────────────────────────────────────────────────

  function handleHabitUpdated(updated: Habit) {
    applyHabitUpdate(updated)
    setEditingHabit(null)
    setToast('Привычка обновлена!')
  }

  // ── Archive ──────────────────────────────────────────────────────────────────

  async function handleArchive(habitId: string) {
    const { error } = await supabase
      .from('habits')
      .update({ archived: true })
      .eq('id', habitId)

    if (error) {
      setToast('Ошибка при архивировании')
      return
    }

    // Optimistic removal — the realtime UPDATE (archived=true) will also
    // call applyHabitDelete but it will be a no-op since the habit is gone.
    applyHabitDelete(habitId)
    setToast('Привычка архивирована')
  }

  // ── Delete ───────────────────────────────────────────────────────────────────

  async function handleDeleteConfirm() {
    if (!deletingHabit) return

    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', deletingHabit.id)

    if (error) {
      setToast('Ошибка при удалении')
      return
    }

    // Optimistic removal — the realtime DELETE event will be a no-op.
    applyHabitDelete(deletingHabit.id)
    setDeletingHabit(null)
    setToast('Привычка удалена')
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            {greeting}, {userName}! 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{dateFormatted}</p>
        </div>

        {/* Progress card */}
        {totalToday > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700">Прогресс дня</p>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{completedToday}</span>
                {' из '}
                <span className="font-semibold text-slate-900">{totalToday}</span>
                {' выполнено'}
              </p>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: allDone
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : '#0f172a',
                }}
              />
            </div>
            {allDone && (
              <p className="text-xs text-emerald-600 font-medium mt-2">
                🎉 Все привычки выполнены! Отличная работа!
              </p>
            )}
          </div>
        )}

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-slate-700">
            {allHabits.length === 0
              ? 'Мои привычки'
              : totalToday > 0
              ? 'Сегодняшние привычки'
              : 'Все привычки'}
          </h2>
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Новая привычка
          </button>
        </div>

        {/* Content */}
        {allHabits.length === 0 ? (
          <EmptyState onAdd={() => setAddModalOpen(true)} />
        ) : todayHabits.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="text-4xl mb-3 select-none">🗓</span>
            <p className="text-sm font-medium text-slate-500">На сегодня привычек нет</p>
            <p className="text-xs mt-1 text-slate-400">
              Некоторые привычки запланированы на другие дни
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayHabits.map(habit => (
              <HabitCheckCard
                key={habit.id}
                habit={habit}
                isCompleted={completedIds.has(habit.id)}
                streak={streaks[habit.id] ?? 0}
                onToggle={handleToggle}
                onEdit={setEditingHabit}
                onArchive={handleArchive}
                onDelete={setDeletingHabit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add modal */}
      {addModalOpen && (
        <AddHabitModal
          onClose={() => setAddModalOpen(false)}
          onAdded={handleHabitAdded}
        />
      )}

      {/* Edit modal */}
      {editingHabit && (
        <AddHabitModal
          habitToEdit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onUpdated={handleHabitUpdated}
        />
      )}

      {/* Delete confirm modal */}
      {deletingHabit && (
        <DeleteConfirmModal
          habitName={deletingHabit.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingHabit(null)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mb-5 select-none text-4xl">
        🌱
      </div>
      <h3 className="text-base font-semibold text-slate-800 mb-1">
        Начните свой путь
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-xs">
        Добавьте первую привычку и начните отслеживать прогресс каждый день
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Создать первую привычку
      </button>
    </div>
  )
}

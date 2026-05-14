'use client'

import { useState } from 'react'
import type { Habit } from '@/types/habit'
import HabitMenu from './HabitMenu'

const COLOR_STYLES: Record<
  string,
  { card: string; done: string; ring: string }
> = {
  blue:   { card: 'bg-blue-50 border-blue-200',     done: 'bg-blue-500',   ring: 'ring-blue-200'   },
  green:  { card: 'bg-green-50 border-green-200',   done: 'bg-green-500',  ring: 'ring-green-200'  },
  purple: { card: 'bg-purple-50 border-purple-200', done: 'bg-purple-500', ring: 'ring-purple-200' },
  orange: { card: 'bg-orange-50 border-orange-200', done: 'bg-orange-500', ring: 'ring-orange-200' },
  pink:   { card: 'bg-pink-50 border-pink-200',     done: 'bg-pink-500',   ring: 'ring-pink-200'   },
  gray:   { card: 'bg-slate-100 border-slate-200',  done: 'bg-slate-500',  ring: 'ring-slate-200'  },
}

const CONFETTI_COLORS = [
  'bg-yellow-400', 'bg-blue-400',   'bg-pink-500',  'bg-green-400',
  'bg-purple-400', 'bg-orange-400', 'bg-red-400',   'bg-teal-400',
]

function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 14) return `${n} дней`
  if (mod10 === 1) return `${n} день`
  if (mod10 >= 2 && mod10 <= 4) return `${n} дня`
  return `${n} дней`
}

interface Props {
  habit: Habit
  isCompleted: boolean
  streak: number
  onToggle: (habitId: string, markDone: boolean) => void
  onEdit: (habit: Habit) => void
  onArchive: (habitId: string) => void
  onDelete: (habit: Habit) => void
}

export default function HabitCheckCard({
  habit,
  isCompleted,
  streak,
  onToggle,
  onEdit,
  onArchive,
  onDelete,
}: Props) {
  const [bursting, setBursting] = useState(false)
  const colors = COLOR_STYLES[habit.color] ?? COLOR_STYLES.gray

  function handleCheck() {
    const next = !isCompleted
    if (next) {
      setBursting(true)
      setTimeout(() => setBursting(false), 700)
    }
    onToggle(habit.id, next)
  }

  return (
    <div
      className={`rounded-2xl border p-4 transition-all duration-300 ${colors.card} ${
        isCompleted ? 'opacity-60' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-2xl leading-none mt-0.5 shrink-0 select-none">
          {habit.icon}
        </span>

        {/* Name + streak */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-medium truncate transition-colors duration-200 ${
              isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {habit.name}
          </p>
          {streak > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              🔥 {pluralDays(streak)} подряд
            </p>
          )}
        </div>

        {/* Menu + check button */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <HabitMenu
            onEdit={() => onEdit(habit)}
            onArchive={() => onArchive(habit.id)}
            onDelete={() => onDelete(habit)}
          />

          {/* Check button with confetti */}
          <div className="relative" style={{ overflow: 'visible' }}>
            <button
              onClick={handleCheck}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                isCompleted
                  ? `${colors.done} border-transparent`
                  : `bg-white border-slate-300 hover:border-slate-400 hover:ring-2 ${colors.ring}`
              } ${bursting ? 'animate-check-pop' : ''}`}
              aria-label={
                isCompleted ? 'Отменить выполнение' : 'Отметить выполненным'
              }
            >
              {isCompleted && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="white"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {/* Confetti burst */}
            {bursting && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ overflow: 'visible' }}
                aria-hidden
              >
                {CONFETTI_COLORS.map((color, i) => (
                  <span
                    key={i}
                    className={`absolute w-2 h-2 rounded-full ${color}`}
                    style={{
                      top: '50%',
                      left: '50%',
                      animation: `confetti-burst-${i} 0.65s ease-out forwards`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

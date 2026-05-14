import type { Habit } from '@/types/habit'

const COLOR_CLASSES: Record<string, { card: string; badge: string }> = {
  blue:   { card: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700'   },
  green:  { card: 'bg-green-50 border-green-200', badge: 'bg-green-100 text-green-700' },
  purple: { card: 'bg-purple-50 border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  orange: { card: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  pink:   { card: 'bg-pink-50 border-pink-200',   badge: 'bg-pink-100 text-pink-700'   },
  gray:   { card: 'bg-slate-50 border-slate-200', badge: 'bg-slate-100 text-slate-600' },
}

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface Props {
  habit: Habit
}

export default function HabitCard({ habit }: Props) {
  const colors = COLOR_CLASSES[habit.color] ?? COLOR_CLASSES.gray

  return (
    <div className={`rounded-2xl border p-4 ${colors.card} transition-shadow hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5 shrink-0">{habit.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{habit.name}</p>
          {habit.description && (
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{habit.description}</p>
          )}
        </div>
      </div>

      <div className="mt-3">
        {habit.frequency === 'daily' ? (
          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
            Ежедневно
          </span>
        ) : (
          <div className="flex gap-1 flex-wrap">
            {(habit.days_of_week ?? []).map(day => (
              <span
                key={day}
                className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${colors.badge}`}
              >
                {DAYS_SHORT[day]}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

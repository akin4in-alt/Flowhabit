'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Habit } from '@/types/habit'

const ICONS = ['🌟', '🔥', '💪', '🧘', '📚', '🎯', '🏃', '💧', '🥗', '😴', '🎨', '🌿']

const COLORS = [
  { id: 'blue',   label: 'Синий',      bg: 'bg-blue-400'   },
  { id: 'green',  label: 'Зелёный',    bg: 'bg-green-400'  },
  { id: 'purple', label: 'Фиолетовый', bg: 'bg-purple-400' },
  { id: 'orange', label: 'Оранжевый',  bg: 'bg-orange-400' },
  { id: 'pink',   label: 'Розовый',    bg: 'bg-pink-400'   },
  { id: 'gray',   label: 'Серый',      bg: 'bg-slate-400'  },
]

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface Props {
  onClose: () => void
  /** Called when a new habit is created */
  onAdded?: (habit: Habit) => void
  /** Called when an existing habit is updated */
  onUpdated?: (habit: Habit) => void
  /** When provided the modal opens in edit mode */
  habitToEdit?: Habit
}

export default function AddHabitModal({
  onClose,
  onAdded,
  onUpdated,
  habitToEdit,
}: Props) {
  const isEdit = !!habitToEdit

  const [name, setName] = useState(habitToEdit?.name ?? '')
  const [description, setDescription] = useState(habitToEdit?.description ?? '')
  const [icon, setIcon] = useState(habitToEdit?.icon ?? ICONS[0])
  const [color, setColor] = useState(habitToEdit?.color ?? 'blue')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>(
    habitToEdit?.frequency ?? 'daily'
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(
    habitToEdit?.days_of_week ?? []
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function toggleDay(index: number) {
    setSelectedDays(prev =>
      prev.includes(index) ? prev.filter(d => d !== index) : [...prev, index]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Введите название привычки')
      return
    }
    if (frequency === 'weekly' && selectedDays.length === 0) {
      setError('Выберите хотя бы один день недели')
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      icon,
      color,
      frequency,
      days_of_week: frequency === 'weekly' ? [...selectedDays].sort() : null,
    }

    setLoading(true)
    try {
      if (isEdit && habitToEdit) {
        // ── Edit mode ────────────────────────────────
        const { data, error: dbError } = await supabase
          .from('habits')
          .update(payload)
          .eq('id', habitToEdit.id)
          .select()
          .single()

        if (dbError) { setError(dbError.message); return }
        onUpdated?.(data as Habit)
      } else {
        // ── Create mode ──────────────────────────────
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) { setError('Вы не авторизованы'); return }

        const { data, error: dbError } = await supabase
          .from('habits')
          .insert({ user_id: user.id, ...payload })
          .select()
          .single()

        if (dbError) { setError(dbError.message); return }
        onAdded?.(data as Habit)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centering container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="animate-modal-in w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              {isEdit ? 'Редактировать привычку' : 'Новая привычка'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Закрыть"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M12 4L4 12M4 4l8 8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Например: Утренняя зарядка"
                maxLength={60}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Описание
                <span className="ml-1.5 text-slate-400 font-normal text-xs">необязательно</span>
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Краткое описание привычки"
                rows={2}
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition resize-none"
                disabled={loading}
              />
            </div>

            {/* Icon grid */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Иконка
              </label>
              <div className="grid grid-cols-6 gap-2">
                {ICONS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    disabled={loading}
                    className={`h-10 text-xl rounded-xl transition-all duration-150 ${
                      icon === emoji
                        ? 'bg-slate-900 ring-2 ring-slate-900 ring-offset-1 scale-105'
                        : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color swatches */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Цвет карточки
              </label>
              <div className="flex gap-3">
                {COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    title={c.label}
                    disabled={loading}
                    className={`w-8 h-8 rounded-full ${c.bg} transition-all duration-150 ${
                      color === c.id
                        ? 'ring-2 ring-offset-2 ring-slate-600 scale-110'
                        : 'hover:scale-105'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Частота
              </label>
              <div className="flex rounded-lg bg-slate-100 p-1 mb-3">
                <button
                  type="button"
                  onClick={() => setFrequency('daily')}
                  disabled={loading}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    frequency === 'daily'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Ежедневно
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency('weekly')}
                  disabled={loading}
                  className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    frequency === 'weekly'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  По дням недели
                </button>
              </div>

              {frequency === 'weekly' && (
                <div className="flex gap-1.5">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(index)}
                      disabled={loading}
                      className={`flex-1 h-9 text-xs font-medium rounded-lg transition-colors ${
                        selectedDays.includes(index)
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 px-4 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-700 disabled:bg-slate-400 transition-colors"
              >
                {loading
                  ? isEdit ? 'Сохраняем...' : 'Создаём...'
                  : isEdit ? 'Сохранить изменения' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

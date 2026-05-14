'use client'

import { useEffect, useState } from 'react'

interface Props {
  habitName: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

export default function DeleteConfirmModal({
  habitName,
  onConfirm,
  onCancel,
}: Props) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onCancel}
      >
        <div
          className="animate-modal-in w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="w-11 h-11 bg-red-100 rounded-2xl flex items-center justify-center mb-4">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="#dc2626"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M3 5h14M8 5V3.5A.5.5 0 018.5 3h3a.5.5 0 01.5.5V5M5 5l.9 11.5a.5.5 0 00.5.5h7.2a.5.5 0 00.5-.5L15 5" />
              <path d="M8.5 9v5M11.5 9v5" />
            </svg>
          </div>

          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Удалить привычку?
          </h3>
          <p className="text-sm text-slate-500 mb-5">
            <span className="font-medium text-slate-700">«{habitName}»</span>{' '}
            будет удалена навсегда вместе со всей историей выполнений. Это
            действие нельзя отменить.
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 py-2 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 disabled:bg-red-400 transition-colors"
            >
              {loading ? 'Удаляем...' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

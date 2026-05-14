'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onEdit: () => void
  onArchive: () => void
  onDelete: () => void
}

export default function HabitMenu({ onEdit, onArchive, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  function pick(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={e => {
          e.stopPropagation()
          setOpen(prev => !prev)
        }}
        aria-label="Опции привычки"
        aria-expanded={open}
        className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-black/8 transition-colors"
      >
        {/* Horizontal three-dot (meatballs) */}
        <svg width="14" height="4" viewBox="0 0 14 4" fill="currentColor" aria-hidden>
          <circle cx="1.75" cy="2" r="1.5" />
          <circle cx="7"    cy="2" r="1.5" />
          <circle cx="12.25" cy="2" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="animate-modal-in absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30">
          <MenuItem
            onClick={() => pick(onEdit)}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" />
              </svg>
            }
            label="Редактировать"
          />
          <MenuItem
            onClick={() => pick(onArchive)}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="12" height="2.5" rx="0.75" />
                <path d="M2.5 5.5V12a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V5.5" />
                <path d="M5.5 8h3" />
              </svg>
            }
            label="Архивировать"
          />
          <div className="border-t border-slate-100 my-1" />
          <MenuItem
            onClick={() => pick(onDelete)}
            icon={
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6v4M8.5 6v4M3 3.5l.7 8a.5.5 0 00.5.5h5.6a.5.5 0 00.5-.5l.7-8" />
              </svg>
            }
            label="Удалить"
            danger
          />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  onClick,
  icon,
  label,
  danger = false,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

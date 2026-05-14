'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <span className="font-semibold text-slate-900 text-sm">HabitFlow</span>
          <nav className="flex gap-0.5">
            <Link
              href="/dashboard"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/dashboard')
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Привычки
            </Link>
            <Link
              href="/stats"
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/stats')
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Статистика
            </Link>
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          Выйти
        </button>
      </div>
    </header>
  )
}

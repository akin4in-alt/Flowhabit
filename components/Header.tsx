'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth')
    router.refresh()
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-slate-900">HabitFlow</span>
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

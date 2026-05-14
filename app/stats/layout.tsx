import Header from '@/components/Header'

export const metadata = { title: 'Статистика — HabitFlow' }

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
    </>
  )
}

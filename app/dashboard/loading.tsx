export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">

        {/* Greeting skeleton */}
        <div className="mb-8">
          <div className="h-7 w-52 bg-slate-200 rounded-lg mb-2" />
          <div className="h-4 w-36 bg-slate-200 rounded-md" />
        </div>

        {/* Progress card skeleton */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-28 bg-slate-200 rounded" />
            <div className="h-4 w-20 bg-slate-200 rounded" />
          </div>
          <div className="h-2.5 bg-slate-200 rounded-full" />
        </div>

        {/* Section header skeleton */}
        <div className="flex items-center justify-between mb-5">
          <div className="h-5 w-44 bg-slate-200 rounded" />
          <div className="h-9 w-36 bg-slate-200 rounded-xl" />
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-200 h-[88px]" />
          ))}
        </div>

      </div>
    </div>
  )
}

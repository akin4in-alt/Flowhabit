export default function StatsLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10 animate-pulse">
        <div className="h-6 w-32 bg-slate-200 rounded-lg mb-6" />

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 rounded-2xl" />
          ))}
        </div>

        {/* Heatmap */}
        <div className="h-44 bg-slate-200 rounded-2xl mb-8" />

        {/* Bar chart */}
        <div className="h-48 bg-slate-200 rounded-2xl mb-8" />

        {/* Habit cards */}
        <div className="h-5 w-40 bg-slate-200 rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

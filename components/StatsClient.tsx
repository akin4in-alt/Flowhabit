'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { Habit } from '@/types/habit'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HabitStat {
  habitId: string
  streak: number
  completionPct: number
  last7: { date: string; completed: boolean }[]
}

interface Props {
  habits: Habit[]
  dayCompletions: Record<string, number>
  overallCurrentStreak: number
  overallBestStreak: number
  overallCompletionPct30: number
  habitStats: HabitStat[]
  today: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RU_MONTHS_SHORT = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
]

const DOW_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
// Only render text for Mon / Wed / Fri / Sun to keep it uncluttered
const DOW_VISIBLE = new Set([0, 2, 4, 6])

const CELL_PX = 13
const GAP_PX = 3

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatShortDate(iso: string): string {
  const parts = iso.split('-')
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return `${d} ${RU_MONTHS_SHORT[m]}`
}

function heatColor(count: number): string {
  if (count === 0) return '#f1f5f9'   // slate-100
  if (count === 1) return '#bbf7d0'   // green-200
  if (count === 2) return '#4ade80'   // green-400
  if (count === 3) return '#16a34a'   // green-600
  return '#14532d'                     // green-900
}

// ─── Heatmap data builder ─────────────────────────────────────────────────────

type HeatCell = null | { date: string; count: number }

function buildHeatmapData(
  dayCompletions: Record<string, number>,
  today: string,
  numDays: number,
) {
  const end = new Date(`${today}T12:00:00Z`)
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - numDays + 1)

  // Leading padding so the grid starts on Monday
  const startDow = start.getUTCDay() === 0 ? 6 : start.getUTCDay() - 1

  const cells: HeatCell[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)

  const cursor = new Date(start)
  while (cursor <= end) {
    const date = cursor.toISOString().split('T')[0]
    cells.push({ date, count: dayCompletions[date] ?? 0 })
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }

  // Trailing padding to complete the last week column
  while (cells.length % 7 !== 0) cells.push(null)

  const numWeeks = cells.length / 7

  // Month labels: one per calendar month, placed at the week where it starts
  const monthLabels: { col: number; label: string }[] = []
  let lastMonth = -1
  for (let col = 0; col < numWeeks; col++) {
    const cell = cells[col * 7]
    if (cell) {
      const month = new Date(`${cell.date}T12:00:00Z`).getUTCMonth()
      if (month !== lastMonth) {
        monthLabels.push({ col, label: RU_MONTHS_SHORT[month] })
        lastMonth = month
      }
    }
  }

  return { cells, numWeeks, monthLabels }
}

// ─── Bar chart data builder ───────────────────────────────────────────────────

function buildBarData(dayCompletions: Record<string, number>, today: string, days: number) {
  const base = new Date(`${today}T12:00:00Z`)
  return Array.from({ length: days }, (_, idx) => {
    // idx 0 = oldest, idx (days-1) = today
    const dt = new Date(base)
    dt.setUTCDate(dt.getUTCDate() - (days - 1 - idx))
    const date = dt.toISOString().split('T')[0]
    const parts = date.split('-')
    const m = parseInt(parts[1], 10) - 1
    const d = parseInt(parts[2], 10)
    // Show a label every 5 bars
    const label = idx % 5 === 0 ? `${d} ${RU_MONTHS_SHORT[m]}` : ''
    return { date, label, count: dayCompletions[date] ?? 0 }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  unit,
  sub,
}: {
  label: string
  value: number
  unit: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 mb-1 leading-tight">{label}</p>
      <p className="text-3xl font-bold text-slate-900 leading-none">
        {value}
        <span className="text-base font-normal text-slate-500 ml-1">{unit}</span>
      </p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  )
}

// ─── Heatmap ──────────────────────────────────────────────────────────────────

function HeatmapCalendar({
  dayCompletions,
  today,
}: {
  dayCompletions: Record<string, number>
  today: string
}) {
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    date: string
    count: number
  } | null>(null)

  const { cells, numWeeks, monthLabels } = buildHeatmapData(dayCompletions, today, 90)
  const gridWidth = numWeeks * (CELL_PX + GAP_PX) - GAP_PX
  const gridHeight = 7 * (CELL_PX + GAP_PX) - GAP_PX

  return (
    <div className="overflow-x-auto pb-2">
      {/* Fixed tooltip — position: fixed is not clipped by overflow ancestors */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 44,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="font-medium">{formatShortDate(tooltip.date)}</span>
          <span className="mx-1.5 opacity-40">·</span>
          <span>
            {tooltip.count > 0
              ? `${tooltip.count} ${tooltip.count === 1 ? 'привычка' : tooltip.count < 5 ? 'привычки' : 'привычек'}`
              : 'нет активности'}
          </span>
        </div>
      )}

      <div className="inline-flex gap-2">
        {/* Day-of-week labels */}
        <div
          className="flex flex-col justify-between"
          style={{ height: gridHeight, paddingTop: 20 /* month label row height */ }}
        >
          {DOW_LABELS.map((lbl, i) => (
            <span
              key={lbl}
              className="text-[10px] text-slate-400 leading-none select-none"
              style={{
                visibility: DOW_VISIBLE.has(i) ? 'visible' : 'hidden',
                height: CELL_PX,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {lbl}
            </span>
          ))}
        </div>

        <div>
          {/* Month labels row */}
          <div className="relative h-5 mb-0.5" style={{ width: gridWidth }}>
            {monthLabels.map(({ col, label }) => (
              <span
                key={col}
                className="absolute text-[11px] text-slate-500 select-none"
                style={{ left: col * (CELL_PX + GAP_PX) }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Cell grid — grid-auto-flow: column fills column-by-column (Mon→Sun per column) */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
              gridAutoFlow: 'column',
              gap: GAP_PX,
            }}
          >
            {cells.map((cell, i) => (
              <div
                key={i}
                style={{
                  width: CELL_PX,
                  height: CELL_PX,
                  borderRadius: 2,
                  backgroundColor: cell ? heatColor(cell.count) : 'transparent',
                  outline:
                    cell?.date === today ? '1.5px solid #64748b' : 'none',
                  outlineOffset: '1px',
                  cursor: cell ? 'default' : undefined,
                }}
                onMouseEnter={
                  cell
                    ? e => {
                        const r = (
                          e.currentTarget as HTMLElement
                        ).getBoundingClientRect()
                        setTooltip({
                          x: r.left + r.width / 2,
                          y: r.top,
                          date: cell.date,
                          count: cell.count,
                        })
                      }
                    : undefined
                }
                onMouseLeave={() => setTooltip(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Color legend */}
      <div className="flex items-center gap-1.5 mt-3 ml-7">
        <span className="text-[11px] text-slate-400">меньше</span>
        {[0, 1, 2, 3, 4].map(n => (
          <div
            key={n}
            style={{
              width: 11,
              height: 11,
              borderRadius: 2,
              backgroundColor: heatColor(n),
              border: '1px solid #e2e8f0',
            }}
          />
        ))}
        <span className="text-[11px] text-slate-400">больше</span>
      </div>
    </div>
  )
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

type BarEntry = { date: string; label: string; count: number }

function renderBarTooltip(active: boolean | undefined, payload: readonly { payload?: BarEntry }[] | undefined) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload
  if (!entry) return null
  return (
    <div className="bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none">
      <span className="font-medium">{formatShortDate(entry.date)}</span>
      <span className="mx-1.5 opacity-40">·</span>
      <span>
        {entry.count}{' '}
        {entry.count === 1 ? 'привычка' : entry.count < 5 ? 'привычки' : 'привычек'}
      </span>
    </div>
  )
}

function ActivityChart({
  dayCompletions,
  today,
}: {
  dayCompletions: Record<string, number>
  today: string
}) {
  const data = buildBarData(dayCompletions, today, 30)

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barCategoryGap="18%">
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={({ active, payload }) =>
            renderBarTooltip(active, payload as readonly { payload?: BarEntry }[] | undefined)
          }
          cursor={{ fill: '#f8fafc' }}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.date === today ? '#16a34a' : '#0f172a'}
              opacity={entry.count === 0 ? 0.15 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Per-habit card ───────────────────────────────────────────────────────────

const COLOR_DOT: Record<string, string> = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  pink: '#ec4899',
  gray: '#64748b',
}

function MiniWeekDots({
  last7,
  color,
}: {
  last7: { completed: boolean }[]
  color: string
}) {
  const fill = COLOR_DOT[color] ?? COLOR_DOT.gray
  return (
    <div className="flex gap-1.5">
      {last7.map(({ completed }, i) => (
        <div
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: completed ? fill : 'transparent',
            border: `2px solid ${completed ? fill : '#e2e8f0'}`,
            transition: 'background-color 0.15s',
          }}
        />
      ))}
    </div>
  )
}

function HabitStatCard({ habit, stats }: { habit: Habit; stats: HabitStat }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{habit.icon}</span>
          <p className="text-sm font-medium text-slate-900 truncate">{habit.name}</p>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-xl font-bold text-slate-900 leading-none">
            {stats.completionPct}%
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">30 дней</p>
        </div>
      </div>

      <MiniWeekDots last7={stats.last7} color={habit.color} />

      <div className="flex items-center gap-1 mt-2.5">
        {stats.streak > 0 ? (
          <span className="text-xs text-slate-500">
            🔥 {stats.streak}{' '}
            {stats.streak === 1 ? 'день' : stats.streak < 5 ? 'дня' : 'дней'} подряд
          </span>
        ) : (
          <span className="text-xs text-slate-400">нет текущей серии</span>
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyStats() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl mb-4 select-none">
        📊
      </div>
      <p className="text-slate-600 font-medium mb-1">Нет данных для отображения</p>
      <p className="text-sm text-slate-400">Создайте привычки и начните их выполнять</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function StatsClient({
  habits,
  dayCompletions,
  overallCurrentStreak,
  overallBestStreak,
  overallCompletionPct30,
  habitStats,
  today,
}: Props) {
  if (habits.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 max-w-4xl mx-auto">
        <EmptyStats />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Статистика</h1>

        {/* ── Overall stat cards ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Текущая серия"
            value={overallCurrentStreak}
            unit="дн."
            sub="активных дней подряд"
          />
          <StatCard
            label="Лучшая серия"
            value={overallBestStreak}
            unit="дн."
            sub="за 3 месяца"
          />
          <StatCard
            label="Выполнение"
            value={overallCompletionPct30}
            unit="%"
            sub="за последние 30 дней"
          />
        </div>

        {/* ── Activity heatmap ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Активность за 3 месяца
          </h2>
          <HeatmapCalendar dayCompletions={dayCompletions} today={today} />
        </div>

        {/* ── Daily bar chart ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-8">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Привычек выполнено в день (последние 30 дней)
          </h2>
          <ActivityChart dayCompletions={dayCompletions} today={today} />
        </div>

        {/* ── Per-habit breakdown ──────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            По каждой привычке
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {habits.map(habit => {
              const stats = habitStats.find(s => s.habitId === habit.id)
              if (!stats) return null
              return <HabitStatCard key={habit.id} habit={habit} stats={stats} />
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

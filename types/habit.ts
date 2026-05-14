export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  icon: string
  color: string
  frequency: 'daily' | 'weekly'
  days_of_week: number[] | null
  archived: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  created_at: string
}

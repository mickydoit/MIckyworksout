import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

export const PLAN = {
  startDate: '2026-06-22',
  targetDate: '2026-09-20',
  startWeight: 93,
  targetWeight: 88,
  calorieTarget: 2100,
  proteinTarget: 155,
  stepsTarget: 9000,
  totalWeeks: 13,
}

export const EXERCISES = [
  { id: 'squat',     name: 'Squat',     note: 'Goblet squat or leg press',         icon: '🏋️' },
  { id: 'hinge',     name: 'Hinge',     note: 'Romanian deadlift or hip thrust',    icon: '🔄' },
  { id: 'push',      name: 'Push',      note: 'Dumbbell bench press or push-ups',   icon: '💪' },
  { id: 'pull',      name: 'Pull',      note: 'Lat pulldown or dumbbell row',       icon: '🔽' },
  { id: 'shoulders', name: 'Shoulders', note: 'Dumbbell shoulder press',            icon: '🏔️' },
  { id: 'core',      name: 'Core',      note: 'Plank + dead bug',                   icon: '⚡' },
]

// Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6 Sun=0
export const SCHEDULE = {
  1: 'strength',
  2: 'cardio',
  3: 'strength',
  4: 'rest',
  5: 'strength',
  6: 'cardio',
  0: 'rest',
}

const StoreContext = createContext(null)
const LS_KEY = 'fittrack_v1'

const defaults = {
  weightLogs: [],
  nutritionLogs: [],
  workoutLogs: [],
  stepsLogs: [],
}

// Merge local + remote arrays keyed by date — remote wins on conflicts
function mergeByDate(local, remote) {
  const map = {}
  for (const item of local) map[item.date] = item
  for (const item of remote) map[item.date] = item
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date))
}

// Strip undefined/null fields before sending to Supabase
function cleanRow(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null))
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      return raw ? { ...defaults, ...JSON.parse(raw) } : defaults
    } catch { return defaults }
  })

  // Persist locally on every change
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  }, [data])

  // Pull from Supabase on mount and merge with local state
  useEffect(() => {
    async function syncDown() {
      try {
        const [w, n, wk, s] = await Promise.all([
          supabase.from('weight_logs').select('date, weight').order('date'),
          supabase.from('nutrition_logs').select('date, calories, protein').order('date'),
          supabase.from('workout_logs').select('date, type, completed, duration, activity').order('date'),
          supabase.from('steps_logs').select('date, steps').order('date'),
        ])
        if (w.error || n.error || wk.error || s.error) return
        setData(prev => ({
          weightLogs:    mergeByDate(prev.weightLogs,    w.data),
          nutritionLogs: mergeByDate(prev.nutritionLogs, n.data),
          workoutLogs:   mergeByDate(prev.workoutLogs,   wk.data),
          stepsLogs:     mergeByDate(prev.stepsLogs,     s.data),
        }))
      } catch (e) {
        console.warn('Supabase sync failed:', e)
      }
    }
    syncDown()
  }, [])

  async function pushToCloud(table, row) {
    try {
      const { error } = await supabase.from(table).upsert(cleanRow(row), { onConflict: 'date' })
      if (error) console.warn('Cloud push failed:', error.message)
    } catch (e) {
      console.warn('Cloud push failed:', e)
    }
  }

  function upsert(listKey, entry, table) {
    setData(prev => {
      const list = [...prev[listKey]]
      const i = list.findIndex(l => l.date === entry.date)
      if (i >= 0) list[i] = entry
      else { list.push(entry); list.sort((a, b) => a.date.localeCompare(b.date)) }
      return { ...prev, [listKey]: list }
    })
    pushToCloud(table, entry)
  }

  return (
    <StoreContext.Provider value={{
      data,
      logWeight:    (date, weight)            => upsert('weightLogs',    { date, weight },            'weight_logs'),
      logNutrition: (date, calories, protein) => upsert('nutritionLogs', { date, calories, protein }, 'nutrition_logs'),
      logWorkout:   (date, workout)           => upsert('workoutLogs',   { date, ...workout },         'workout_logs'),
      logSteps:     (date, steps)             => upsert('stepsLogs',     { date, steps },             'steps_logs'),
      clearLog: (type, date) => setData(prev => ({
        ...prev,
        [type]: prev[type].filter(l => l.date !== date)
      })),
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() { return useContext(StoreContext) }

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function dateLabel(dateStr) {
  const [y, m, d] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${+d} ${months[+m - 1]}`
}

export function weekNum(dateStr = todayStr()) {
  const d = new Date(dateStr)
  const s = new Date(PLAN.startDate)
  if (d < s) return 0
  return Math.min(Math.floor((d - s) / (7 * 86400000)) + 1, PLAN.totalWeeks)
}

export function getExpectedWeight(dateStr) {
  const d = new Date(dateStr)
  const s = new Date(PLAN.startDate)
  const e = new Date(PLAN.targetDate)
  if (d <= s) return PLAN.startWeight
  if (d >= e) return PLAN.targetWeight
  const ratio = (d - s) / (e - s)
  return +(PLAN.startWeight - (PLAN.startWeight - PLAN.targetWeight) * ratio).toFixed(2)
}

export function buildChartData(weightLogs) {
  const start  = new Date(PLAN.startDate)
  const end    = new Date(PLAN.targetDate)
  const today  = new Date()
  const limit  = today < end ? today : end
  const totalDays = Math.round((end - start) / 86400000)
  const result = []

  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    if (d > limit) break

    const ds = d.toISOString().split('T')[0]
    const log = weightLogs.find(l => l.date === ds)
    const expected = +(PLAN.startWeight - (PLAN.startWeight - PLAN.targetWeight) * (i / totalDays)).toFixed(2)

    result.push({
      label: d.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' }),
      date: ds,
      expected,
      actual: log ? log.weight : null,
    })
  }

  return result
}

export function weeklyAverages(weightLogs) {
  const weeks = {}
  for (const log of weightLogs) {
    const wk = weekNum(log.date)
    if (wk < 1) continue
    if (!weeks[wk]) weeks[wk] = []
    weeks[wk].push(log.weight)
  }
  return Object.entries(weeks).map(([wk, ws]) => ({
    week: +wk,
    avg: +(ws.reduce((a, b) => a + b, 0) / ws.length).toFixed(1),
  }))
}

export function sevenDayAvg(weightLogs, dateStr) {
  const d = new Date(dateStr)
  const recent = weightLogs.filter(l => {
    const ld = new Date(l.date)
    return ld <= d && (d - ld) <= 6 * 86400000
  })
  if (recent.length < 2) return null
  return +(recent.reduce((s, l) => s + l.weight, 0) / recent.length).toFixed(1)
}

export function latestWeight(weightLogs) {
  if (!weightLogs.length) return null
  return [...weightLogs].sort((a, b) => b.date.localeCompare(a.date))[0].weight
}

export function projectedFinish(weightLogs) {
  if (weightLogs.length < 2) return null
  const sorted = [...weightLogs].sort((a, b) => a.date.localeCompare(b.date))
  const first = sorted[0]
  const last  = sorted[sorted.length - 1]
  const days  = (new Date(last.date) - new Date(first.date)) / 86400000
  if (days < 7) return null
  const ratePerDay = (first.weight - last.weight) / days
  if (ratePerDay <= 0) return null
  const kgLeft = last.weight - PLAN.targetWeight
  const daysLeft = Math.ceil(kgLeft / ratePerDay)
  const finish = new Date(last.date)
  finish.setDate(finish.getDate() + daysLeft)
  return finish.toISOString().split('T')[0]
}

export function getPreviousWorkout(workoutLogs, type = 'strength') {
  const today = todayStr()
  return [...workoutLogs]
    .filter(l => l.type === type && l.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null
}

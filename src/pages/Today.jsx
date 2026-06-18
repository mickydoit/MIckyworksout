import { Dumbbell, Wind, Coffee } from 'lucide-react'
import Ring from '../components/Ring'
import {
  useStore, PLAN, SCHEDULE,
  todayStr, weekNum, latestWeight, sevenDayAvg,
} from '../store'

// Mini bar chart for steps sparkline
function MiniBars({ values, color = 'var(--primary)', height = 28 }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const w = 5, gap = 3
  const totalW = values.length * (w + gap) - gap
  return (
    <svg width={totalW} height={height} style={{ display: 'block' }}>
      {values.map((v, i) => {
        const barH = Math.max(3, (v / max) * height)
        const isLast = i === values.length - 1
        return (
          <rect
            key={i}
            x={i * (w + gap)} y={height - barH}
            width={w} height={barH} rx={2}
            fill={color}
            opacity={isLast ? 1 : 0.35}
          />
        )
      })}
    </svg>
  )
}

const WORKOUT_META = {
  strength: { label: 'Strength Training',  Icon: Dumbbell, sub: '3 sets · 8–12 reps · 6 movements' },
  cardio:   { label: 'Zone 2 Cardio',      Icon: Wind,     sub: '25–35 min at conversational pace'  },
  rest:     { label: 'Rest & Recovery',    Icon: Coffee,   sub: 'Recovery · light walk is fine'     },
}

export default function Today({ onNavigate }) {
  const { data } = useStore()
  const today = todayStr()
  const now = new Date()
  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const plannedType = SCHEDULE[now.getDay()]
  const meta = WORKOUT_META[plannedType]

  const todayWeight    = data.weightLogs.find(l => l.date === today)
  const todayNutrition = data.nutritionLogs.find(l => l.date === today)
  const todaySteps     = data.stepsLogs.find(l => l.date === today)
  const todayWorkout   = data.workoutLogs.find(l => l.date === today)

  const currentWeight = todayWeight?.weight ?? latestWeight(data.weightLogs) ?? PLAN.startWeight
  const avg7          = sevenDayAvg(data.weightLogs, today)
  const lostKg        = Math.max(0, +(PLAN.startWeight - currentWeight).toFixed(1))
  const wk            = weekNum(today)

  const isPreStart  = now < new Date(PLAN.startDate)
  const daysToStart = Math.ceil((new Date(PLAN.startDate) - now) / 86400000)

  const calories = todayNutrition?.calories || 0
  const protein  = todayNutrition?.protein  || 0
  const steps    = todaySteps?.steps        || 0

  // Last 7 days of steps for sparkline
  const stepsHistory = (() => {
    const out = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const log = data.stepsLogs.find(l => l.date === ds)
      out.push(log?.steps || 0)
    }
    return out
  })()

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ paddingBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500, marginBottom: 4 }}>
          {greeting}, Michael
        </p>
        <h1 className="page-title">
          {now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
        </h1>
        <div style={{ marginTop: 10 }}>
          {isPreStart
            ? <span className="badge badge-primary">Plan starts in {daysToStart} day{daysToStart !== 1 ? 's' : ''} · 22 Jun</span>
            : wk > 0
              ? <span className="badge badge-primary">Week {wk} of {PLAN.totalWeeks}</span>
              : null
          }
        </div>
      </div>

      {/* ── Stats grid ── */}
      <div className="section">
        <div className="stat-grid">

          {/* Weight – full width */}
          <div className="stat-block" style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p className="stat-block-label">Weight</p>
                <p className="stat-block-value" style={{ fontSize: 52, letterSpacing: -3 }}>
                  {currentWeight.toFixed(1)}
                  <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: 0, color: 'var(--text-2)', marginLeft: 4 }}>kg</span>
                </p>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 6 }}>
                  {lostKg > 0 && (
                    <span className="stat-block-sub stat-block-accent">↓ {lostKg} kg lost</span>
                  )}
                  {avg7 && (
                    <span className="stat-block-sub">7-day avg {avg7} kg</span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--text-2)', marginBottom: 4 }}>Goal</p>
                <Ring value={lostKg} max={5} color="var(--primary)" size={64} stroke={6}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--primary)' }}>
                    {Math.round((lostKg / 5) * 100)}%
                  </span>
                </Ring>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>88 kg · 20 Sep</p>
              </div>
            </div>
            {/* Weight progress bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Start 93 kg</span>
                <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600 }}>{Math.round((lostKg / 5) * 100)}% to goal</span>
                <span style={{ fontSize: 11, color: 'var(--text-2)' }}>Goal 88 kg</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.min(100, (lostKg / 5) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Calories */}
          <div className="stat-block">
            <p className="stat-block-label">Calories</p>
            <p className="stat-block-value">
              {calories ? calories.toLocaleString() : '—'}
            </p>
            <p className="stat-block-sub">/ {PLAN.calorieTarget.toLocaleString()} kcal</p>
            <div style={{ marginTop: 12 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{
                  width: `${Math.min(100, (calories / PLAN.calorieTarget) * 100)}%`,
                  background: calories > PLAN.calorieTarget + 100 ? 'var(--red)' : 'var(--primary)',
                }} />
              </div>
            </div>
          </div>

          {/* Protein */}
          <div className="stat-block">
            <p className="stat-block-label">Protein</p>
            <p className="stat-block-value">
              {protein ? protein : '—'}
              {protein ? <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-2)' }}>g</span> : ''}
            </p>
            <p className="stat-block-sub">/ {PLAN.proteinTarget} g</p>
            <div style={{ marginTop: 12 }}>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.min(100, (protein / PLAN.proteinTarget) * 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Steps – with sparkline */}
          <div className="stat-block">
            <p className="stat-block-label">Steps</p>
            <p className="stat-block-value" style={{ fontSize: 30 }}>
              {steps ? steps.toLocaleString() : '—'}
            </p>
            <p className="stat-block-sub">/ {PLAN.stepsTarget.toLocaleString()}</p>
            <div style={{ marginTop: 12 }}>
              {stepsHistory.some(v => v > 0)
                ? <MiniBars values={stepsHistory} />
                : (
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${Math.min(100, (steps / PLAN.stepsTarget) * 100)}%` }} />
                  </div>
                )
              }
            </div>
          </div>

          {/* Today's workout */}
          <div
            className="stat-block"
            onClick={() => onNavigate('log')}
            style={{ cursor: 'pointer' }}
          >
            <p className="stat-block-label">Today's Training</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, marginTop: 4 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--primary-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <meta.Icon size={20} color="var(--primary)" strokeWidth={2} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>{meta.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>{meta.sub.split(' · ')[0]}</p>
              </div>
            </div>
            {todayWorkout
              ? <span className="badge badge-green">Done ✓</span>
              : <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Tap to log →</span>
            }
          </div>

        </div>
      </div>

      {/* ── Pre-start banner ── */}
      {isPreStart && (
        <div className="section">
          <div className="stat-block" style={{ border: '1px solid var(--primary)', background: 'var(--primary-dim)' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>
              Plan kicks off 22 June
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Start logging now to build the habit. A baseline morning weight before the 22nd will anchor your chart.
            </p>
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}

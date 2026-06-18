import { useState } from 'react'
import { Scale, Flame, Footprints, Dumbbell, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import WorkoutLogger from '../components/WorkoutLogger'
import { useStore, PLAN, todayStr, dateLabel } from '../store'

function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function Saved() {
  return (
    <span className="badge badge-green"><Check size={9} /> Saved</span>
  )
}

function SectionLabel({ icon: Icon, label, accent, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: 'var(--primary-dim)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={accent || 'var(--primary)'} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--text-2)' }}>
          {label}
        </span>
      </div>
      {right}
    </div>
  )
}

function BigInput({ value, onChange, onEnter, placeholder, unit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <input
        type="number" inputMode="decimal"
        className="input"
        style={{ flex: 1, fontSize: 32, fontWeight: 800, textAlign: 'center', letterSpacing: -1.5, padding: '14px' }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onEnter?.()}
      />
      {unit && <span style={{ fontSize: 15, color: 'var(--text-2)', fontWeight: 500, flexShrink: 0 }}>{unit}</span>}
    </div>
  )
}

export default function Log() {
  const { data, logWeight, logNutrition, logSteps, logWorkout } = useStore()
  const [date, setDate] = useState(todayStr())
  const [saved, setSaved] = useState({})
  const [weight,   setWeight]   = useState('')
  const [calories, setCalories] = useState('')
  const [protein,  setProtein]  = useState('')
  const [steps,    setSteps]    = useState('')

  const isToday = date === todayStr()
  const todayW  = data.weightLogs.find(l => l.date === date)
  const todayN  = data.nutritionLogs.find(l => l.date === date)
  const todayS  = data.stepsLogs.find(l => l.date === date)
  const todayWk = data.workoutLogs.find(l => l.date === date)

  function flash(k) {
    setSaved(m => ({ ...m, [k]: true }))
    setTimeout(() => setSaved(m => ({ ...m, [k]: false })), 2200)
  }

  function saveWeight() {
    if (!weight) return; logWeight(date, +weight); setWeight(''); flash('w')
  }
  function saveNutrition() {
    if (!calories && !protein) return
    const prev = data.nutritionLogs.find(l => l.date === date)
    logNutrition(date, +calories || prev?.calories || 0, +protein || prev?.protein || 0)
    setCalories(''); setProtein(''); flash('n')
  }
  function saveSteps() {
    if (!steps) return; logSteps(date, +steps); setSteps(''); flash('s')
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="page-header" style={{ paddingBottom: 20 }}>
        <h1 className="page-title">Log</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setDate(d => addDays(d, -1))}
            style={{ background: 'var(--bg-inset)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{
            flex: 1, textAlign: 'center',
            fontSize: 14, fontWeight: 700,
            color: isToday ? 'var(--primary)' : 'var(--text-1)',
            background: 'var(--bg-inset)', borderRadius: 10, padding: '8px 0',
          }}>
            {isToday ? 'Today' : dateLabel(date)}
          </span>
          <button
            onClick={() => setDate(d => addDays(d, 1))}
            disabled={isToday}
            style={{ background: 'var(--bg-inset)', border: 'none', borderRadius: 8, padding: '7px 10px', cursor: isToday ? 'default' : 'pointer', color: isToday ? 'var(--text-3)' : 'var(--primary)', display: 'flex' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* ── Weight ── */}
      <div className="section">
        <SectionLabel icon={Scale} label="Weight" right={saved.w && <Saved />} />
        <div className="card">
          {todayW && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--sep)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Logged today</span>
              <span style={{ fontSize: 24, fontWeight: 800 }}>{todayW.weight} kg</span>
            </div>
          )}
          <BigInput
            value={weight} onChange={setWeight} onEnter={saveWeight}
            placeholder={todayW ? String(todayW.weight) : '93.0'} unit="kg"
          />
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={saveWeight}>
            Save Weight
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-2)', textAlign: 'center', marginTop: 8 }}>
            After bathroom · before food · same time daily
          </p>
        </div>
      </div>

      {/* ── Nutrition ── */}
      <div className="section">
        <SectionLabel icon={Flame} label="Nutrition" right={saved.n && <Saved />} />
        <div className="card">
          {todayN && (
            <div style={{ display: 'flex', gap: 0, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--sep)' }}>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Calories</p>
                <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{todayN.calories.toLocaleString()}</p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>/ {PLAN.calorieTarget.toLocaleString()}</p>
              </div>
              <div style={{ width: 1, background: 'var(--sep)', margin: '0 4px' }} />
              <div style={{ flex: 1, textAlign: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Protein</p>
                <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{todayN.protein}<span style={{ fontSize: 16 }}>g</span></p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 2 }}>/ {PLAN.proteinTarget}g</p>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 7 }}>
                Calories today
              </label>
              <BigInput value={calories} onChange={setCalories} placeholder={todayN ? String(todayN.calories) : '2100'} unit={`/ ${PLAN.calorieTarget}`} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 7 }}>
                Protein (grams)
              </label>
              <BigInput value={protein} onChange={setProtein} placeholder={todayN ? String(todayN.protein) : '155'} unit={`/ ${PLAN.proteinTarget}g`} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={saveNutrition}>
            Save Nutrition
          </button>
        </div>
      </div>

      {/* ── Steps ── */}
      <div className="section">
        <SectionLabel icon={Footprints} label="Steps" right={saved.s && <Saved />} />
        <div className="card">
          {todayS && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid var(--sep)' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Logged today</span>
              <span style={{ fontSize: 24, fontWeight: 800 }}>{todayS.steps.toLocaleString()}</span>
            </div>
          )}
          <BigInput value={steps} onChange={setSteps} onEnter={saveSteps}
            placeholder={todayS ? String(todayS.steps) : '9000'} unit="steps"
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 10, marginBottom: 12 }}>
            {[6000, 7500, 9000, 10000, 12000].map(n => (
              <button
                key={n}
                onClick={() => setSteps(String(n))}
                style={{
                  flex: 1, background: 'var(--bg-inset)', border: 'none',
                  borderRadius: 8, padding: '8px 2px',
                  fontSize: 12, fontWeight: 700, color: steps == n ? 'var(--primary)' : 'var(--text-2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  outline: steps == n ? '2px solid var(--primary)' : 'none',
                }}
              >
                {n >= 1000 ? `${n/1000}k` : n}
              </button>
            ))}
          </div>
          <button className="btn btn-primary" onClick={saveSteps}>Save Steps</button>
        </div>
      </div>

      {/* ── Workout ── */}
      <div className="section">
        <SectionLabel icon={Dumbbell} label="Workout" right={todayWk && <span className="badge badge-green">{todayWk.type === 'strength' ? '💪 Strength' : todayWk.type === 'cardio' ? '🏃 Zone 2' : '😴 Rest'}</span>} />
        <div className="card">
          {todayWk ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 40 }}>{todayWk.type === 'strength' ? '💪' : todayWk.type === 'cardio' ? '🏃' : '😴'}</p>
              <p style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
                {todayWk.type === 'strength' ? 'Strength Complete!' : todayWk.type === 'cardio' ? `Zone 2 · ${todayWk.duration ?? '—'} min` : 'Rest Day'}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>Logged for {dateLabel(date)}</p>
            </div>
          ) : (
            <WorkoutLogger onSave={w => { logWorkout(date, w); flash('wk') }} />
          )}
        </div>
      </div>
    </div>
  )
}

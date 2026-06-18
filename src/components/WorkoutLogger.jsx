import { useState } from 'react'
import { ChevronDown, ChevronUp, ArrowUp } from 'lucide-react'
import { EXERCISES, getPreviousWorkout, useStore, todayStr } from '../store'

const SETS = 3

function ExerciseRow({ ex, prevEx }) {
  const [open, setOpen] = useState(false)
  const [weight, setWeight] = useState(prevEx?.weight ?? '')
  const [sets, setSets] = useState([false, false, false])
  const [reps, setReps] = useState(prevEx?.reps ?? '')

  const doneCount = sets.filter(Boolean).length
  const allDone = sets.every(Boolean)
  const improved = weight && prevEx?.weight && +weight > +prevEx.weight

  return (
    <div className="exercise-row">
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>{ex.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>{ex.name}</span>
              {improved && <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 700 }}>↑ PR</span>}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{ex.note}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {/* Set dots summary */}
            <div style={{ display: 'flex', gap: 3 }}>
              {sets.map((done, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: done ? 'var(--orange)' : 'var(--sep)',
                }} />
              ))}
            </div>
            {allDone && <span style={{ fontSize: 12, color: 'var(--green)', fontWeight: 600 }}>✓</span>}
            {open ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
          </div>
        </div>
      </button>

      {open && (
        <div style={{ marginTop: 12, paddingLeft: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Previous session hint */}
          {prevEx && (
            <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg-inset)', borderRadius: 8, padding: '6px 10px' }}>
              Last session: {prevEx.reps} reps @ {prevEx.weight} kg
              {weight && +weight > +prevEx.weight && (
                <span style={{ color: 'var(--green)', fontWeight: 600, marginLeft: 6 }}>↑ Beat it!</span>
              )}
            </div>
          )}

          {/* Weight + reps inputs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>Weight (kg)</p>
              <input
                type="number" inputMode="decimal"
                className="input" style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', padding: '10px' }}
                placeholder={prevEx?.weight ?? '—'}
                value={weight}
                onChange={e => setWeight(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 4 }}>Reps</p>
              <input
                type="number" inputMode="numeric"
                className="input" style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', padding: '10px' }}
                placeholder={prevEx?.reps ?? '8–12'}
                value={reps}
                onChange={e => setReps(e.target.value)}
              />
            </div>
          </div>

          {/* Set checkboxes */}
          <div>
            <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 6 }}>Sets completed</p>
            <div style={{ display: 'flex', gap: 8 }}>
              {sets.map((done, i) => (
                <button
                  key={i}
                  className={`set-dot ${done ? 'done' : ''}`}
                  onClick={() => setSets(s => s.map((v, j) => j === i ? !v : v))}
                >
                  {done ? '✓' : i + 1}
                </button>
              ))}
              <span style={{ fontSize: 12, color: 'var(--text-2)', alignSelf: 'center', marginLeft: 4 }}>
                {doneCount}/{SETS} sets
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CardioLogger({ onSave }) {
  const [duration, setDuration] = useState('')
  const [activity, setActivity] = useState('walk')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <p className="section-label">Activity Type</p>
        <div className="toggle-group">
          {['walk', 'bike', 'jog'].map(a => (
            <button key={a} className={`toggle-item ${activity === a ? 'active' : ''}`} onClick={() => setActivity(a)}>
              {a === 'walk' ? '🚶 Walk' : a === 'bike' ? '🚴 Bike' : '🏃 Jog'}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="section-label">Duration (minutes)</p>
        <input
          type="number" inputMode="numeric"
          className="input" style={{ fontSize: 28, fontWeight: 700, textAlign: 'center' }}
          placeholder="30"
          value={duration}
          onChange={e => setDuration(e.target.value)}
        />
        <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center', marginTop: 6 }}>
          Target: 25–35 min at conversational pace
        </p>
      </div>
      <button className="btn btn-primary" onClick={() => onSave({ type: 'cardio', activity, duration: +duration, completed: true })}>
        Save Zone 2 Session
      </button>
    </div>
  )
}

export default function WorkoutLogger({ onSave }) {
  const { data } = useStore()
  const [type, setType] = useState(null)
  const prevWorkout = getPreviousWorkout(data.workoutLogs, 'strength')

  function getPrevEx(exId) {
    if (!prevWorkout?.exercises) return null
    return prevWorkout.exercises.find(e => e.id === exId) || null
  }

  if (!type) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>What did you do today?</p>
        {[
          { type: 'strength', emoji: '🏋️', label: 'Strength Training', sub: 'Full body · 3×8–12 · 6 exercises', color: 'var(--primary)' },
          { type: 'cardio',   emoji: '🏃', label: 'Zone 2 Cardio',     sub: '25–35 min walk, bike, or jog',     color: 'var(--teal)' },
          { type: 'rest',     emoji: '😴', label: 'Rest Day',          sub: 'Recovery, light walk, stretching',  color: 'var(--purple)' },
        ].map(opt => (
          <button
            key={opt.type}
            onClick={() => setType(opt.type)}
            style={{
              background: 'var(--bg-inset)', border: 'none', borderRadius: 12,
              padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12,
              fontFamily: 'inherit',
            }}
          >
            <span style={{ fontSize: 28 }}>{opt.emoji}</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 1 }}>{opt.label}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{opt.sub}</p>
            </div>
          </button>
        ))}
      </div>
    )
  }

  if (type === 'cardio') {
    return (
      <div>
        <button onClick={() => setType(null)} style={{ fontSize: 13, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Change
        </button>
        <CardioLogger onSave={onSave} />
      </div>
    )
  }

  if (type === 'rest') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => setType(null)} style={{ fontSize: 13, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
          ← Change
        </button>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>😴</div>
          <p style={{ fontSize: 18, fontWeight: 700 }}>Rest Day</p>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>
            Recovery is where the progress happens. Great work resting.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onSave({ type: 'rest', completed: true })}>
          Log Rest Day
        </button>
      </div>
    )
  }

  // Strength
  return (
    <div>
      <button onClick={() => setType(null)} style={{ fontSize: 13, color: 'var(--blue)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 4, fontFamily: 'inherit' }}>
        ← Change
      </button>
      {prevWorkout && (
        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
          Last strength session: {new Date(prevWorkout.date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      )}
      <div>
        {EXERCISES.map(ex => (
          <ExerciseRow key={ex.id} ex={ex} prevEx={getPrevEx(ex.id)} />
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <button
          className="btn btn-primary"
          onClick={() => onSave({ type: 'strength', completed: true })}
        >
          Complete Workout ✓
        </button>
      </div>
    </div>
  )
}

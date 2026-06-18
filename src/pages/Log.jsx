import { useState, useRef } from 'react'
import { Scale, Flame, Footprints, Dumbbell, ChevronLeft, ChevronRight, Check, Camera, Loader, X } from 'lucide-react'
import WorkoutLogger from '../components/WorkoutLogger'
import { useStore, PLAN, todayStr, dateLabel } from '../store'
import { analyzeFood, refineFood, scansRemaining } from '../lib/gemini'

function addDays(dateStr, n) {
  const d = new Date(dateStr); d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function Saved() {
  return <span className="badge badge-green"><Check size={9} /> Saved</span>
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

function MacroRow({ label, value, unit, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-2)', marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: color || 'var(--text-1)', letterSpacing: -0.5 }}>
        {value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-2)' }}>{unit}</span>
      </p>
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

  const [scanning,   setScanning]   = useState(false)
  const [refining,   setRefining]   = useState(false)
  const [scanResult, setScanResult] = useState(null)   // initial AI result (may have questions)
  const [answers,    setAnswers]    = useState({})      // {questionIndex: optionString}
  const [finalResult,setFinalResult]= useState(null)   // refined result after follow-ups
  const [scanError,  setScanError]  = useState('')
  const [scansLeft,  setScansLeft]  = useState(() => scansRemaining())
  const fileInputRef = useRef(null)

  const displayResult = finalResult ?? scanResult
  const hasQuestions  = scanResult?.questions?.length > 0 && !finalResult
  const allAnswered   = hasQuestions && scanResult.questions.every((_, i) => answers[i])

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
    setCalories(''); setProtein(''); setScanResult(null); setFinalResult(null); setAnswers({}); flash('n')
  }
  function saveSteps() {
    if (!steps) return; logSteps(date, +steps); setSteps(''); flash('s')
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setScanError('')
    setScanResult(null)
    setFinalResult(null)
    setAnswers({})
    setScanning(true)

    try {
      const result = await analyzeFood(file)
      setScanResult(result)
      setScansLeft(scansRemaining())
      // Skip questions if none returned
      if (!result.questions?.length) {
        setCalories(String(result.calories))
        setProtein(String(result.protein))
      }
    } catch (err) {
      setScanError(err.message)
    } finally {
      setScanning(false)
    }
  }

  async function handleRefine() {
    if (!scanResult || !allAnswered) return
    setRefining(true)
    setScanError('')
    try {
      const answersArr = scanResult.questions.map((q, i) => ({
        question: q.question,
        answer: answers[i],
      }))
      const result = await refineFood(
        scanResult.description,
        { calories: scanResult.calories, protein: scanResult.protein, carbs: scanResult.carbs, fat: scanResult.fat },
        answersArr,
      )
      setFinalResult(result)
      setCalories(String(result.calories))
      setProtein(String(result.protein))
      setScansLeft(scansRemaining())
    } catch (err) {
      setScanError(err.message)
    } finally {
      setRefining(false)
    }
  }

  return (
    <div>
      {/* Hidden camera input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handlePhotoSelected}
      />

      {/* ── Header ── */}
      <div className="page-header" style={{ paddingBottom: 20 }}>
        <h1 className="page-title">Log</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => setDate(d => addDays(d, -1))}
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--primary)', display: 'flex' }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{
            flex: 1, textAlign: 'center',
            fontSize: 14, fontWeight: 700,
            color: isToday ? 'var(--primary)' : 'var(--text-1)',
            background: 'var(--bg-inset)', borderRadius: 10, padding: '8px 0',
            border: '1px solid var(--card-border)',
          }}>
            {isToday ? 'Today' : dateLabel(date)}
          </span>
          <button
            onClick={() => setDate(d => addDays(d, 1))}
            disabled={isToday}
            style={{ background: 'var(--bg-inset)', border: '1px solid var(--card-border)', borderRadius: 8, padding: '7px 10px', cursor: isToday ? 'default' : 'pointer', color: isToday ? 'var(--text-3)' : 'var(--primary)', display: 'flex' }}
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
        <SectionLabel
          icon={Flame}
          label="Nutrition"
          right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saved.n && <Saved />}
              {/* Camera scan button */}
              <button
                onClick={() => { setScanError(''); fileInputRef.current?.click() }}
                disabled={scanning || scansLeft === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: scansLeft === 0 ? 'var(--bg-inset)' : 'var(--primary-dim)',
                  border: `1px solid ${scansLeft === 0 ? 'var(--card-border)' : 'rgba(187,134,252,0.3)'}`,
                  borderRadius: 20, padding: '5px 10px',
                  cursor: scansLeft === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: scansLeft > 0 ? '0 0 10px rgba(187,134,252,0.2)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {scanning
                  ? <Loader size={12} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                  : <Camera size={12} color={scansLeft === 0 ? 'var(--text-3)' : 'var(--primary)'} />
                }
                <span style={{ fontSize: 11, fontWeight: 700, color: scansLeft === 0 ? 'var(--text-3)' : 'var(--primary)' }}>
                  {scanning ? 'Analysing…' : scansLeft === 0 ? 'Limit reached' : `Scan food · ${scansLeft} left`}
                </span>
              </button>
            </div>
          }
        />
        <div className="card">
          {/* AI scan result */}
          {scanResult && (
            <div style={{
              marginBottom: 16,
              background: 'var(--primary-dim)',
              border: '1px solid rgba(187,134,252,0.25)',
              borderRadius: 14, padding: '14px',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--primary)', marginBottom: 3 }}>
                    {finalResult ? 'Refined estimate' : 'AI Analysis'}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{displayResult.description}</p>
                </div>
                <button onClick={() => { setScanResult(null); setFinalResult(null); setAnswers({}) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                  <X size={14} color="var(--text-3)" />
                </button>
              </div>

              {/* Macros */}
              <div style={{ display: 'flex', gap: 0, borderTop: '1px solid var(--sep)', paddingTop: 12 }}>
                <MacroRow label="Calories" value={displayResult.calories} unit=" kcal" color="var(--primary)" />
                <div style={{ width: 1, background: 'var(--sep)' }} />
                <MacroRow label="Protein"  value={displayResult.protein}  unit="g" color="var(--primary)" />
                <div style={{ width: 1, background: 'var(--sep)' }} />
                <MacroRow label="Carbs"    value={displayResult.carbs}    unit="g" />
                <div style={{ width: 1, background: 'var(--sep)' }} />
                <MacroRow label="Fat"      value={displayResult.fat}      unit="g" />
              </div>

              {/* Follow-up questions */}
              {hasQuestions && (
                <div style={{ marginTop: 14, borderTop: '1px solid var(--sep)', paddingTop: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--primary)', marginBottom: 10 }}>
                    Refine estimate
                  </p>
                  {scanResult.questions.map((q, qi) => (
                    <div key={qi} style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>{q.question}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {q.options.map(opt => {
                          const selected = answers[qi] === opt
                          return (
                            <button
                              key={opt}
                              onClick={() => setAnswers(a => ({ ...a, [qi]: opt }))}
                              style={{
                                padding: '7px 13px',
                                borderRadius: 20,
                                border: `1px solid ${selected ? 'var(--primary)' : 'rgba(187,134,252,0.25)'}`,
                                background: selected ? 'var(--primary)' : 'transparent',
                                color: selected ? '#fff' : 'var(--text-1)',
                                fontSize: 13, fontWeight: 600,
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all 0.15s',
                              }}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={handleRefine}
                    disabled={!allAnswered || refining}
                    style={{
                      width: '100%', marginTop: 4,
                      padding: '10px', borderRadius: 12,
                      border: 'none',
                      background: allAnswered ? 'var(--primary)' : 'var(--bg-inset)',
                      color: allAnswered ? '#fff' : 'var(--text-3)',
                      fontSize: 14, fontWeight: 700,
                      cursor: allAnswered ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    {refining
                      ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Refining…</>
                      : 'Refine estimate'}
                  </button>
                </div>
              )}

              {!hasQuestions && (
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 10, textAlign: 'center' }}>
                  Calories & protein filled in below — adjust if needed
                </p>
              )}
            </div>
          )}

          {/* Scan error */}
          {scanError && (
            <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 10 }}>
              <p style={{ fontSize: 13, color: 'var(--red)', fontWeight: 600 }}>{scanError}</p>
            </div>
          )}

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
                  flex: 1, background: 'var(--bg-inset)', border: `1px solid ${steps == n ? 'var(--primary)' : 'var(--card-border)'}`,
                  borderRadius: 8, padding: '8px 2px',
                  fontSize: 12, fontWeight: 700, color: steps == n ? 'var(--primary)' : 'var(--text-2)',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: steps == n ? '0 0 8px rgba(187,134,252,0.25)' : 'none',
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

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

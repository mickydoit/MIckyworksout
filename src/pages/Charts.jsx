import { useState, useMemo } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Target, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useStore, PLAN,
  buildChartData, weeklyAverages, latestWeight, projectedFinish,
  todayStr, weekNum, dateLabel,
} from '../store'
import Ring from '../components/Ring'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--sep)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 5, fontWeight: 600 }}>{label}</p>
      {payload.map(p => p.value != null && (
        <p key={p.dataKey} style={{ fontSize: 14, fontWeight: 700, color: p.dataKey === 'actual' ? 'var(--primary)' : 'var(--text-2)' }}>
          {p.dataKey === 'actual' ? 'Weight: ' : 'Target: '}
          <span style={{ color: 'var(--text-1)' }}>{p.value} kg</span>
        </p>
      ))}
    </div>
  )
}

function InfoBlock({ label, value, sub, color }) {
  return (
    <div className="stat-block">
      <p className="stat-block-label">{label}</p>
      <p className="stat-block-value" style={{ fontSize: 32, color: color || 'var(--text-1)' }}>{value}</p>
      {sub && <p className="stat-block-sub">{sub}</p>}
    </div>
  )
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Charts() {
  const { data } = useStore()
  const today = todayStr()
  const wk = weekNum(today)

  // ── Week navigation state ──────────────────────────────────────────────────
  // weekOffset: 0 = current week, -1 = last week, -2 = two weeks ago, etc.
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(today)
  const [touchStartX, setTouchStartX] = useState(null)

  // weekDays derived from weekOffset only — independent of selectedDate
  const weekDays = useMemo(() => {
    const now = new Date()
    const dow = (now.getDay() + 6) % 7 // Mon=0, Sun=6
    const monday = new Date(now)
    monday.setDate(now.getDate() - dow + weekOffset * 7)
    monday.setHours(0, 0, 0, 0)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d.toISOString().split('T')[0]
    })
  }, [weekOffset])

  const weekLabel = useMemo(() => {
    const opts = { day: 'numeric', month: 'short' }
    const s = new Date(weekDays[0] + 'T00:00:00').toLocaleDateString('en-AU', opts)
    const e = new Date(weekDays[6] + 'T00:00:00').toLocaleDateString('en-AU', opts)
    return `${s} – ${e}`
  }, [weekDays])

  const isCurrentWeek = weekOffset === 0

  const navigateWeek = (direction) => {
    const newOffset = weekOffset + direction
    if (newOffset > 0) return // never go into future weeks
    setWeekOffset(newOffset)

    // Compute the days of the destination week
    const now = new Date()
    const dow = (now.getDay() + 6) % 7
    const newMonday = new Date(now)
    newMonday.setDate(now.getDate() - dow + newOffset * 7)
    newMonday.setHours(0, 0, 0, 0)
    const destDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(newMonday)
      d.setDate(newMonday.getDate() + i)
      return d.toISOString().split('T')[0]
    })

    if (destDays.includes(today)) {
      setSelectedDate(today)
    } else {
      // Keep same day-of-week, capped at today
      const selectedDow = (new Date(selectedDate + 'T00:00:00').getDay() + 6) % 7
      const candidate = destDays[selectedDow]
      setSelectedDate(candidate <= today ? candidate : destDays[0])
    }
  }

  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX)
  const handleTouchEnd = (e) => {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) navigateWeek(dx > 0 ? -1 : 1)
    setTouchStartX(null)
  }

  const selectedNutrition = data.nutritionLogs.find(l => l.date === selectedDate) ?? null

  const weekHits = useMemo(() => {
    let calHits = 0, proHits = 0
    weekDays.forEach(date => {
      if (date > today) return
      const log = data.nutritionLogs.find(l => l.date === date)
      if (!log) return
      if (log.calories <= PLAN.calorieTarget + 150) calHits++
      if (log.protein >= PLAN.proteinTarget) proHits++
    })
    return { calHits, proHits }
  }, [weekDays, data.nutritionLogs, today])

  // ── Weight chart data ──────────────────────────────────────────────────────
  const chartData   = buildChartData(data.weightLogs)
  const weekAvgs    = weeklyAverages(data.weightLogs)
  const current     = latestWeight(data.weightLogs)
  const lostKg      = current ? +(PLAN.startWeight - current).toFixed(1) : 0
  const remaining   = +(5 - Math.max(0, lostKg)).toFixed(1)
  const pctDone     = Math.max(0, Math.min(100, Math.round((lostKg / 5) * 100)))
  const projection  = projectedFinish(data.weightLogs)

  const weeklyRate  = weekAvgs.length >= 2
    ? +((weekAvgs[0].avg - weekAvgs[weekAvgs.length - 1].avg) / (weekAvgs.length - 1)).toFixed(2)
    : null
  const onTrack     = weeklyRate != null ? weeklyRate >= 0.25 : null

  const strengthSessions = data.workoutLogs.filter(l => l.type === 'strength').length
  const cardioSessions   = data.workoutLogs.filter(l => l.type === 'cardio').length
  const nutritionDays    = data.nutritionLogs.length

  return (
    <div>
      <div className="page-header" style={{ paddingBottom: 20 }}>
        <h1 className="page-title">Progress</h1>
        {wk > 0 && (
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4, fontWeight: 500 }}>
            Week {wk} of {PLAN.totalWeeks} · 22 Jun → 20 Sep
          </p>
        )}
      </div>

      {/* ── Hero ── */}
      <div className="section">
        <div className="stat-block" style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p className="stat-block-label" style={{ color: 'var(--primary)' }}>Weight Lost</p>
              <p style={{ fontSize: 56, fontWeight: 800, color: lostKg > 0 ? 'var(--primary)' : 'var(--text-1)', letterSpacing: -3, lineHeight: 1, marginBottom: 4 }}>
                {lostKg > 0 ? lostKg.toFixed(1) : '—'}
                {lostKg > 0 && <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: 0, marginLeft: 4 }}>kg</span>}
              </p>
              <p className="stat-block-sub">{lostKg > 0 ? `${remaining} kg to goal` : 'Start logging to track'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)', letterSpacing: -2, lineHeight: 1 }}>{pctDone}%</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>of goal</p>
              {onTrack != null && (
                <div style={{ marginTop: 8 }}>
                  <span className={`badge ${onTrack ? 'badge-green' : 'badge-orange'}`}>
                    {onTrack ? '✓ On track' : '⚡ Adjust'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="progress-track" style={{ height: 5 }}>
              <div className="progress-fill" style={{ width: `${pctDone}%` }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-2)' }}>93 kg</span>
              <span style={{ fontSize: 10, color: 'var(--text-2)' }}>88 kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="section">
        <div className="stat-grid">
          <InfoBlock
            label="Current" color="var(--primary)"
            value={current ? `${current}` : '—'}
            sub={current ? 'kg · latest log' : 'No logs yet'}
          />
          <InfoBlock
            label="Week"
            value={wk > 0 ? wk : '—'}
            sub={wk > 0 ? `of ${PLAN.totalWeeks} total` : 'Starts 22 Jun'}
          />
        </div>
      </div>

      {/* ── Projected finish ── */}
      {projection && (
        <div className="section">
          <div className="stat-block" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Target size={18} color="var(--primary)" />
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--text-2)', marginBottom: 3 }}>Projected Finish</p>
              <p style={{ fontSize: 17, fontWeight: 800, color: 'var(--primary)' }}>{dateLabel(projection)}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)' }}>at current pace · target is 20 Sep</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Rate card ── */}
      {weeklyRate != null && (
        <div className="section">
          <div className="stat-block">
            <p className="stat-block-label">Weekly Rate</p>
            <p className="stat-block-value" style={{ fontSize: 34, color: weeklyRate >= 0.25 ? 'var(--primary)' : weeklyRate > 0 ? 'var(--orange)' : 'var(--red)' }}>
              {weeklyRate > 0 ? `${weeklyRate}` : '0'}
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)', letterSpacing: 0 }}> kg/wk</span>
            </p>
            <p className="stat-block-sub">
              {weeklyRate >= 0.25 && weeklyRate <= 0.7 && 'Perfect pace — keep going'}
              {weeklyRate > 0.7 && 'Dropping fast — eat a little more'}
              {weeklyRate > 0 && weeklyRate < 0.25 && 'Below target — trim 150 kcal or add steps'}
              {weeklyRate <= 0 && 'Track more consistently to see trend'}
            </p>
          </div>
        </div>
      )}

      {/* ── Weight chart ── */}
      <div className="section">
        <p className="section-label">Weight Chart</p>
        <div className="card" style={{ padding: '16px 6px 12px' }}>
          {chartData.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontSize: 36, marginBottom: 10 }}>📈</p>
              <p style={{ fontSize: 16, fontWeight: 700 }}>Chart fills in as you log</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 6, lineHeight: 1.5 }}>
                Log your weight daily from 22 June to see your trend vs. the expected pace.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={chartData} margin={{ top: 8, right: 14, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'var(--text-2)', fontFamily: 'Inter' }}
                    tickLine={false} axisLine={false}
                    interval={Math.max(1, Math.floor(chartData.length / 5))}
                  />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 10, fill: 'var(--text-2)', fontFamily: 'Inter' }}
                    tickLine={false} axisLine={false}
                    tickFormatter={v => `${v}`}
                    width={32}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={PLAN.targetWeight} stroke="var(--green)" strokeDasharray="5 4" strokeWidth={1.5} />
                  <Line type="monotone" dataKey="expected"
                    stroke="var(--sep)" strokeDasharray="5 4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="actual"
                    stroke="var(--primary)" strokeWidth={2.5}
                    dot={{ fill: 'var(--primary)', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sep)' }}>
                {[
                  { color: 'var(--primary)', label: 'Actual', dash: false },
                  { color: 'var(--sep)',     label: 'Target pace', dash: true },
                  { color: 'var(--green)',   label: '88 kg goal', dash: true },
                ].map(({ color, label, dash }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 18, height: 0, borderTop: `2px ${dash ? 'dashed' : 'solid'} ${color}` }} />
                    <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Weekly averages ── */}
      {weekAvgs.length > 0 && (
        <div className="section">
          <p className="section-label">Weekly Averages</p>
          <div className="card" style={{ padding: '4px 0' }}>
            {weekAvgs.map((w, i) => {
              const prev = weekAvgs[i - 1]
              const delta = prev ? +(w.avg - prev.avg).toFixed(1) : null
              return (
                <div key={w.week} className="log-row" style={{ padding: '12px 20px' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600, width: 56 }}>Week {w.week}</span>
                  <span style={{ flex: 1, fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>{w.avg} kg</span>
                  {delta != null && (
                    <span style={{ fontSize: 13, fontWeight: 700, color: delta < 0 ? 'var(--green)' : delta > 0 ? 'var(--red)' : 'var(--text-2)' }}>
                      {delta < 0 ? '↓ ' : delta > 0 ? '↑ +' : '→ '}{Math.abs(delta)} kg
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Training summary ── */}
      {(strengthSessions + cardioSessions) > 0 && (
        <div className="section">
          <p className="section-label">Training Summary</p>
          <div className="stat-grid">
            <div className="stat-block" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)', letterSpacing: -2 }}>{strengthSessions}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Strength sessions</p>
            </div>
            <div className="stat-block" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 44, fontWeight: 800, color: 'var(--primary)', letterSpacing: -2 }}>{cardioSessions}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Zone 2 sessions</p>
            </div>
            <div className="stat-block" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '14px' }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)', letterSpacing: -1 }}>{nutritionDays}</p>
              <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Days nutrition tracked</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Nutrition rings ── */}
      <div className="section">
        <p className="section-label">Nutrition</p>
        <div
          className="card"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Week navigation header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 12px 8px' }}>
            <button
              onClick={() => navigateWeek(-1)}
              style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-1)', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={18} />
            </button>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', letterSpacing: 0.3 }}>
              {isCurrentWeek ? 'This week' : weekLabel}
            </p>
            <button
              onClick={() => navigateWeek(1)}
              disabled={isCurrentWeek}
              style={{ background: 'none', border: 'none', padding: '4px 8px', cursor: isCurrentWeek ? 'default' : 'pointer', color: isCurrentWeek ? 'var(--sep)' : 'var(--text-1)', display: 'flex', alignItems: 'center', opacity: isCurrentWeek ? 0.3 : 1 }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Small rings strip — one column per day */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '4px 8px 8px' }}>
            {weekDays.map((date, i) => {
              const log = data.nutritionLogs.find(l => l.date === date)
              const isSelected = date === selectedDate
              const isFuture = date > today
              const calColor = log && log.calories > PLAN.calorieTarget + 150 ? 'var(--red)' : 'var(--primary)'
              const proColor = log && log.protein >= PLAN.proteinTarget ? 'var(--green)' : 'var(--primary)'

              return (
                <div
                  key={date}
                  onClick={() => !isFuture && setSelectedDate(date)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: isFuture ? 'default' : 'pointer', opacity: isFuture ? 0.25 : 1 }}
                >
                  <p style={{ fontSize: 10, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--primary)' : 'var(--text-2)', marginBottom: 1 }}>
                    {DAY_LETTERS[i]}
                  </p>
                  <Ring value={log?.calories ?? 0} max={PLAN.calorieTarget} color={calColor} size={32} stroke={4} />
                  <Ring value={log?.protein ?? 0} max={PLAN.proteinTarget} color={proColor} size={32} stroke={4} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: isSelected ? 'var(--primary)' : 'transparent', marginTop: 1 }} />
                </div>
              )
            })}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--sep)', margin: '0 16px' }} />

          {/* Selected day label */}
          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center', paddingTop: 14 }}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>

          {/* Large rings for selected day */}
          {selectedNutrition ? (
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '16px 0 12px' }}>
              {/* Calories */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Ring
                  value={selectedNutrition.calories}
                  max={PLAN.calorieTarget}
                  color={selectedNutrition.calories > PLAN.calorieTarget + 150 ? 'var(--red)' : 'var(--primary)'}
                  size={148}
                  stroke={16}
                >
                  <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -1, lineHeight: 1 }}>
                    {selectedNutrition.calories.toLocaleString()}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>kcal</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginTop: 2 }}>
                    {Math.round((selectedNutrition.calories / PLAN.calorieTarget) * 100)}%
                  </p>
                </Ring>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-2)' }}>Calories</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>/ {PLAN.calorieTarget.toLocaleString()} kcal</p>
                </div>
              </div>

              {/* Protein */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <Ring
                  value={selectedNutrition.protein}
                  max={PLAN.proteinTarget}
                  color={selectedNutrition.protein >= PLAN.proteinTarget ? 'var(--green)' : 'var(--primary)'}
                  size={148}
                  stroke={16}
                >
                  <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', letterSpacing: -1, lineHeight: 1 }}>
                    {selectedNutrition.protein}
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>g</span>
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>protein</p>
                  <p style={{ fontSize: 11, fontWeight: 600, color: selectedNutrition.protein >= PLAN.proteinTarget ? 'var(--green)' : 'var(--primary)', marginTop: 2 }}>
                    {Math.round((selectedNutrition.protein / PLAN.proteinTarget) * 100)}%
                  </p>
                </Ring>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, color: 'var(--text-2)' }}>Protein</p>
                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>/ {PLAN.proteinTarget}g target</p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: 28, color: 'var(--text-3)', marginBottom: 8 }}>—</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
                {selectedDate > today ? 'Future date' : 'Nothing logged'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                Log nutrition on the Log tab to see it here
              </p>
            </div>
          )}

          {/* Weekly summary footer */}
          <div style={{ borderTop: '1px solid var(--sep)', padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)', letterSpacing: -1, lineHeight: 1 }}>
                  {weekHits.calHits}
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>/7</span>
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>calorie days hit</p>
              </div>
              <div style={{ width: 1, height: 32, background: 'var(--sep)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)', letterSpacing: -1, lineHeight: 1 }}>
                  {weekHits.proHits}
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>/7</span>
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 3 }}>protein days hit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}

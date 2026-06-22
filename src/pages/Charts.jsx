import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell,
} from 'recharts'
import { TrendingDown, Target, Calendar, Zap } from 'lucide-react'
import {
  useStore, PLAN,
  buildChartData, buildNutritionChartData, weeklyAverages, latestWeight, projectedFinish,
  todayStr, weekNum, dateLabel,
} from '../store'

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

const NutritionTooltip = ({ active, payload, label, target, unit }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--sep)',
      borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    }}>
      <p style={{ fontSize: 11, color: 'var(--text-2)', marginBottom: 5, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>
        {val?.toLocaleString()}{unit}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 2 }}>
        target: {target?.toLocaleString()}{unit}
      </p>
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

export default function Charts() {
  const { data } = useStore()
  const today = todayStr()
  const wk = weekNum(today)

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
  const nutritionChartData = buildNutritionChartData(data.nutritionLogs)

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

      {/* ── Calories chart ── */}
      {nutritionChartData.length > 0 && (
        <div className="section">
          <p className="section-label">Calories vs Target</p>
          <div className="card" style={{ padding: '16px 6px 12px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={nutritionChartData} margin={{ top: 8, right: 14, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--text-2)', fontFamily: 'Inter' }}
                  tickLine={false} axisLine={false}
                  interval={Math.max(0, Math.floor(nutritionChartData.length / 5))}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-2)', fontFamily: 'Inter' }}
                  tickLine={false} axisLine={false}
                  width={36}
                  tickFormatter={v => `${(v / 1000).toFixed(v >= 1000 ? 1 : 0)}${v >= 1000 ? 'k' : ''}`}
                />
                <Tooltip content={<NutritionTooltip target={PLAN.calorieTarget} unit=" kcal" />} />
                <ReferenceLine y={PLAN.calorieTarget} stroke="var(--green)" strokeDasharray="5 4" strokeWidth={1.5} />
                <Bar dataKey="calories" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {nutritionChartData.map((entry, i) => {
                    const over  = entry.calories > PLAN.calorieTarget + 150
                    const onTarget = !over && entry.calories >= PLAN.calorieTarget - 150
                    return (
                      <Cell
                        key={i}
                        fill={over ? 'var(--red)' : onTarget ? 'var(--green)' : 'var(--primary)'}
                        opacity={0.85}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sep)' }}>
              {[
                { color: 'var(--green)',   label: 'On target (±150)' },
                { color: 'var(--primary)', label: 'Under' },
                { color: 'var(--red)',     label: 'Over by >150' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Protein chart ── */}
      {nutritionChartData.length > 0 && (
        <div className="section">
          <p className="section-label">Protein vs Target</p>
          <div className="card" style={{ padding: '16px 6px 12px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={nutritionChartData} margin={{ top: 8, right: 14, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--sep)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--text-2)', fontFamily: 'Inter' }}
                  tickLine={false} axisLine={false}
                  interval={Math.max(0, Math.floor(nutritionChartData.length / 5))}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-2)', fontFamily: 'Inter' }}
                  tickLine={false} axisLine={false}
                  width={32}
                  tickFormatter={v => `${v}g`}
                />
                <Tooltip content={<NutritionTooltip target={PLAN.proteinTarget} unit="g" />} />
                <ReferenceLine y={PLAN.proteinTarget} stroke="var(--green)" strokeDasharray="5 4" strokeWidth={1.5} />
                <Bar dataKey="protein" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {nutritionChartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.protein >= PLAN.proteinTarget ? 'var(--green)' : 'var(--primary)'}
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--sep)' }}>
              {[
                { color: 'var(--green)',   label: 'Hit target' },
                { color: 'var(--primary)', label: 'Under target' },
              ].map(({ color, label }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-2)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 8 }} />
    </div>
  )
}

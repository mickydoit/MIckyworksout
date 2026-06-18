import { Target, Zap, Beef, Footprints, Dumbbell, Wind, Coffee } from 'lucide-react'
import { PLAN, EXERCISES } from '../store'

const DAYS = [
  { day: 'Mon', label: 'Strength Training',    Icon: Dumbbell, accent: 'var(--primary)' },
  { day: 'Tue', label: 'Zone 2 Cardio 30 min', Icon: Wind,     accent: 'var(--teal)' },
  { day: 'Wed', label: 'Strength Training',    Icon: Dumbbell, accent: 'var(--primary)' },
  { day: 'Thu', label: 'Rest / Easy Walk',     Icon: Coffee,   accent: 'var(--text-2)' },
  { day: 'Fri', label: 'Strength Training',    Icon: Dumbbell, accent: 'var(--primary)' },
  { day: 'Sat', label: 'Zone 2 / Long Walk',   Icon: Wind,     accent: 'var(--teal)' },
  { day: 'Sun', label: 'Rest Day',             Icon: Coffee,   accent: 'var(--text-2)' },
]

export default function Plan() {
  return (
    <div>
      <div className="page-header" style={{ paddingBottom: 20 }}>
        <h1 className="page-title">Your Plan</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6, fontWeight: 500 }}>
          93 → 88 kg · 13 weeks · 22 Jun – 20 Sep
        </p>
      </div>

      {/* ── Goal ── */}
      <div className="section">
        <p className="section-label">The Goal</p>
        <div className="stat-block" style={{ background: 'var(--primary-dim)', border: '1px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Target size={22} color="var(--primary-on)" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-1)', marginBottom: 4 }}>5 kg in 13 weeks</p>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6 }}>
                ≈ 0.38 kg/week — slow, sustainable, muscle-preserving. Fat loss = calorie deficit. Everything else supports that deficit.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Nutrition targets ── */}
      <div className="section">
        <p className="section-label">Daily Targets</p>
        <div className="stat-grid">
          {[
            { label: 'Calories', value: '~2,100', sub: 'kcal / day', color: 'var(--primary)' },
            { label: 'Protein',  value: '150–160', sub: 'grams / day', color: 'var(--primary)' },
            { label: 'Steps',    value: '8–10k',   sub: 'steps / day', color: 'var(--primary)' },
            { label: 'Deficit',  value: '~500',    sub: 'kcal / day',  color: 'var(--text-2)' },
          ].map(item => (
            <div key={item.label} className="stat-block">
              <p className="stat-block-label">{item.label}</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: item.color, letterSpacing: -1, lineHeight: 1, marginBottom: 4 }}>
                {item.value}
              </p>
              <p className="stat-block-sub">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sample day ── */}
      <div className="section">
        <p className="section-label">Sample Day (~2,100 kcal · ~155g protein)</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { time: 'Breakfast', emoji: '🍳', food: '3 eggs + 2 slices wholegrain toast', sub: 'or Greek yogurt (200g) with berries & oats' },
            { time: 'Lunch',     emoji: '🥗', food: 'Chicken/turkey 150–200g',             sub: 'Rice or potato + big pile of veg' },
            { time: 'Snack',     emoji: '🥤', food: 'Protein shake or cottage cheese',     sub: 'With fruit' },
            { time: 'Dinner',    emoji: '🍽️', food: 'Lean protein 150–200g',               sub: 'Fish, lean beef, or chicken · veg · carb' },
          ].map((m, i, arr) => (
            <div key={m.time} style={{ padding: '16px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--sep)' : 'none', display: 'flex', gap: 14 }}>
              <span style={{ fontSize: 26, flexShrink: 0, lineHeight: 1.2 }}>{m.emoji}</span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.9, color: 'var(--primary)', marginBottom: 4 }}>{m.time}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{m.food}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{m.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Big levers ── */}
      <div className="section">
        <p className="section-label">The Big Levers</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { emoji: '💪', title: 'Protein + veg at every meal',    sub: 'Most filling per calorie' },
            { emoji: '🚫', title: "Don't drink your calories",       sub: 'Juice, soft drink, milky coffees' },
            { emoji: '🍺', title: 'Cap the alcohol',                 sub: 'Empty cals + drives belly fat. Weekends only.' },
            { emoji: '🥦', title: 'Hungry? Add volume',             sub: 'More veg or protein, not smaller portions' },
            { emoji: '📊', title: 'Weigh in most mornings',         sub: 'Track the weekly average, ignore daily noise' },
          ].map((r, i, arr) => (
            <div key={r.title} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--sep)' : 'none', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.3 }}>{r.emoji}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{r.title}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weekly schedule ── */}
      <div className="section">
        <p className="section-label">Weekly Schedule</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {DAYS.map(({ day, label, Icon, accent }, i) => (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderBottom: i < DAYS.length - 1 ? '1px solid var(--sep)' : 'none' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', width: 28, flexShrink: 0 }}>{day}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${accent === 'var(--text-2)' ? 'var(--bg-inset)' : 'var(--primary-dim)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} color={accent} strokeWidth={2} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{label}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'center', marginTop: 10 }}>
          Shift days freely — consistency over the week matters more than exact layout.
        </p>
      </div>

      {/* ── Strength template ── */}
      <div className="section">
        <p className="section-label">Strength Session Template</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '13px 18px', background: 'var(--primary-dim)', borderBottom: '1px solid var(--sep)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>3 sets · 8–12 reps · ~90 sec rest</p>
            <p style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3 }}>
              Last 2 reps should be hard. When you hit 12 on all sets → add weight.
            </p>
          </div>
          {EXERCISES.map((ex, i) => (
            <div key={ex.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < EXERCISES.length - 1 ? '1px solid var(--sep)' : 'none' }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{ex.icon}</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 2 }}>{ex.name}</p>
                <p style={{ fontSize: 12, color: 'var(--text-2)' }}>{ex.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Adjusting ── */}
      <div className="section">
        <p className="section-label">Adjusting the Plan</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {[
            { badge: '✓ 0.3–0.5 kg/wk', cls: 'badge-green',  text: 'Perfect — change nothing.' },
            { badge: '→ Stalled',         cls: 'badge-orange', text: 'Trim 150–200 kcal or add steps.' },
            { badge: '↓ >0.7 kg/wk',     cls: 'badge-red',    text: "Eat more — faster isn't better." },
          ].map((r, i, arr) => (
            <div key={r.badge} style={{ padding: '14px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--sep)' : 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span className={`badge ${r.cls}`} style={{ flexShrink: 0, marginTop: 1 }}>{r.badge}</span>
              <span style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5 }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  )
}

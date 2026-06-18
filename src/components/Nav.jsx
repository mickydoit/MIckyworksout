import { Home, PlusCircle, TrendingDown, BookOpen } from 'lucide-react'

const tabs = [
  { id: 'today',  label: 'Today',    Icon: Home },
  { id: 'log',    label: 'Log',      Icon: PlusCircle },
  { id: 'charts', label: 'Progress', Icon: TrendingDown },
  { id: 'plan',   label: 'Plan',     Icon: BookOpen },
]

export default function Nav({ active, onSelect }) {
  return (
    <nav className="bottom-nav">
      <div className="nav-inner">
        {tabs.map(({ id, label, Icon }) => {
          const on = active === id
          return (
            <button
              key={id}
              className="nav-item"
              onClick={() => onSelect(id)}
              style={{
                filter: on ? 'drop-shadow(0 0 6px rgba(187,134,252,0.6))' : 'none',
                transition: 'filter 0.2s',
              }}
            >
              <Icon
                size={22}
                strokeWidth={on ? 2.5 : 1.8}
                color={on ? 'var(--primary)' : 'var(--text-2)'}
              />
              <span className="nav-label" style={{ color: on ? 'var(--primary)' : 'var(--text-2)' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

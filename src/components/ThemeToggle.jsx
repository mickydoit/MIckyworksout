import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        position: 'absolute', top: 14, right: 16, zIndex: 200,
        width: 36, height: 36, borderRadius: '50%',
        background: isDark ? 'rgba(187,134,252,0.1)' : 'rgba(103,80,164,0.08)',
        border: isDark ? '1px solid rgba(187,134,252,0.25)' : '1px solid rgba(103,80,164,0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit',
        boxShadow: isDark ? '0 0 12px rgba(187,134,252,0.2)' : 'none',
        transition: 'all 0.25s',
      }}
    >
      {isDark
        ? <Sun  size={15} color="var(--primary)" strokeWidth={2.5} />
        : <Moon size={15} color="var(--text-2)"  strokeWidth={2.5} />
      }
    </button>
  )
}

import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{
        position: 'absolute', top: 14, right: 16, zIndex: 200,
        width: 34, height: 34, borderRadius: '50%',
        background: 'var(--bg-inset)',
        border: '1px solid var(--sep)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit',
        transition: 'background 0.25s',
      }}
    >
      {isDark
        ? <Sun  size={14} color="var(--primary)" strokeWidth={2.5} />
        : <Moon size={14} color="var(--text-2)"   strokeWidth={2.5} />
      }
    </button>
  )
}

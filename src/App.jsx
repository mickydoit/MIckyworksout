import { useState, useEffect } from 'react'
import { StoreProvider } from './store'
import Today from './pages/Today'
import Log from './pages/Log'
import Charts from './pages/Charts'
import Plan from './pages/Plan'
import Nav from './components/Nav'
import ThemeToggle from './components/ThemeToggle'

function getInitialTheme() {
  const saved = localStorage.getItem('fittrack_theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const orb = (top, left, right, bottom, size, color) => ({
  position: 'absolute',
  top, left, right, bottom,
  width: size, height: size,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
  filter: 'blur(55px)',
  pointerEvents: 'none',
  zIndex: 0,
})

export default function App() {
  const [tab,   setTab]   = useState('today')
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('fittrack_theme', theme)
  }, [theme])

  const dark = theme === 'dark'

  return (
    <StoreProvider>
      <div className="app-shell">
        {/* Ambient background orbs — dark mode only */}
        {dark && <>
          <div style={orb('-60px', undefined, '-50px', undefined, 260, 'rgba(187,134,252,0.32)')} />
          <div style={orb(undefined, '-60px', undefined, '130px', 220, 'rgba(45,212,191,0.22)')} />
          <div style={orb('38%', undefined, '-70px', undefined, 190, 'rgba(96,165,250,0.18)')} />
          <div style={orb('55%', '10%', undefined, undefined, 160, 'rgba(167,139,250,0.14)')} />
        </>}

        <ThemeToggle theme={theme} onToggle={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />

        <div className="page-scroll">
          {tab === 'today'  && <Today  onNavigate={setTab} />}
          {tab === 'log'    && <Log />}
          {tab === 'charts' && <Charts />}
          {tab === 'plan'   && <Plan />}
        </div>

        <Nav active={tab} onSelect={setTab} />
      </div>
    </StoreProvider>
  )
}

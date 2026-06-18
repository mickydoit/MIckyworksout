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

/*
 * Gradient orbs — position:fixed so they live at the viewport/body level.
 * The app-shell is transparent in dark mode, so cards' backdrop-filter
 * blurs these orbs, creating the glass panel effect.
 */
const DARK_ORBS = [
  // Top-right — vivid violet/purple
  { top: '-100px', right: '-80px', width: 420, height: 420,
    background: 'radial-gradient(circle, rgba(175,55,255,0.52) 0%, transparent 65%)' },
  // Left-centre — magenta/pink
  { top: '28%', left: '-110px', width: 360, height: 360,
    background: 'radial-gradient(circle, rgba(220,45,180,0.38) 0%, transparent 65%)' },
  // Bottom-centre — cyan/teal
  { bottom: '80px', left: '20%', width: 320, height: 320,
    background: 'radial-gradient(circle, rgba(0,210,255,0.28) 0%, transparent 65%)' },
  // Bottom-right — indigo/blue
  { bottom: '60px', right: '-80px', width: 280, height: 280,
    background: 'radial-gradient(circle, rgba(60,80,255,0.35) 0%, transparent 65%)' },
  // Mid — subtle warm purple fill
  { top: '52%', right: '5%', width: 200, height: 200,
    background: 'radial-gradient(circle, rgba(187,134,252,0.2) 0%, transparent 70%)' },
]

function Orbs() {
  return (
    <>
      {DARK_ORBS.map((style, i) => (
        <div
          key={i}
          style={{
            position: 'fixed',
            borderRadius: '50%',
            filter: 'blur(45px)',
            pointerEvents: 'none',
            zIndex: 0,
            ...style,
          }}
        />
      ))}
    </>
  )
}

export default function App() {
  const [tab,   setTab]   = useState('today')
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('fittrack_theme', theme)
  }, [theme])

  return (
    <StoreProvider>
      {/* Fixed orbs only in dark mode — they show through the transparent app-shell */}
      {theme === 'dark' && <Orbs />}

      <div className="app-shell">
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

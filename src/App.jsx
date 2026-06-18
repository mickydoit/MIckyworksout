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

export default function App() {
  const [tab,   setTab]   = useState('today')
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('fittrack_theme', theme)
  }, [theme])

  return (
    <StoreProvider>
      <div className="app-shell" style={{ position: 'relative' }}>
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

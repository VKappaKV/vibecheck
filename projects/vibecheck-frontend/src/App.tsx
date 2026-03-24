import { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { ThemeMode, ThemeToggle } from './components/ThemeToggle'
import { Badge } from './components/ui/badge'

const THEME_STORAGE_KEY = 'vibecheck-theme'
const DemoPage = lazy(() => import('./pages/DemoPage'))
const LandingPage = lazy(() => import('./pages/HomePage'))

function getInitialTheme(): ThemeMode {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <div className="relative min-h-screen bg-background pb-10">
          <div className="neo-grid-overlay pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
          <header className="mx-auto mt-4 w-[min(1200px,calc(100%-1.5rem))] border-2 border-border bg-card/90 px-4 py-3 backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Vibecheck</Badge>
                  <Badge variant="secondary">Algorand</Badge>
                </div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Algorand trust graph intelligence</p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-end">
                <NavItem to="/">Home</NavItem>
                <NavItem to="/demo">Demo</NavItem>
                <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
              </div>
            </div>
          </header>

          <main className="mx-auto mt-4 w-[min(1200px,calc(100%-1.5rem))]">
            <Suspense fallback={<PageLoadingState />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </SnackbarProvider>
  )
}

const PageLoadingState = () => {
  return (
    <div className="neo-panel flex min-h-[240px] items-center justify-center p-6 text-sm uppercase tracking-[0.12em] text-muted-foreground">
      Loading workspace...
    </div>
  )
}

interface NavItemProps {
  to: string
  children: string
}

const NavItem = ({ to, children }: NavItemProps) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex h-10 w-full items-center justify-center border-2 px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors sm:w-auto',
          isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-secondary',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

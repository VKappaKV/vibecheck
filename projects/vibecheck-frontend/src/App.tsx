import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeMode, ThemeToggle } from './components/ThemeToggle'
import { Badge } from './components/ui/badge'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'
import DemoPage from './pages/DemoPage'
import LandingPage from './pages/LandingPage'

const THEME_STORAGE_KEY = 'vibecheck-theme'

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

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [{ id: WalletId.DEFLY }, { id: WalletId.PERA }, { id: WalletId.EXODUS }]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = useMemo(
    () =>
      new WalletManager({
        wallets: supportedWallets,
        defaultNetwork: algodConfig.network,
        networks: {
          [algodConfig.network]: {
            algod: {
              baseServer: algodConfig.server,
              port: algodConfig.port,
              token: String(algodConfig.token),
            },
          },
        },
        options: {
          resetNetwork: true,
        },
      }),
    [algodConfig.network, algodConfig.port, algodConfig.server, algodConfig.token],
  )

  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <BrowserRouter>
          <div className="relative min-h-screen bg-background pb-10">
            <div className="neo-grid-overlay pointer-events-none fixed inset-0 -z-10" aria-hidden="true" />
            <header className="mx-auto mt-4 w-[min(1200px,calc(100%-1.5rem))] border-2 border-border bg-card/90 px-4 py-3 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Vibecheck</Badge>
                    <Badge variant="secondary">Neo Industrial UI</Badge>
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Algorand trust graph intelligence</p>
                </div>
                <div className="flex items-center gap-2">
                  <NavItem to="/">Landing</NavItem>
                  <NavItem to="/demo">Demo</NavItem>
                  <ThemeToggle theme={theme} onToggle={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
                </div>
              </div>
            </header>

            <main className="mx-auto mt-4 w-[min(1200px,calc(100%-1.5rem))]">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </WalletProvider>
    </SnackbarProvider>
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
          'inline-flex h-10 items-center border-2 px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors',
          isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-secondary',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

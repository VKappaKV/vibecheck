import { SupportedWallet, WalletId, WalletManager, WalletProvider, useWallet } from '@txnlab/use-wallet-react'
import { Wallet } from 'lucide-react'
import { SnackbarProvider } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom'
import ConnectWallet from './components/ConnectWallet'
import { ThemeMode, ThemeToggle } from './components/ThemeToggle'
import { Badge } from './components/ui/badge'
import DemoPage from './pages/DemoPage'
import LandingPage from './pages/LandingPage'
import { ellipseAddress } from './utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

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
  supportedWallets = [{ id: WalletId.PERA }, { id: WalletId.LUTE }]
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

  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
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
                  <NavItem to="/">Landing</NavItem>
                  <NavItem to="/demo">Demo</NavItem>
                  <WalletNavButton onClick={() => setOpenWalletModal(true)} />
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

            <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
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
          'inline-flex h-10 w-full items-center justify-center border-2 px-4 text-xs font-semibold uppercase tracking-[0.12em] transition-colors sm:w-auto',
          isActive ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-secondary',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

interface WalletNavButtonProps {
  onClick: () => void
}

const WalletNavButton = ({ onClick }: WalletNavButtonProps) => {
  const { activeAddress } = useWallet()

  return (
    <button
      type="button"
      data-test-id="connect-wallet"
      onClick={onClick}
      className="inline-flex h-10 w-full items-center justify-center gap-2 border-2 border-border bg-card px-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:bg-secondary sm:w-auto"
    >
      <Wallet className="h-4 w-4" />
      <span>{activeAddress ? ellipseAddress(activeAddress, 5) : 'Connect Wallet'}</span>
    </button>
  )
}

import { SupportedWallet, WalletId, WalletManager, WalletProvider, useWallet } from '@txnlab/use-wallet-react'
import { Wallet } from 'lucide-react'
import { Suspense, lazy, useMemo, useState } from 'react'
import ConnectWallet from '../components/ConnectWallet'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { ellipseAddress } from '../utils/ellipseAddress'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

const AppCalls = lazy(() => import('../components/AppCalls'))

function getSupportedWallets(): SupportedWallet[] {
  if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
    const kmdConfig = getKmdConfigFromViteEnvironment()

    return [
      {
        id: WalletId.KMD,
        options: {
          baseServer: kmdConfig.server,
          token: String(kmdConfig.token),
          port: String(kmdConfig.port),
        },
      },
    ]
  }

  return [{ id: WalletId.PERA }, { id: WalletId.LUTE }]
}

export default function DemoPage() {
  const algodConfig = getAlgodConfigFromViteEnvironment()
  const walletManager = useMemo(
    () =>
      new WalletManager({
        wallets: getSupportedWallets(),
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

  return (
    <WalletProvider manager={walletManager}>
      <DemoPageContent />
    </WalletProvider>
  )
}

function DemoPageContent() {
  const { activeAddress } = useWallet()
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)

  return (
    <>
      <div className="space-y-4">
        <Card className="neo-panel">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Operational Console</Badge>
                {activeAddress ? <Badge variant="secondary">Wallet connected</Badge> : <Badge variant="outline">No wallet connected</Badge>}
              </div>

              <Button
                type="button"
                data-test-id="connect-wallet"
                variant="outline"
                className="gap-2"
                onClick={() => setOpenWalletModal(true)}
              >
                <Wallet className="h-4 w-4" />
                {activeAddress ? ellipseAddress(activeAddress, 5) : 'Connect Wallet'}
              </Button>
            </div>

            <CardTitle className="text-3xl uppercase tracking-[0.08em]">Trust graph demo workspace</CardTitle>
            <CardDescription>Trust analytics is loaded directly below so you can start immediately.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No extra click required: the trust score workspace is already active.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg uppercase tracking-wide">Demo tips</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
            <p>1) Use the connect button above to connect or disconnect your wallet.</p>
            <p>2) In on-chain mode, initialize your profile, then add/remove APP, ASA, and peer trust entries.</p>
            <p>3) Share your peer invite QR so others can add your address with one scan.</p>
          </CardContent>
        </Card>

        <Suspense fallback={<DemoWorkspaceLoadingState />}>
          <AppCalls />
        </Suspense>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={() => setOpenWalletModal(false)} />
    </>
  )
}

const DemoWorkspaceLoadingState = () => {
  return (
    <Card className="neo-panel">
      <CardContent className="py-8 text-center text-sm uppercase tracking-[0.12em] text-muted-foreground">
        Loading trust graph workspace...
      </CardContent>
    </Card>
  )
}

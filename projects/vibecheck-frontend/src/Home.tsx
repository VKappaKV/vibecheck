import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import AppCalls from './components/AppCalls'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Separator } from './components/ui/separator'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal((current) => !current)
  }

  const toggleDemoModal = () => {
    setOpenDemoModal((current) => !current)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal((current) => !current)
  }

  return (
    <div className="space-y-4">
      <Card className="neo-panel">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Operational Console</Badge>
            {activeAddress ? <Badge variant="secondary">Wallet connected</Badge> : <Badge variant="outline">No wallet connected</Badge>}
          </div>
          <CardTitle className="text-3xl uppercase tracking-[0.08em]">Trust graph demo workspace</CardTitle>
          <CardDescription>
            Connect a wallet, send a test transfer, then open the trust analytics panel to inspect APP and ASA confidence across peer hops.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button asChild className="w-full" data-test-id="getting-started">
            <a target="_blank" rel="noreferrer" href="https://github.com/algorandfoundation/algokit-cli">
              Getting started
            </a>
          </Button>

          <Separator />

          <div className="grid gap-2 sm:grid-cols-3">
            <Button data-test-id="connect-wallet" variant="outline" onClick={toggleWalletModal}>
              Wallet Connection
            </Button>

            <Button data-test-id="transactions-demo" variant="outline" disabled={!activeAddress} onClick={toggleDemoModal}>
              Transactions Demo
            </Button>

            <Button data-test-id="appcalls-demo" onClick={toggleAppCallsModal}>
              Trust Score Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg uppercase tracking-wide">Demo tips</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <p>1) Connect wallet first to unlock transaction actions.</p>
          <p>2) Use trust score modal to compare APP and ASA rankings.</p>
          <p>3) Expand network analysis to inspect contributor paths.</p>
        </CardContent>
      </Card>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
      <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
    </div>
  )
}

export default Home

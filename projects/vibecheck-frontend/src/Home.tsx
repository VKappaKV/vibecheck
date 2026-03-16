import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#dff4ff,_transparent_45%),radial-gradient(circle_at_top_right,_#fcefd5,_transparent_40%),linear-gradient(180deg,_#f8fbff_0%,_#eef4fa_100%)] px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <Card className="border-white/50 shadow-xl">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>AlgoKit + Shadcn</Badge>
              {activeAddress ? <Badge variant="secondary">Wallet connected</Badge> : <Badge variant="outline">No wallet connected</Badge>}
            </div>
            <CardTitle className="text-3xl">Vibecheck frontend demo</CardTitle>
            <CardDescription>
              Use wallet flow, send demo payments, and open a trust-scoring modal that compares APP and ASA scores with the same trust graph
              logic used by the backend utilities.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Button asChild className="w-full" data-test-id="getting-started">
              <a target="_blank" rel="noreferrer" href="https://github.com/algorandfoundation/algokit-cli">
                Getting started
              </a>
            </Button>

            <Separator />

            <div className="grid gap-2 sm:grid-cols-2">
              <Button data-test-id="connect-wallet" variant="outline" onClick={toggleWalletModal}>
                Wallet Connection
              </Button>

              <Button data-test-id="transactions-demo" variant="outline" disabled={!activeAddress} onClick={toggleDemoModal}>
                Transactions Demo
              </Button>

              <Button data-test-id="appcalls-demo" className="sm:col-span-2" onClick={toggleAppCallsModal}>
                Trust Score Demo (APP + ASA)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
      <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
      <AppCalls openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
    </div>
  )
}

export default Home

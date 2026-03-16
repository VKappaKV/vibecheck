import { useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { scoreAppTrust, scoreAssetTrust, TrustProfile } from '../utils/trustScores'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const PROFILES: TrustProfile[] = [
  {
    account: 'ALICE',
    trustedApps: [1001n, 2002n],
    trustedAsas: [31566704n],
    trustedPeers: ['BOB', 'CAROL'],
  },
  {
    account: 'BOB',
    trustedApps: [1001n, 3003n],
    trustedAsas: [31566704n, 10458941n],
    trustedPeers: ['DAN'],
  },
  {
    account: 'CAROL',
    trustedApps: [4004n],
    trustedAsas: [10458941n],
    trustedPeers: ['ERIN'],
  },
  {
    account: 'DAN',
    trustedApps: [2002n],
    trustedAsas: [31566704n],
    trustedPeers: [],
  },
  {
    account: 'ERIN',
    trustedApps: [3003n],
    trustedAsas: [117719674n],
    trustedPeers: [],
  },
]

const APP_TARGETS = [
  { id: 1001n, label: 'SwapRouter v2' },
  { id: 2002n, label: 'LendingPool Prime' },
  { id: 3003n, label: 'Guild Escrow' },
  { id: 4004n, label: 'Arcade Quest' },
]

const ASA_TARGETS = [
  { id: 31566704n, label: 'USDC' },
  { id: 10458941n, label: 'goBTC' },
  { id: 117719674n, label: 'AlgoRWA' },
]

const seedAccounts = PROFILES.map((profile) => profile.account)

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const { activeAddress } = useWallet()
  const [seedAccount, setSeedAccount] = useState<string>('ALICE')

  const appScores = useMemo(
    () =>
      APP_TARGETS.map((target) => ({
        ...target,
        score: scoreAppTrust({ seedAccount, targetAppId: target.id, profiles: PROFILES }),
      })).sort((a, b) => b.score - a.score),
    [seedAccount],
  )

  const assetScores = useMemo(
    () =>
      ASA_TARGETS.map((target) => ({
        ...target,
        score: scoreAssetTrust({ seedAccount, targetAssetId: target.id, profiles: PROFILES }),
      })).sort((a, b) => b.score - a.score),
    [seedAccount],
  )

  const toPercent = (score: number) => Math.min(100, Math.round(score * 40))

  return (
    <Dialog open={openModal} onOpenChange={setModalState}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trust score demo for APPs and ASAs</DialogTitle>
          <DialogDescription>
            Simulated graph score based on direct trust + peer influence decay.{' '}
            {activeAddress ? 'Wallet connected.' : 'Wallet optional for this demo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <label htmlFor="seed-account" className="text-sm font-medium text-foreground">
            Seed account
          </label>
          <select
            id="seed-account"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground sm:w-56"
            value={seedAccount}
            onChange={(e) => setSeedAccount(e.target.value)}
          >
            {seedAccounts.map((account) => (
              <option key={account} value={account}>
                {account}
              </option>
            ))}
          </select>
        </div>

        <Tabs defaultValue="apps">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apps">APP scores</TabsTrigger>
            <TabsTrigger value="assets">ASA scores</TabsTrigger>
          </TabsList>

          <TabsContent value="apps">
            <div className="space-y-3">
              {appScores.map((item) => (
                <ScoreRow
                  key={item.id.toString()}
                  label={item.label}
                  idLabel={`APP ${item.id.toString()}`}
                  score={item.score}
                  progress={toPercent(item.score)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assets">
            <div className="space-y-3">
              {assetScores.map((item) => (
                <ScoreRow
                  key={item.id.toString()}
                  label={item.label}
                  idLabel={`ASA ${item.id.toString()}`}
                  score={item.score}
                  progress={toPercent(item.score)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setModalState(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ScoreRowProps {
  label: string
  idLabel: string
  score: number
  progress: number
}

const ScoreRow = ({ label, idLabel, score, progress }: ScoreRowProps) => {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{idLabel}</p>
        </div>
        <Badge variant="secondary">score {score.toFixed(3)}</Badge>
      </div>
      <div className="h-2 w-full rounded bg-muted">
        <div className="h-2 rounded bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default AppCalls

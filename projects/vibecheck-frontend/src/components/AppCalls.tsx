import { useMemo, useState } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { analyzeAppTrust, analyzeAssetTrust, scoreAppTrust, scoreAssetTrust, TrustProfile, TrustScoreOptions } from '../utils/trustScores'
import { TrustNetworkAnalysis } from './TrustNetworkAnalysis'

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
const DEFAULT_OPTIONS: Required<TrustScoreOptions> = {
  maxDepth: 3,
  depthDecay: 0.5,
  directWeight: 1,
  peerWeight: 0.75,
}

const AppCalls = ({ openModal, setModalState }: AppCallsInterface) => {
  const { activeAddress } = useWallet()
  const [seedAccount, setSeedAccount] = useState<string>('ALICE')
  const [tabValue, setTabValue] = useState<'apps' | 'assets'>('apps')
  const [selectedAppId, setSelectedAppId] = useState<bigint>(APP_TARGETS[0].id)
  const [selectedAssetId, setSelectedAssetId] = useState<bigint>(ASA_TARGETS[0].id)
  const [analysisExpanded, setAnalysisExpanded] = useState<boolean>(false)
  const [scoreOptions, setScoreOptions] = useState<Required<TrustScoreOptions>>(DEFAULT_OPTIONS)

  const appScores = useMemo(
    () =>
      APP_TARGETS.map((target) => ({
        ...target,
        score: scoreAppTrust({ seedAccount, targetAppId: target.id, profiles: PROFILES, options: scoreOptions }),
      })).sort((a, b) => b.score - a.score),
    [scoreOptions, seedAccount],
  )

  const assetScores = useMemo(
    () =>
      ASA_TARGETS.map((target) => ({
        ...target,
        score: scoreAssetTrust({ seedAccount, targetAssetId: target.id, profiles: PROFILES, options: scoreOptions }),
      })).sort((a, b) => b.score - a.score),
    [scoreOptions, seedAccount],
  )

  const appNetworkAnalysis = useMemo(
    () => analyzeAppTrust({ seedAccount, targetAppId: selectedAppId, profiles: PROFILES, options: scoreOptions }),
    [scoreOptions, seedAccount, selectedAppId],
  )

  const assetNetworkAnalysis = useMemo(
    () => analyzeAssetTrust({ seedAccount, targetAssetId: selectedAssetId, profiles: PROFILES, options: scoreOptions }),
    [scoreOptions, seedAccount, selectedAssetId],
  )

  const activeTargetLabel = useMemo(() => {
    if (tabValue === 'apps') {
      return APP_TARGETS.find((target) => target.id === selectedAppId)?.label ?? 'Unknown APP'
    }
    return ASA_TARGETS.find((target) => target.id === selectedAssetId)?.label ?? 'Unknown ASA'
  }, [selectedAppId, selectedAssetId, tabValue])

  const activeAnalysis = tabValue === 'apps' ? appNetworkAnalysis : assetNetworkAnalysis

  const toPercent = (score: number) => Math.min(100, Math.round(score * 40))

  return (
    <Dialog open={openModal} onOpenChange={setModalState}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto border-2 border-border bg-card">
        <DialogHeader>
          <DialogTitle>Trust score demo for APPs and ASAs</DialogTitle>
          <DialogDescription>
            Simulated graph score based on direct trust + peer influence decay.{' '}
            {activeAddress ? 'Wallet connected.' : 'Wallet optional for this demo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 rounded-sm border-2 border-border bg-background/70 p-3 sm:grid-cols-3 sm:items-end">
          <label htmlFor="seed-account" className="text-sm font-medium text-foreground">
            Seed account
            <select
              id="seed-account"
              className="mt-1 h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm text-foreground"
              value={seedAccount}
              onChange={(e) => setSeedAccount(e.target.value)}
            >
              {seedAccounts.map((account) => (
                <option key={account} value={account}>
                  {account}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="app-target" className="text-sm font-medium text-foreground">
            APP analysis target
            <select
              id="app-target"
              className="mt-1 h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm text-foreground"
              value={selectedAppId.toString()}
              onChange={(e) => setSelectedAppId(BigInt(e.target.value))}
            >
              {APP_TARGETS.map((target) => (
                <option key={target.id.toString()} value={target.id.toString()}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="asa-target" className="text-sm font-medium text-foreground">
            ASA analysis target
            <select
              id="asa-target"
              className="mt-1 h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm text-foreground"
              value={selectedAssetId.toString()}
              onChange={(e) => setSelectedAssetId(BigInt(e.target.value))}
            >
              {ASA_TARGETS.map((target) => (
                <option key={target.id.toString()} value={target.id.toString()}>
                  {target.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Tabs value={tabValue} onValueChange={(value) => setTabValue(value as 'apps' | 'assets')}>
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

        <TrustNetworkAnalysis
          expanded={analysisExpanded}
          onToggle={() => setAnalysisExpanded((current) => !current)}
          options={scoreOptions}
          onOptionsChange={setScoreOptions}
          analysis={activeAnalysis}
          targetLabel={activeTargetLabel}
          targetTypeLabel={tabValue === 'apps' ? 'APP' : 'ASA'}
        />

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
    <div className="rounded-sm border-2 border-border bg-background/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{idLabel}</p>
        </div>
        <Badge variant="secondary">score {score.toFixed(3)}</Badge>
      </div>
      <div className="h-2 w-full rounded-sm bg-muted">
        <div className="h-2 rounded-sm bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default AppCalls

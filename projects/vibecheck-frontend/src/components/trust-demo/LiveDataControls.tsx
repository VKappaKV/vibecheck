import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { ScoreTarget } from './types'

interface LiveDataControlsProps {
  seedAccount: string
  seedAccounts: string[]
  onSeedAccountChange: (value: string) => void
  appTargets: ScoreTarget[]
  selectedAppId: bigint
  onSelectAppId: (value: bigint) => void
  assetTargets: ScoreTarget[]
  selectedAssetId: bigint
  onSelectAssetId: (value: bigint) => void
  onChainAppId: string
  isLoadingOnChainProfiles: boolean
  isOnChainProfilesStale: boolean
  onRefreshProfiles: () => void
  onCopyShareUrl: () => void
  loadedProfiles: number
  hasActiveAddress: boolean
  onChainError: string | null
}

export function LiveDataControls({
  seedAccount,
  seedAccounts,
  onSeedAccountChange,
  appTargets,
  selectedAppId,
  onSelectAppId,
  assetTargets,
  selectedAssetId,
  onSelectAssetId,
  onChainAppId,
  isLoadingOnChainProfiles,
  isOnChainProfilesStale,
  onRefreshProfiles,
  onCopyShareUrl,
  loadedProfiles,
  hasActiveAddress,
  onChainError,
}: LiveDataControlsProps) {
  return (
    <div className="grid gap-3 rounded-sm border-2 border-border bg-background/70 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Badge variant="secondary" className="w-fit">
          Live profile mode
        </Badge>

        <Button variant="outline" onClick={onCopyShareUrl} className="w-full sm:w-auto">
          Copy share URL
        </Button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:items-end">
        <label htmlFor="seed-account" className="text-sm font-medium text-foreground">
          Seed account
          <Input
            id="seed-account"
            list="seed-account-options"
            value={seedAccount}
            onChange={(event) => onSeedAccountChange(event.target.value)}
            placeholder="Algorand address"
          />
          <datalist id="seed-account-options">
            {seedAccounts.map((account) => (
              <option key={account} value={account} />
            ))}
          </datalist>
        </label>

        <label htmlFor="app-target" className="text-sm font-medium text-foreground">
          APP analysis target
          <select
            id="app-target"
            className="mt-1 h-10 w-full rounded-sm border-2 border-input bg-background px-3 py-2 text-sm text-foreground"
            value={selectedAppId.toString()}
            onChange={(event) => onSelectAppId(BigInt(event.target.value))}
          >
            {appTargets.map((target) => (
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
            onChange={(event) => onSelectAssetId(BigInt(event.target.value))}
          >
            {assetTargets.map((target) => (
              <option key={target.id.toString()} value={target.id.toString()}>
                {target.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
        <div className="grid gap-1 rounded-sm border-2 border-border bg-card/60 p-3 text-sm">
          <span className="font-semibold uppercase tracking-[0.08em] text-foreground">Vibecheck app</span>
          <span className="font-mono text-foreground">{onChainAppId || 'Not configured'}</span>
        </div>
        <Button onClick={onRefreshProfiles} disabled={isLoadingOnChainProfiles} className="w-full md:w-auto">
          {isLoadingOnChainProfiles ? 'Loading network...' : 'Refresh on-chain network'}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Loaded profiles: {loadedProfiles}</Badge>
        {isOnChainProfilesStale && <Badge variant="outline">Refresh needed</Badge>}
        {!hasActiveAddress && <Badge variant="outline">Connect wallet to read and update profiles</Badge>}
        {onChainError && <Badge variant="outline">Error: {onChainError}</Badge>}
      </div>
    </div>
  )
}

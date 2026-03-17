import { AlgorandClient, microAlgo } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { isValidAddress } from 'algosdk'
import { useSnackbar } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VibecheckClient, VibecheckFactory } from '../contracts/Vibecheck'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { analyzeAppTrust, analyzeAssetTrust, scoreAppTrust, scoreAssetTrust, TrustProfile, TrustScoreOptions } from '../utils/trustScores'
import { TrustNetworkAnalysis } from './TrustNetworkAnalysis'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

type ProfileSource = 'sample' | 'chain'

const SAMPLE_PROFILES: TrustProfile[] = [
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

const SAMPLE_APP_TARGETS = [
  { id: 1001n, label: 'SwapRouter v2' },
  { id: 2002n, label: 'LendingPool Prime' },
  { id: 3003n, label: 'Guild Escrow' },
  { id: 4004n, label: 'Arcade Quest' },
]

const SAMPLE_ASA_TARGETS = [
  { id: 31566704n, label: 'USDC' },
  { id: 10458941n, label: 'goBTC' },
  { id: 117719674n, label: 'AlgoRWA' },
]

const ZERO_ADDRESS = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ'
const PROFILE_INIT_MBR = 300_000

const DEFAULT_OPTIONS: Required<TrustScoreOptions> = {
  maxDepth: 3,
  depthDecay: 0.5,
  directWeight: 1,
  peerWeight: 0.75,
}

function parsePositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function parseNumberInRange(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    return fallback
  }
  return Math.min(max, Math.max(min, parsed))
}

function parseBigInt(value: string | null, fallback: bigint): bigint {
  try {
    return value ? BigInt(value) : fallback
  } catch {
    return fallback
  }
}

function parsePositiveBigInt(value: string): bigint | null {
  try {
    const parsed = BigInt(value)
    return parsed > 0n ? parsed : null
  } catch {
    return null
  }
}

async function collectProfilesFromChain(
  client: VibecheckClient,
  seedAccount: string,
  sender: string,
  maxDepth: number,
): Promise<TrustProfile[]> {
  const visited = new Set<string>()
  const queue: Array<{ account: string; depth: number }> = [{ account: seedAccount, depth: 0 }]
  const profiles: TrustProfile[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }

    if (visited.has(current.account)) {
      continue
    }
    visited.add(current.account)

    const [trustedApps, trustedAsas, trustedPeers] = await Promise.all([
      client.getTrustedApp({ sender, args: { account: current.account } }),
      client.getTrustedAsa({ sender, args: { account: current.account } }),
      client.getAdjacencyList({ sender, args: { account: current.account } }),
    ])

    const nextPeers = trustedPeers.filter((peer) => peer !== ZERO_ADDRESS && isValidAddress(peer))

    profiles.push({
      account: current.account,
      trustedApps,
      trustedAsas,
      trustedPeers: nextPeers,
    })

    if (current.depth >= maxDepth) {
      continue
    }

    for (const peer of nextPeers) {
      queue.push({ account: peer, depth: current.depth + 1 })
    }
  }

  return profiles
}

const AppCalls = () => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [searchParams, setSearchParams] = useSearchParams()

  const [profileSource, setProfileSource] = useState<ProfileSource>(searchParams.get('source') === 'chain' ? 'chain' : 'sample')
  const [seedAccount, setSeedAccount] = useState<string>(searchParams.get('seed') ?? 'ALICE')
  const [tabValue, setTabValue] = useState<'apps' | 'assets'>(searchParams.get('tab') === 'assets' ? 'assets' : 'apps')
  const [selectedAppId, setSelectedAppId] = useState<bigint>(parseBigInt(searchParams.get('appTarget'), SAMPLE_APP_TARGETS[0].id))
  const [selectedAssetId, setSelectedAssetId] = useState<bigint>(parseBigInt(searchParams.get('asaTarget'), SAMPLE_ASA_TARGETS[0].id))
  const [analysisExpanded, setAnalysisExpanded] = useState<boolean>(searchParams.get('analysis') === '1')
  const [scoreOptions, setScoreOptions] = useState<Required<TrustScoreOptions>>({
    maxDepth: parseNumberInRange(searchParams.get('depth'), DEFAULT_OPTIONS.maxDepth, 0, 6),
    depthDecay: parseNumberInRange(searchParams.get('decay'), DEFAULT_OPTIONS.depthDecay, 0, 1),
    directWeight: parseNumberInRange(searchParams.get('dw'), DEFAULT_OPTIONS.directWeight, 0, 20),
    peerWeight: parseNumberInRange(searchParams.get('pw'), DEFAULT_OPTIONS.peerWeight, 0, 20),
  })
  const [onChainAppId, setOnChainAppId] = useState<string>(String(parsePositiveInt(searchParams.get('appId'), 0)))
  const [onChainProfiles, setOnChainProfiles] = useState<TrustProfile[]>([])
  const [isLoadingOnChainProfiles, setIsLoadingOnChainProfiles] = useState<boolean>(false)
  const [onChainError, setOnChainError] = useState<string | null>(null)
  const [mutationAppIdInput, setMutationAppIdInput] = useState<string>('')
  const [mutationAsaIdInput, setMutationAsaIdInput] = useState<string>('')
  const [mutationPeerInput, setMutationPeerInput] = useState<string>(searchParams.get('invitePeer') ?? '')
  const [isMutatingProfile, setIsMutatingProfile] = useState<boolean>(false)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const indexerConfig = getIndexerConfigFromViteEnvironment()

  const algorand = useMemo(
    () =>
      AlgorandClient.fromConfig({
        algodConfig,
        indexerConfig,
      }),
    [algodConfig, indexerConfig],
  )

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('source', profileSource)
    next.set('seed', seedAccount)
    next.set('tab', tabValue)
    next.set('appTarget', selectedAppId.toString())
    next.set('asaTarget', selectedAssetId.toString())
    next.set('depth', String(scoreOptions.maxDepth))
    next.set('decay', String(scoreOptions.depthDecay))
    next.set('dw', String(scoreOptions.directWeight))
    next.set('pw', String(scoreOptions.peerWeight))
    next.set('analysis', analysisExpanded ? '1' : '0')
    if (profileSource === 'chain') {
      next.set('appId', onChainAppId)
    }

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [
    analysisExpanded,
    onChainAppId,
    profileSource,
    scoreOptions.depthDecay,
    scoreOptions.directWeight,
    scoreOptions.maxDepth,
    scoreOptions.peerWeight,
    searchParams,
    seedAccount,
    selectedAppId,
    selectedAssetId,
    setSearchParams,
    tabValue,
  ])

  const activeProfiles = profileSource === 'chain' ? onChainProfiles : SAMPLE_PROFILES

  const seedAccounts = useMemo(() => activeProfiles.map((profile) => profile.account), [activeProfiles])

  const appTargets = useMemo(() => {
    if (profileSource === 'sample') {
      return SAMPLE_APP_TARGETS
    }

    const uniqueIds = new Set(activeProfiles.flatMap((profile) => profile.trustedApps))
    if (uniqueIds.size === 0) {
      return [{ id: selectedAppId, label: `APP ${selectedAppId.toString()}` }]
    }

    return [...uniqueIds]
      .sort((a, b) => Number(a - b))
      .map((id) => ({
        id,
        label: `APP ${id.toString()}`,
      }))
  }, [activeProfiles, profileSource, selectedAppId])

  const assetTargets = useMemo(() => {
    if (profileSource === 'sample') {
      return SAMPLE_ASA_TARGETS
    }

    const uniqueIds = new Set(activeProfiles.flatMap((profile) => profile.trustedAsas))
    if (uniqueIds.size === 0) {
      return [{ id: selectedAssetId, label: `ASA ${selectedAssetId.toString()}` }]
    }

    return [...uniqueIds]
      .sort((a, b) => Number(a - b))
      .map((id) => ({
        id,
        label: `ASA ${id.toString()}`,
      }))
  }, [activeProfiles, profileSource, selectedAssetId])

  useEffect(() => {
    if (!appTargets.some((target) => target.id === selectedAppId)) {
      setSelectedAppId(appTargets[0]?.id ?? 1n)
    }
  }, [appTargets, selectedAppId])

  useEffect(() => {
    if (!assetTargets.some((target) => target.id === selectedAssetId)) {
      setSelectedAssetId(assetTargets[0]?.id ?? 1n)
    }
  }, [assetTargets, selectedAssetId])

  const appScores = useMemo(
    () =>
      appTargets
        .map((target) => ({
          ...target,
          score: scoreAppTrust({
            seedAccount,
            targetAppId: target.id,
            profiles: activeProfiles,
            options: scoreOptions,
          }),
        }))
        .sort((a, b) => b.score - a.score),
    [activeProfiles, appTargets, scoreOptions, seedAccount],
  )

  const assetScores = useMemo(
    () =>
      assetTargets
        .map((target) => ({
          ...target,
          score: scoreAssetTrust({
            seedAccount,
            targetAssetId: target.id,
            profiles: activeProfiles,
            options: scoreOptions,
          }),
        }))
        .sort((a, b) => b.score - a.score),
    [activeProfiles, assetTargets, scoreOptions, seedAccount],
  )

  const appNetworkAnalysis = useMemo(
    () => analyzeAppTrust({ seedAccount, targetAppId: selectedAppId, profiles: activeProfiles, options: scoreOptions }),
    [activeProfiles, scoreOptions, seedAccount, selectedAppId],
  )

  const assetNetworkAnalysis = useMemo(
    () => analyzeAssetTrust({ seedAccount, targetAssetId: selectedAssetId, profiles: activeProfiles, options: scoreOptions }),
    [activeProfiles, scoreOptions, seedAccount, selectedAssetId],
  )

  const activeTargetLabel = useMemo(() => {
    if (tabValue === 'apps') {
      return appTargets.find((target) => target.id === selectedAppId)?.label ?? 'Unknown APP'
    }

    return assetTargets.find((target) => target.id === selectedAssetId)?.label ?? 'Unknown ASA'
  }, [appTargets, assetTargets, selectedAppId, selectedAssetId, tabValue])

  const activeAnalysis = tabValue === 'apps' ? appNetworkAnalysis : assetNetworkAnalysis

  const peerInviteLink = useMemo(() => {
    if (!activeAddress) {
      return ''
    }

    const inviteUrl = new URL(window.location.href)
    inviteUrl.searchParams.set('source', 'chain')
    inviteUrl.searchParams.set('seed', activeAddress)
    inviteUrl.searchParams.set('tab', 'apps')
    inviteUrl.searchParams.set('invitePeer', activeAddress)

    const inviteAppId = parsePositiveBigInt(onChainAppId.trim())
    if (inviteAppId) {
      inviteUrl.searchParams.set('appId', inviteAppId.toString())
    }

    return inviteUrl.toString()
  }, [activeAddress, onChainAppId])

  const peerInviteQrUrl = useMemo(() => {
    if (!peerInviteLink) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(peerInviteLink)}`
  }, [peerInviteLink])

  const toPercent = (score: number) => Math.min(100, Math.round(score * 40))

  const getOnChainClientContext = () => {
    if (!activeAddress || !transactionSigner) {
      enqueueSnackbar('Connect a wallet before updating trust lists', { variant: 'warning' })
      return null
    }

    const appId = parsePositiveBigInt(onChainAppId.trim())
    if (!appId) {
      enqueueSnackbar('Provide a valid Vibecheck app id', { variant: 'error' })
      return null
    }

    const factory = new VibecheckFactory({
      algorand,
      defaultSender: activeAddress,
    })

    const appClient = factory.getAppClientById({ appId })

    return {
      appClient,
      appId,
      sender: activeAddress,
      signer: transactionSigner,
    }
  }

  const reloadOnChainProfilesAfterMutation = async () => {
    if (profileSource === 'chain' && isValidAddress(seedAccount.trim())) {
      await loadOnChainProfiles()
    }
  }

  const runProfileMutation = async (
    successMessage: string,
    mutation: (context: NonNullable<ReturnType<typeof getOnChainClientContext>>) => Promise<unknown>,
  ) => {
    const context = getOnChainClientContext()
    if (!context) {
      return
    }

    setIsMutatingProfile(true)
    try {
      await mutation(context)
      enqueueSnackbar(successMessage, { variant: 'success' })
      await reloadOnChainProfilesAfterMutation()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Profile update failed'
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setIsMutatingProfile(false)
    }
  }

  const loadOnChainProfiles = async () => {
    if (!activeAddress) {
      enqueueSnackbar('Connect a wallet before loading on-chain profiles', { variant: 'warning' })
      return
    }

    const trimmedSeed = seedAccount.trim()
    if (!isValidAddress(trimmedSeed)) {
      enqueueSnackbar('Seed account must be a valid Algorand address for on-chain mode', { variant: 'error' })
      return
    }

    const appId = parsePositiveBigInt(onChainAppId.trim())
    if (!appId) {
      enqueueSnackbar('Provide a valid Vibecheck app id', { variant: 'error' })
      return
    }

    setIsLoadingOnChainProfiles(true)
    setOnChainError(null)
    try {
      const factory = new VibecheckFactory({
        algorand,
        defaultSender: activeAddress,
      })
      const appClient = factory.getAppClientById({ appId })

      const profiles = await collectProfilesFromChain(appClient, trimmedSeed, activeAddress, scoreOptions.maxDepth)
      setOnChainProfiles(profiles)
      enqueueSnackbar(`Loaded ${profiles.length} profiles from app ${appId.toString()}`, { variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load on-chain profiles'
      setOnChainError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setIsLoadingOnChainProfiles(false)
    }
  }

  const initProfile = async () => {
    await runProfileMutation('Profile initialized', async ({ appClient, sender, signer }) => {
      const payMbr = await algorand.createTransaction.payment({
        sender,
        receiver: appClient.appAddress,
        amount: microAlgo(PROFILE_INIT_MBR),
      })

      await appClient.send.init({
        sender,
        signer,
        args: { payMbr },
      })
    })
  }

  const addTrustedApp = async () => {
    const appId = parsePositiveBigInt(mutationAppIdInput.trim())
    if (!appId) {
      enqueueSnackbar('APP id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Added APP ${appId.toString()} to your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.addTrustedApps({
        sender,
        signer,
        args: { apps: [appId] },
      })
    })
  }

  const removeTrustedApp = async () => {
    const appId = parsePositiveBigInt(mutationAppIdInput.trim())
    if (!appId) {
      enqueueSnackbar('APP id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Removed APP ${appId.toString()} from your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.removeApp({
        sender,
        signer,
        args: { app: appId },
      })
    })
  }

  const addTrustedAsa = async () => {
    const asaId = parsePositiveBigInt(mutationAsaIdInput.trim())
    if (!asaId) {
      enqueueSnackbar('ASA id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Added ASA ${asaId.toString()} to your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.addTrustedAsas({
        sender,
        signer,
        args: { assets: [asaId] },
      })
    })
  }

  const removeTrustedAsa = async () => {
    const asaId = parsePositiveBigInt(mutationAsaIdInput.trim())
    if (!asaId) {
      enqueueSnackbar('ASA id must be a positive integer', { variant: 'error' })
      return
    }

    await runProfileMutation(`Removed ASA ${asaId.toString()} from your trust list`, async ({ appClient, sender, signer }) => {
      await appClient.send.removeAsa({
        sender,
        signer,
        args: { asset: asaId },
      })
    })
  }

  const addTrustedPeer = async () => {
    const peerAddress = mutationPeerInput.trim()
    if (!isValidAddress(peerAddress)) {
      enqueueSnackbar('Peer must be a valid Algorand address', { variant: 'error' })
      return
    }

    await runProfileMutation(`Added peer ${peerAddress}`, async ({ appClient, sender, signer }) => {
      await appClient.send.addTrustedPeers({
        sender,
        signer,
        args: { peers: [peerAddress] },
      })
    })
  }

  const removeTrustedPeer = async () => {
    const peerAddress = mutationPeerInput.trim()
    if (!isValidAddress(peerAddress)) {
      enqueueSnackbar('Peer must be a valid Algorand address', { variant: 'error' })
      return
    }

    await runProfileMutation(`Removed peer ${peerAddress}`, async ({ appClient, sender, signer }) => {
      await appClient.send.removePeer({
        sender,
        signer,
        args: { peer: peerAddress },
      })
    })
  }

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      enqueueSnackbar('Shareable analysis URL copied', { variant: 'success' })
    } catch {
      enqueueSnackbar('Clipboard unavailable. Copy the URL from the browser bar.', { variant: 'warning' })
    }
  }

  const copyPeerInviteLink = async () => {
    if (!peerInviteLink) {
      enqueueSnackbar('Connect wallet to generate a peer invite URL', { variant: 'warning' })
      return
    }

    try {
      await navigator.clipboard.writeText(peerInviteLink)
      enqueueSnackbar('Peer invite URL copied', { variant: 'success' })
    } catch {
      enqueueSnackbar('Clipboard unavailable. Copy the URL manually.', { variant: 'warning' })
    }
  }

  return (
    <Card className="neo-panel">
      <CardHeader>
        <CardTitle>Trust score demo for APPs and ASAs</CardTitle>
        <CardDescription>
          Switch between built-in sample profiles and live on-chain trust graph reads, then share the exact scoring configuration via URL.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-sm border-2 border-border bg-background/70 p-3">
          <div className="flex w-full justify-between">
            <div className="flex gap-2">
              <Button variant={profileSource === 'sample' ? 'default' : 'outline'} onClick={() => setProfileSource('sample')}>
                Sample profiles
              </Button>

              <Button variant={profileSource === 'chain' ? 'default' : 'outline'} onClick={() => setProfileSource('chain')}>
                On-chain profiles
              </Button>
            </div>

            <Button variant="outline" onClick={copyShareLink}>
              Copy share URL
            </Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
            <label htmlFor="seed-account" className="text-sm font-medium text-foreground">
              Seed account
              <Input
                id="seed-account"
                list="seed-account-options"
                value={seedAccount}
                onChange={(event) => setSeedAccount(event.target.value)}
                placeholder={profileSource === 'chain' ? 'Algorand address' : 'ALICE'}
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
                onChange={(event) => setSelectedAppId(BigInt(event.target.value))}
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
                onChange={(event) => setSelectedAssetId(BigInt(event.target.value))}
              >
                {assetTargets.map((target) => (
                  <option key={target.id.toString()} value={target.id.toString()}>
                    {target.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {profileSource === 'chain' && (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <label htmlFor="vibecheck-app-id" className="text-sm font-medium text-foreground">
                Vibecheck app id
                <Input
                  id="vibecheck-app-id"
                  type="number"
                  min={1}
                  value={onChainAppId}
                  onChange={(event) => setOnChainAppId(event.target.value)}
                  placeholder="e.g. 123456"
                />
              </label>
              <Button onClick={loadOnChainProfiles} disabled={isLoadingOnChainProfiles}>
                {isLoadingOnChainProfiles ? 'Loading network...' : 'Load on-chain network'}
              </Button>
            </div>
          )}

          {profileSource === 'chain' && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Loaded profiles: {onChainProfiles.length}</Badge>
              {!activeAddress && <Badge variant="outline">Connect wallet to load on-chain profiles</Badge>}
              {onChainError && <Badge variant="outline">Error: {onChainError}</Badge>}
            </div>
          )}

          {profileSource === 'chain' && (
            <div className="grid gap-4 rounded-sm border-2 border-border bg-card/70 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Manage your on-chain trust profile</p>
                  <p className="text-xs text-muted-foreground">Add or remove APPs, ASAs, and peers directly in this app instance.</p>
                </div>
                <Button onClick={initProfile} disabled={isMutatingProfile}>
                  {isMutatingProfile ? 'Working...' : 'Init profile'}
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <label htmlFor="mutation-app-id" className="text-sm font-medium text-foreground">
                  APP id
                  <Input
                    id="mutation-app-id"
                    type="number"
                    min={1}
                    value={mutationAppIdInput}
                    onChange={(event) => setMutationAppIdInput(event.target.value)}
                    placeholder="e.g. 12345"
                  />
                </label>
                <Button variant="secondary" onClick={addTrustedApp} disabled={isMutatingProfile}>
                  Add APP
                </Button>
                <Button variant="outline" onClick={removeTrustedApp} disabled={isMutatingProfile}>
                  Remove APP
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <label htmlFor="mutation-asa-id" className="text-sm font-medium text-foreground">
                  ASA id
                  <Input
                    id="mutation-asa-id"
                    type="number"
                    min={1}
                    value={mutationAsaIdInput}
                    onChange={(event) => setMutationAsaIdInput(event.target.value)}
                    placeholder="e.g. 31566704"
                  />
                </label>
                <Button variant="secondary" onClick={addTrustedAsa} disabled={isMutatingProfile}>
                  Add ASA
                </Button>
                <Button variant="outline" onClick={removeTrustedAsa} disabled={isMutatingProfile}>
                  Remove ASA
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
                <label htmlFor="mutation-peer-address" className="text-sm font-medium text-foreground">
                  Peer address
                  <Input
                    id="mutation-peer-address"
                    value={mutationPeerInput}
                    onChange={(event) => setMutationPeerInput(event.target.value)}
                    placeholder="Algorand address"
                  />
                </label>
                <Button variant="secondary" onClick={addTrustedPeer} disabled={isMutatingProfile}>
                  Add peer
                </Button>
                <Button variant="outline" onClick={removeTrustedPeer} disabled={isMutatingProfile}>
                  Remove peer
                </Button>
              </div>

              <div className="rounded-sm border border-border bg-background/70 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Peer invite QR</p>
                    <p className="text-xs text-muted-foreground">Share this so another user can prefill your address in their add-peer form.</p>
                  </div>
                  <Button variant="outline" onClick={copyPeerInviteLink} disabled={!peerInviteLink}>
                    Copy invite URL
                  </Button>
                </div>

                {peerInviteQrUrl ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
                    <img src={peerInviteQrUrl} alt="Peer invite QR code" width={220} height={220} className="rounded-sm border border-border" />
                    <Input readOnly value={peerInviteLink} />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">Connect wallet to generate your peer invite QR code.</p>
                )}
              </div>
            </div>
          )}
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
      </CardContent>
    </Card>
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

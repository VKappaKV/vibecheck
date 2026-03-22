import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { isValidAddress } from 'algosdk'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VibecheckClient, VibecheckFactory } from '../../contracts/Vibecheck'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../../utils/network/getAlgoClientConfigs'
import {
  analyzeAppTrust,
  analyzeAssetTrust,
  scoreAppTrust,
  scoreAssetTrust,
  TrustProfile,
  TrustScoreOptions,
} from '../../utils/trustScores'
import { collectProfilesFromChain } from './collectProfilesFromChain'
import { DEFAULT_OPTIONS } from './constants'
import { parseBigInt, parsePositiveBigInt, parseScoreOptions, parseScoreTab } from './parsers'
import { readProfileSnapshot } from './readProfileSnapshot'
import { ScoreEntry, ScoreTab, ScoreTarget } from './types'

type EnqueueSnackbar = (message: string, options?: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info' }) => void

interface NfdRecord {
  name?: string
  properties?: {
    userDefined?: {
      avatar?: string
    }
    verified?: {
      avatar?: string
    }
  }
}

interface NfdLookupResponse {
  [address: string]: NfdRecord | undefined
}

interface AccountLookupResponse {
  account?: {
    assets?: unknown[]
  }
}

const ALGOD_CONFIG = getAlgodConfigFromViteEnvironment()
const INDEXER_CONFIG = getIndexerConfigFromViteEnvironment()

function getRequestHeaders(token: unknown): HeadersInit {
  const headers: Record<string, string> = { Accept: 'application/json' }

  if (typeof token === 'string') {
    const trimmed = token.trim()
    if (trimmed) {
      headers['X-Algo-API-Token'] = trimmed
    }
    return headers
  }

  if (token && typeof token === 'object') {
    for (const [key, value] of Object.entries(token)) {
      headers[key] = String(value)
    }
  }

  return headers
}

function getApiBaseUrl(server: string, port: number | string): string {
  const url = new URL(server)
  const nextPort = String(port)

  if (nextPort && !url.port && !((url.protocol === 'https:' && nextPort === '443') || (url.protocol === 'http:' && nextPort === '80'))) {
    url.port = nextPort
  }

  return url.toString().replace(/\/$/, '')
}

function getNfdLookupEndpoints(network: string): string[] {
  const normalized = network.toLowerCase()

  if (normalized.includes('local')) {
    return []
  }

  if (normalized.includes('testnet')) {
    return ['https://api.testnet.nf.domains', 'https://api.nf.domains']
  }

  if (normalized.includes('mainnet') || normalized.includes('production')) {
    return ['https://api.nf.domains']
  }

  return ['https://api.nf.domains']
}

async function fetchAsaOptInCount(args: {
  indexerServer: string
  indexerPort: string | number
  indexerToken: unknown
  address: string
}): Promise<number> {
  const baseUrl = getApiBaseUrl(args.indexerServer, args.indexerPort)
  const url = `${baseUrl}/v2/accounts/${encodeURIComponent(args.address)}`
  const response = await fetch(url, { headers: getRequestHeaders(args.indexerToken) })

  if (!response.ok) {
    throw new Error(`Unable to load account holdings (${response.status})`)
  }

  const data = (await response.json()) as AccountLookupResponse
  return data.account?.assets?.length ?? 0
}

async function fetchNfdData(network: string, address: string): Promise<{ name: string; avatarUrl: string } | null> {
  const endpoints = getNfdLookupEndpoints(network)

  for (const endpoint of endpoints) {
    const url = `${endpoint}/nfd/lookup?address=${encodeURIComponent(address)}&view=thumbnail`

    try {
      const response = await fetch(url, { headers: { Accept: 'application/json' } })

      if (response.status === 404) {
        continue
      }

      if (!response.ok) {
        continue
      }

      const payload = (await response.json()) as NfdLookupResponse
      const record = payload[address] ?? payload[address.toUpperCase()]

      if (!record?.name) {
        continue
      }

      return {
        name: record.name,
        avatarUrl: record.properties?.verified?.avatar ?? record.properties?.userDefined?.avatar ?? '',
      }
    } catch {
      continue
    }
  }

  return null
}

interface UseTrustDemoDataArgs {
  activeAddress: string | null
  enqueueSnackbar: EnqueueSnackbar
}

export interface TrustDemoDataState {
  algorand: AlgorandClient
  seedAccount: string
  setSeedAccount: (value: string) => void
  tabValue: ScoreTab
  setTabValue: (value: ScoreTab) => void
  selectedAppId: bigint
  setSelectedAppId: (value: bigint) => void
  selectedAssetId: bigint
  setSelectedAssetId: (value: bigint) => void
  analysisExpanded: boolean
  setAnalysisExpanded: (value: boolean) => void
  scoreOptions: Required<TrustScoreOptions>
  setScoreOptions: (value: Required<TrustScoreOptions>) => void
  onChainAppId: string
  onChainProfiles: TrustProfile[]
  isLoadingOnChainProfiles: boolean
  isOnChainProfilesStale: boolean
  onChainError: string | null
  isLoadingProfileSummary: boolean
  isProfileSummaryStale: boolean
  profileSummaryError: string | null
  isProfileInitialized: boolean | null
  trustedAppCount: number
  trustedAsaCount: number
  trustedPeerCount: number
  asaOptInCount: number
  nfdName: string
  nfdAvatarUrl: string
  invitePeerPrefill: string
  seedAccounts: string[]
  appTargets: ScoreTarget[]
  assetTargets: ScoreTarget[]
  appScores: ScoreEntry[]
  assetScores: ScoreEntry[]
  activeTargetLabel: string
  activeAnalysis: ReturnType<typeof analyzeAppTrust>
  peerInviteLink: string
  peerInviteQrUrl: string
  refreshOnChainProfiles: () => Promise<void>
  refreshProfileSummary: () => Promise<void>
  markTrustDataStale: () => void
}

export function useTrustDemoData({ activeAddress, enqueueSnackbar }: UseTrustDemoDataArgs): TrustDemoDataState {
  const [searchParams, setSearchParams] = useSearchParams()

  const [seedAccount, setSeedAccount] = useState<string>(() => searchParams.get('seed') ?? '')
  const [tabValue, setTabValue] = useState<ScoreTab>(() => parseScoreTab(searchParams.get('tab')))
  const [selectedAppId, setSelectedAppId] = useState<bigint>(() => parseBigInt(searchParams.get('appTarget'), 1n))
  const [selectedAssetId, setSelectedAssetId] = useState<bigint>(() => parseBigInt(searchParams.get('asaTarget'), 1n))
  const [analysisExpanded, setAnalysisExpanded] = useState<boolean>(() => searchParams.get('analysis') === '1')
  const [scoreOptions, setScoreOptions] = useState<Required<TrustScoreOptions>>(() => parseScoreOptions(searchParams, DEFAULT_OPTIONS))
  const onChainAppId = useMemo(() => {
    const parsed = parsePositiveBigInt(import.meta.env.VITE_VIBECHECK_APP_ID?.trim() ?? '')
    return parsed ? parsed.toString() : ''
  }, [])
  const [onChainProfiles, setOnChainProfiles] = useState<TrustProfile[]>([])
  const [isLoadingOnChainProfiles, setIsLoadingOnChainProfiles] = useState<boolean>(false)
  const [isOnChainProfilesStale, setIsOnChainProfilesStale] = useState<boolean>(true)
  const [onChainError, setOnChainError] = useState<string | null>(null)
  const [isLoadingProfileSummary, setIsLoadingProfileSummary] = useState<boolean>(false)
  const [isProfileSummaryStale, setIsProfileSummaryStale] = useState<boolean>(true)
  const [profileSummaryError, setProfileSummaryError] = useState<string | null>(null)
  const [isProfileInitialized, setIsProfileInitialized] = useState<boolean | null>(null)
  const [trustedAppCount, setTrustedAppCount] = useState<number>(0)
  const [trustedAsaCount, setTrustedAsaCount] = useState<number>(0)
  const [trustedPeerCount, setTrustedPeerCount] = useState<number>(0)
  const [asaOptInCount, setAsaOptInCount] = useState<number>(0)
  const [nfdName, setNfdName] = useState<string>('')
  const [nfdAvatarUrl, setNfdAvatarUrl] = useState<string>('')
  const onChainProfilesRequestId = useRef(0)
  const profileSummaryRequestId = useRef(0)

  const invitePeerPrefill = useMemo(() => searchParams.get('invitePeer') ?? '', [searchParams])

  const algorand = useMemo(
    () =>
      AlgorandClient.fromConfig({
        algodConfig: ALGOD_CONFIG,
        indexerConfig: INDEXER_CONFIG,
      }),
    [],
  )

  const onChainAppClient = useMemo<VibecheckClient | null>(() => {
    const appId = parsePositiveBigInt(onChainAppId.trim())

    if (!activeAddress || !appId) {
      return null
    }

    return new VibecheckFactory({
      algorand,
      defaultSender: activeAddress,
    }).getAppClientById({ appId })
  }, [activeAddress, algorand, onChainAppId])

  useEffect(() => {
    if (!seedAccount && activeAddress) {
      setSeedAccount(activeAddress)
    }
  }, [activeAddress, seedAccount])

  // Persist analysis controls in the URL so every state is shareable.
  useEffect(() => {
    const next = new URLSearchParams()
    next.set('seed', seedAccount)
    next.set('tab', tabValue)
    next.set('appTarget', selectedAppId.toString())
    next.set('asaTarget', selectedAssetId.toString())
    next.set('depth', String(scoreOptions.maxDepth))
    next.set('decay', String(scoreOptions.depthDecay))
    next.set('dw', String(scoreOptions.directWeight))
    next.set('pw', String(scoreOptions.peerWeight))
    next.set('analysis', analysisExpanded ? '1' : '0')
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [
    analysisExpanded,
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

  const seedAccounts = useMemo(() => onChainProfiles.map((profile) => profile.account), [onChainProfiles])

  const appTargets = useMemo<ScoreTarget[]>(() => {
    const uniqueIds = new Set(onChainProfiles.flatMap((profile) => profile.trustedApps))
    if (uniqueIds.size === 0) {
      return [{ id: selectedAppId, label: `APP ${selectedAppId.toString()}` }]
    }

    return [...uniqueIds]
      .sort((a, b) => Number(a - b))
      .map((id) => ({
        id,
        label: `APP ${id.toString()}`,
      }))
  }, [onChainProfiles, selectedAppId])

  const assetTargets = useMemo<ScoreTarget[]>(() => {
    const uniqueIds = new Set(onChainProfiles.flatMap((profile) => profile.trustedAsas))
    if (uniqueIds.size === 0) {
      return [{ id: selectedAssetId, label: `ASA ${selectedAssetId.toString()}` }]
    }

    return [...uniqueIds]
      .sort((a, b) => Number(a - b))
      .map((id) => ({
        id,
        label: `ASA ${id.toString()}`,
      }))
  }, [onChainProfiles, selectedAssetId])

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

  const appScores = useMemo<ScoreEntry[]>(
    () =>
      appTargets
        .map((target) => ({
          ...target,
          score: scoreAppTrust({
            seedAccount,
            targetAppId: target.id,
            profiles: onChainProfiles,
            options: scoreOptions,
          }),
        }))
        .sort((a, b) => b.score - a.score),
    [appTargets, onChainProfiles, scoreOptions, seedAccount],
  )

  const assetScores = useMemo<ScoreEntry[]>(
    () =>
      assetTargets
        .map((target) => ({
          ...target,
          score: scoreAssetTrust({
            seedAccount,
            targetAssetId: target.id,
            profiles: onChainProfiles,
            options: scoreOptions,
          }),
        }))
        .sort((a, b) => b.score - a.score),
    [assetTargets, onChainProfiles, scoreOptions, seedAccount],
  )

  const appNetworkAnalysis = useMemo(
    () => analyzeAppTrust({ seedAccount, targetAppId: selectedAppId, profiles: onChainProfiles, options: scoreOptions }),
    [onChainProfiles, scoreOptions, seedAccount, selectedAppId],
  )

  const assetNetworkAnalysis = useMemo(
    () => analyzeAssetTrust({ seedAccount, targetAssetId: selectedAssetId, profiles: onChainProfiles, options: scoreOptions }),
    [onChainProfiles, scoreOptions, seedAccount, selectedAssetId],
  )

  const activeTargetLabel = useMemo(() => {
    if (tabValue === 'apps') {
      return appTargets.find((target) => target.id === selectedAppId)?.label ?? 'Unknown APP'
    }

    return assetTargets.find((target) => target.id === selectedAssetId)?.label ?? 'Unknown ASA'
  }, [appTargets, assetTargets, selectedAppId, selectedAssetId, tabValue])

  const activeAnalysis = tabValue === 'apps' ? appNetworkAnalysis : assetNetworkAnalysis

  const resetProfileSummary = useCallback(() => {
    setIsLoadingProfileSummary(false)
    setProfileSummaryError(null)
    setIsProfileInitialized(null)
    setTrustedAppCount(0)
    setTrustedAsaCount(0)
    setTrustedPeerCount(0)
    setAsaOptInCount(0)
    setNfdName('')
    setNfdAvatarUrl('')
  }, [])

  const markTrustDataStale = useCallback(() => {
    setIsOnChainProfilesStale(true)
    setIsProfileSummaryStale(true)
  }, [])

  const refreshOnChainProfiles = useCallback(async () => {
    if (!activeAddress) {
      setOnChainError('Connect a wallet before loading on-chain profiles')
      enqueueSnackbar('Connect a wallet before loading on-chain profiles', { variant: 'warning' })
      setIsOnChainProfilesStale(true)
      return
    }

    const trimmedSeed = seedAccount.trim()
    if (!isValidAddress(trimmedSeed)) {
      setOnChainError('Seed account must be a valid Algorand address')
      enqueueSnackbar('Seed account must be a valid Algorand address', { variant: 'error' })
      setIsOnChainProfilesStale(true)
      return
    }

    const appId = parsePositiveBigInt(onChainAppId.trim())
    if (!appId || !onChainAppClient) {
      setOnChainError('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.')
      enqueueSnackbar('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.', {
        variant: 'error',
      })
      setIsOnChainProfilesStale(true)
      return
    }

    const requestId = onChainProfilesRequestId.current + 1
    onChainProfilesRequestId.current = requestId

    setIsLoadingOnChainProfiles(true)
    setOnChainError(null)

    try {
      const profiles = await collectProfilesFromChain(onChainAppClient, trimmedSeed, scoreOptions.maxDepth)

      if (requestId !== onChainProfilesRequestId.current) {
        return
      }

      setOnChainProfiles(profiles)
      setIsOnChainProfilesStale(false)
      enqueueSnackbar(`Loaded ${profiles.length} profiles from app ${appId.toString()}`, { variant: 'success' })
    } catch (error) {
      if (requestId !== onChainProfilesRequestId.current) {
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to load on-chain profiles'
      setOnChainError(message)
      setIsOnChainProfilesStale(true)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      if (requestId === onChainProfilesRequestId.current) {
        setIsLoadingOnChainProfiles(false)
      }
    }
  }, [activeAddress, enqueueSnackbar, onChainAppClient, onChainAppId, scoreOptions.maxDepth, seedAccount])

  const refreshProfileSummary = useCallback(async () => {
    if (!activeAddress) {
      resetProfileSummary()
      setIsProfileSummaryStale(false)
      return
    }

    if (!onChainAppClient) {
      resetProfileSummary()
      setProfileSummaryError('Vibecheck app id not configured')
      setIsProfileSummaryStale(true)
      return
    }

    const requestId = profileSummaryRequestId.current + 1
    profileSummaryRequestId.current = requestId

    setIsLoadingProfileSummary(true)
    setProfileSummaryError(null)

    try {
      const [trustedAppsBoxValue, profileSnapshot, nextAsaOptInCount, nfdIdentity] = await Promise.all([
        onChainAppClient.state.box.trustedApp.value(activeAddress),
        readProfileSnapshot({
          client: onChainAppClient,
          account: activeAddress,
        }),
        fetchAsaOptInCount({
          indexerServer: INDEXER_CONFIG.server,
          indexerPort: INDEXER_CONFIG.port,
          indexerToken: INDEXER_CONFIG.token,
          address: activeAddress,
        }),
        fetchNfdData(ALGOD_CONFIG.network, activeAddress),
      ])

      if (requestId !== profileSummaryRequestId.current) {
        return
      }

      const profileExists = trustedAppsBoxValue !== undefined

      setIsProfileInitialized(profileExists)
      setTrustedAppCount(profileSnapshot.trustedApps.length)
      setTrustedAsaCount(profileSnapshot.trustedAsas.length)
      setTrustedPeerCount(profileSnapshot.trustedPeers.length)
      setAsaOptInCount(nextAsaOptInCount)
      setNfdName(nfdIdentity?.name ?? '')
      setNfdAvatarUrl(nfdIdentity?.avatarUrl ?? '')
      setIsProfileSummaryStale(false)
    } catch (error) {
      if (requestId !== profileSummaryRequestId.current) {
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to load profile overview'
      resetProfileSummary()
      setProfileSummaryError(message)
      setIsProfileSummaryStale(true)
    } finally {
      if (requestId === profileSummaryRequestId.current) {
        setIsLoadingProfileSummary(false)
      }
    }
  }, [activeAddress, onChainAppClient, resetProfileSummary])

  useEffect(() => {
    onChainProfilesRequestId.current += 1
    setIsOnChainProfilesStale(true)
  }, [activeAddress, onChainAppId, scoreOptions.maxDepth, seedAccount])

  useEffect(() => {
    profileSummaryRequestId.current += 1
    resetProfileSummary()

    if (!activeAddress) {
      setIsProfileSummaryStale(false)
      return
    }

    setIsProfileSummaryStale(true)
  }, [activeAddress, onChainAppId, resetProfileSummary])

  const peerInviteLink = useMemo(() => {
    if (!activeAddress) {
      return ''
    }

    const inviteUrl = new URL(window.location.href)
    inviteUrl.searchParams.set('seed', activeAddress)
    inviteUrl.searchParams.set('tab', 'apps')
    inviteUrl.searchParams.set('invitePeer', activeAddress)

    return inviteUrl.toString()
  }, [activeAddress])

  const peerInviteQrUrl = useMemo(() => {
    if (!peerInviteLink) {
      return ''
    }

    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(peerInviteLink)}`
  }, [peerInviteLink])

  return {
    algorand,
    seedAccount,
    setSeedAccount,
    tabValue,
    setTabValue,
    selectedAppId,
    setSelectedAppId,
    selectedAssetId,
    setSelectedAssetId,
    analysisExpanded,
    setAnalysisExpanded,
    scoreOptions,
    setScoreOptions,
    onChainAppId,
    onChainProfiles,
    isLoadingOnChainProfiles,
    isOnChainProfilesStale,
    onChainError,
    isLoadingProfileSummary,
    isProfileSummaryStale,
    profileSummaryError,
    isProfileInitialized,
    trustedAppCount,
    trustedAsaCount,
    trustedPeerCount,
    asaOptInCount,
    nfdName,
    nfdAvatarUrl,
    invitePeerPrefill,
    seedAccounts,
    appTargets,
    assetTargets,
    appScores,
    assetScores,
    activeTargetLabel,
    activeAnalysis,
    peerInviteLink,
    peerInviteQrUrl,
    refreshOnChainProfiles,
    refreshProfileSummary,
    markTrustDataStale,
  }
}

import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { isValidAddress } from 'algosdk'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { VibecheckFactory } from '../../contracts/Vibecheck'
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
import { ScoreEntry, ScoreTab, ScoreTarget } from './types'

type EnqueueSnackbar = (message: string, options?: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info' }) => void

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
  onChainError: string | null
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
  loadOnChainProfiles: (options?: { silent?: boolean }) => Promise<void>
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
  const [onChainError, setOnChainError] = useState<string | null>(null)

  const invitePeerPrefill = useMemo(() => searchParams.get('invitePeer') ?? '', [searchParams])

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

  const loadOnChainProfiles = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false

      if (!activeAddress) {
        setOnChainError('Connect a wallet before loading on-chain profiles')
        if (!silent) {
          enqueueSnackbar('Connect a wallet before loading on-chain profiles', { variant: 'warning' })
        }
        return
      }

      const trimmedSeed = seedAccount.trim()
      if (!isValidAddress(trimmedSeed)) {
        setOnChainError('Seed account must be a valid Algorand address')
        if (!silent) {
          enqueueSnackbar('Seed account must be a valid Algorand address', { variant: 'error' })
        }
        return
      }

      const appId = parsePositiveBigInt(onChainAppId.trim())
      if (!appId) {
        setOnChainError('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.')
        if (!silent) {
          enqueueSnackbar('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.', {
            variant: 'error',
          })
        }
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
        if (!silent) {
          enqueueSnackbar(`Loaded ${profiles.length} profiles from app ${appId.toString()}`, { variant: 'success' })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load on-chain profiles'
        setOnChainError(message)
        if (!silent) {
          enqueueSnackbar(message, { variant: 'error' })
        }
      } finally {
        setIsLoadingOnChainProfiles(false)
      }
    },
    [activeAddress, algorand, enqueueSnackbar, onChainAppId, scoreOptions.maxDepth, seedAccount],
  )

  useEffect(() => {
    const appId = parsePositiveBigInt(onChainAppId.trim())
    const trimmedSeed = seedAccount.trim()
    if (!activeAddress || !appId || !isValidAddress(trimmedSeed)) {
      return
    }

    void loadOnChainProfiles({ silent: true })
  }, [activeAddress, loadOnChainProfiles, onChainAppId, seedAccount])

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
    onChainError,
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
    loadOnChainProfiles,
  }
}

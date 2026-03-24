import { useEffect, useMemo } from 'react'
import { VibecheckClient } from '../../../contracts/Vibecheck'
import { analyzeAppTrust, TrustScoreOptions } from '../../../utils/trustScores'
import { ScoreEntry, ScoreTab, ScoreTarget } from '../types'
import { buildPeerInviteLink, buildQrCodeUrl, getCurrentBrowserHref } from '../utils/urls'
import { useTrustDemoDerivedState } from './useTrustDemoDerivedState'
import { useTrustDemoQueryState } from './useTrustDemoQueryState'
import { useTrustOnChainProfiles } from './useTrustOnChainProfiles'
import { useTrustProfileSummary } from './useTrustProfileSummary'

type EnqueueSnackbar = (message: string, options?: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info' }) => void

interface UseTrustDemoDataArgs {
  activeAddress: string | null
  enqueueSnackbar: EnqueueSnackbar
  onChainAppId: string
  onChainAppClient: VibecheckClient | null
}

export interface TrustDemoDataState {
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
  onChainProfiles: ReturnType<typeof useTrustOnChainProfiles>['onChainProfiles']
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

export function useTrustDemoData({
  activeAddress,
  enqueueSnackbar,
  onChainAppId,
  onChainAppClient,
}: UseTrustDemoDataArgs): TrustDemoDataState {
  const queryState = useTrustDemoQueryState()
  const {
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
    invitePeerPrefill,
  } = queryState

  useEffect(() => {
    if (!seedAccount && activeAddress) {
      setSeedAccount(activeAddress)
    }
  }, [activeAddress, seedAccount, setSeedAccount])

  const onChainProfilesState = useTrustOnChainProfiles({
    activeAddress,
    seedAccount,
    onChainAppId,
    onChainAppClient,
    maxDepth: scoreOptions.maxDepth,
    enqueueSnackbar,
  })

  const profileSummaryState = useTrustProfileSummary({
    activeAddress,
    onChainAppId,
    onChainAppClient,
  })

  const derivedState = useTrustDemoDerivedState({
    onChainProfiles: onChainProfilesState.onChainProfiles,
    seedAccount,
    tabValue,
    selectedAppId,
    setSelectedAppId,
    selectedAssetId,
    setSelectedAssetId,
    scoreOptions,
  })

  const peerInviteLink = useMemo(() => buildPeerInviteLink(getCurrentBrowserHref(), activeAddress), [activeAddress])
  const peerInviteQrUrl = useMemo(() => buildQrCodeUrl(peerInviteLink), [peerInviteLink])

  const markTrustDataStale = () => {
    onChainProfilesState.markOnChainProfilesStale()
    profileSummaryState.markProfileSummaryStale()
  }

  return {
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
    onChainProfiles: onChainProfilesState.onChainProfiles,
    isLoadingOnChainProfiles: onChainProfilesState.isLoadingOnChainProfiles,
    isOnChainProfilesStale: onChainProfilesState.isOnChainProfilesStale,
    onChainError: onChainProfilesState.onChainError,
    isLoadingProfileSummary: profileSummaryState.isLoadingProfileSummary,
    isProfileSummaryStale: profileSummaryState.isProfileSummaryStale,
    profileSummaryError: profileSummaryState.profileSummaryError,
    isProfileInitialized: profileSummaryState.isProfileInitialized,
    trustedAppCount: profileSummaryState.trustedAppCount,
    trustedAsaCount: profileSummaryState.trustedAsaCount,
    trustedPeerCount: profileSummaryState.trustedPeerCount,
    asaOptInCount: profileSummaryState.asaOptInCount,
    nfdName: profileSummaryState.nfdName,
    nfdAvatarUrl: profileSummaryState.nfdAvatarUrl,
    invitePeerPrefill,
    seedAccounts: derivedState.seedAccounts,
    appTargets: derivedState.appTargets,
    assetTargets: derivedState.assetTargets,
    appScores: derivedState.appScores,
    assetScores: derivedState.assetScores,
    activeTargetLabel: derivedState.activeTargetLabel,
    activeAnalysis: derivedState.activeAnalysis,
    peerInviteLink,
    peerInviteQrUrl,
    refreshOnChainProfiles: onChainProfilesState.refreshOnChainProfiles,
    refreshProfileSummary: profileSummaryState.refreshProfileSummary,
    markTrustDataStale,
  }
}

import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useEffect, useMemo, useState } from 'react'
import { TrustNetworkAnalysis, TrustScoreOptions } from '../../../utils/trustScores'
import { createTrustDemoAlgorandClient, createVibecheckAppClient, getConfiguredVibecheckAppId } from '../data/client'
import { ScoreEntry, ScoreTab, ScoreTarget } from '../types'
import { copyTextToClipboard, getCurrentBrowserHref } from '../utils/urls'
import { useTrustDemoData } from './useTrustDemoData'
import { useTrustProfileMutations } from './useTrustProfileMutations'

export interface TrustDemoProfileOverviewState {
  activeAddress: string | null
  isLoadingProfileSummary: boolean
  isProfileSummaryStale: boolean
  profileSummaryError: string | null
  isProfileInitialized: boolean | null
  nfdName: string
  nfdAvatarUrl: string
  asaOptInCount: number
  trustedAppCount: number
  trustedAsaCount: number
  trustedPeerCount: number
  peerInviteQrUrl: string
  peerInviteLink: string
  onRefreshProfileSummary: () => Promise<void>
  onCopyPeerInviteLink: () => Promise<void>
}

export interface TrustDemoProfileManagementState {
  isMutatingProfile: boolean
  onInitProfile: () => Promise<void>
  mutationAppIdInput: string
  onMutationAppIdChange: (value: string) => void
  onAddTrustedApp: () => Promise<void>
  onRemoveTrustedApp: () => Promise<void>
  mutationAsaIdInput: string
  onMutationAsaIdChange: (value: string) => void
  onAddTrustedAsa: () => Promise<void>
  onRemoveTrustedAsa: () => Promise<void>
  mutationPeerInput: string
  onMutationPeerChange: (value: string) => void
  onAddTrustedPeer: () => Promise<void>
  onRemoveTrustedPeer: () => Promise<void>
}

export interface TrustDemoLiveDataControlsState {
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

export interface TrustDemoScoreTabsState {
  tabValue: ScoreTab
  onTabChange: (value: ScoreTab) => void
  appScores: ScoreEntry[]
  assetScores: ScoreEntry[]
}

export interface TrustDemoNetworkAnalysisState {
  expanded: boolean
  onToggle: () => void
  options: Required<TrustScoreOptions>
  onOptionsChange: (next: Required<TrustScoreOptions>) => void
  analysis: TrustNetworkAnalysis
  targetLabel: string
  targetTypeLabel: string
}

export interface TrustDemoState {
  profileOverview: TrustDemoProfileOverviewState
  profileManagement: TrustDemoProfileManagementState
  analysisSection: {
    liveDataControls: TrustDemoLiveDataControlsState
    scoreTabs: TrustDemoScoreTabsState
    networkAnalysis: TrustDemoNetworkAnalysisState
  }
}

export function useTrustDemo(): TrustDemoState {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const algorand = useMemo(() => createTrustDemoAlgorandClient(), [])
  const onChainAppId = useMemo(() => getConfiguredVibecheckAppId(), [])
  const onChainAppClient = useMemo(
    () => createVibecheckAppClient({ algorand, activeAddress, onChainAppId }),
    [activeAddress, algorand, onChainAppId],
  )

  const data = useTrustDemoData({
    activeAddress,
    enqueueSnackbar,
    onChainAppId,
    onChainAppClient,
  })

  const [mutationAppIdInput, setMutationAppIdInput] = useState<string>('')
  const [mutationAsaIdInput, setMutationAsaIdInput] = useState<string>('')
  const [mutationPeerInput, setMutationPeerInput] = useState<string>(data.invitePeerPrefill)

  useEffect(() => {
    if (data.invitePeerPrefill) {
      setMutationPeerInput(data.invitePeerPrefill)
    }
  }, [data.invitePeerPrefill])

  const mutations = useTrustProfileMutations({
    algorand,
    activeAddress,
    transactionSigner,
    onChainAppClient,
    mutationAppIdInput,
    mutationAsaIdInput,
    mutationPeerInput,
    enqueueSnackbar,
    onMutationSuccess: () => {
      data.markTrustDataStale()
    },
  })

  const copyShareLink = async () => {
    const shareUrl = getCurrentBrowserHref()
    const didCopy = await copyTextToClipboard(shareUrl)

    if (didCopy) {
      enqueueSnackbar('Shareable analysis URL copied', { variant: 'success' })
      return
    }

    enqueueSnackbar('Clipboard unavailable. Copy the URL from the browser bar.', { variant: 'warning' })
  }

  const copyPeerInviteLink = async () => {
    if (!data.peerInviteLink) {
      enqueueSnackbar('Connect wallet to generate a peer invite URL', { variant: 'warning' })
      return
    }

    const didCopy = await copyTextToClipboard(data.peerInviteLink)

    if (didCopy) {
      enqueueSnackbar('Peer invite URL copied', { variant: 'success' })
      return
    }

    enqueueSnackbar('Clipboard unavailable. Copy the URL manually.', { variant: 'warning' })
  }

  return {
    profileOverview: {
      activeAddress,
      isLoadingProfileSummary: data.isLoadingProfileSummary,
      isProfileSummaryStale: data.isProfileSummaryStale,
      profileSummaryError: data.profileSummaryError,
      isProfileInitialized: data.isProfileInitialized,
      nfdName: data.nfdName,
      nfdAvatarUrl: data.nfdAvatarUrl,
      asaOptInCount: data.asaOptInCount,
      trustedAppCount: data.trustedAppCount,
      trustedAsaCount: data.trustedAsaCount,
      trustedPeerCount: data.trustedPeerCount,
      peerInviteQrUrl: data.peerInviteQrUrl,
      peerInviteLink: data.peerInviteLink,
      onRefreshProfileSummary: data.refreshProfileSummary,
      onCopyPeerInviteLink: copyPeerInviteLink,
    },
    profileManagement: {
      isMutatingProfile: mutations.isMutatingProfile,
      onInitProfile: mutations.initProfile,
      mutationAppIdInput,
      onMutationAppIdChange: setMutationAppIdInput,
      onAddTrustedApp: mutations.addTrustedApp,
      onRemoveTrustedApp: mutations.removeTrustedApp,
      mutationAsaIdInput,
      onMutationAsaIdChange: setMutationAsaIdInput,
      onAddTrustedAsa: mutations.addTrustedAsa,
      onRemoveTrustedAsa: mutations.removeTrustedAsa,
      mutationPeerInput,
      onMutationPeerChange: setMutationPeerInput,
      onAddTrustedPeer: mutations.addTrustedPeer,
      onRemoveTrustedPeer: mutations.removeTrustedPeer,
    },
    analysisSection: {
      liveDataControls: {
        seedAccount: data.seedAccount,
        seedAccounts: data.seedAccounts,
        onSeedAccountChange: data.setSeedAccount,
        appTargets: data.appTargets,
        selectedAppId: data.selectedAppId,
        onSelectAppId: data.setSelectedAppId,
        assetTargets: data.assetTargets,
        selectedAssetId: data.selectedAssetId,
        onSelectAssetId: data.setSelectedAssetId,
        onChainAppId: data.onChainAppId,
        isLoadingOnChainProfiles: data.isLoadingOnChainProfiles,
        isOnChainProfilesStale: data.isOnChainProfilesStale,
        onRefreshProfiles: () => void data.refreshOnChainProfiles(),
        onCopyShareUrl: () => void copyShareLink(),
        loadedProfiles: data.onChainProfiles.length,
        hasActiveAddress: Boolean(activeAddress),
        onChainError: data.onChainError,
      },
      scoreTabs: {
        tabValue: data.tabValue,
        onTabChange: data.setTabValue,
        appScores: data.appScores,
        assetScores: data.assetScores,
      },
      networkAnalysis: {
        expanded: data.analysisExpanded,
        onToggle: () => data.setAnalysisExpanded(!data.analysisExpanded),
        options: data.scoreOptions,
        onOptionsChange: data.setScoreOptions,
        analysis: data.activeAnalysis,
        targetLabel: data.activeTargetLabel,
        targetTypeLabel: data.tabValue === 'apps' ? 'APP' : 'ASA',
      },
    },
  }
}

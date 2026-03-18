import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { TrustNetworkAnalysis, TrustProfile, TrustScoreOptions } from '../../utils/trustScores'
import { ScoreEntry, ScoreTab, ScoreTarget } from './types'
import { useTrustDemoData } from './useTrustDemoData'
import { useTrustProfileMutations } from './useTrustProfileMutations'

export interface TrustDemoState {
  activeAddress: string | null
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
  mutationAppIdInput: string
  setMutationAppIdInput: (value: string) => void
  mutationAsaIdInput: string
  setMutationAsaIdInput: (value: string) => void
  mutationPeerInput: string
  setMutationPeerInput: (value: string) => void
  isMutatingProfile: boolean
  seedAccounts: string[]
  appTargets: ScoreTarget[]
  assetTargets: ScoreTarget[]
  appScores: ScoreEntry[]
  assetScores: ScoreEntry[]
  activeTargetLabel: string
  activeAnalysis: TrustNetworkAnalysis
  peerInviteLink: string
  peerInviteQrUrl: string
  loadOnChainProfiles: () => Promise<void>
  initProfile: () => Promise<void>
  addTrustedApp: () => Promise<void>
  removeTrustedApp: () => Promise<void>
  addTrustedAsa: () => Promise<void>
  removeTrustedAsa: () => Promise<void>
  addTrustedPeer: () => Promise<void>
  removeTrustedPeer: () => Promise<void>
  copyShareLink: () => Promise<void>
  copyPeerInviteLink: () => Promise<void>
}

export function useTrustDemo(): TrustDemoState {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()

  const data = useTrustDemoData({ activeAddress, enqueueSnackbar })

  const [mutationAppIdInput, setMutationAppIdInput] = useState<string>('')
  const [mutationAsaIdInput, setMutationAsaIdInput] = useState<string>('')
  const [mutationPeerInput, setMutationPeerInput] = useState<string>(data.invitePeerPrefill)

  const mutations = useTrustProfileMutations({
    algorand: data.algorand,
    activeAddress,
    transactionSigner,
    onChainAppId: data.onChainAppId,
    mutationAppIdInput,
    mutationAsaIdInput,
    mutationPeerInput,
    enqueueSnackbar,
    refreshProfiles: async () => {
      await data.loadOnChainProfiles({ silent: true })
    },
  })

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      enqueueSnackbar('Shareable analysis URL copied', { variant: 'success' })
    } catch {
      enqueueSnackbar('Clipboard unavailable. Copy the URL from the browser bar.', { variant: 'warning' })
    }
  }

  const copyPeerInviteLink = async () => {
    if (!data.peerInviteLink) {
      enqueueSnackbar('Connect wallet to generate a peer invite URL', { variant: 'warning' })
      return
    }

    try {
      await navigator.clipboard.writeText(data.peerInviteLink)
      enqueueSnackbar('Peer invite URL copied', { variant: 'success' })
    } catch {
      enqueueSnackbar('Clipboard unavailable. Copy the URL manually.', { variant: 'warning' })
    }
  }

  return {
    activeAddress,
    seedAccount: data.seedAccount,
    setSeedAccount: data.setSeedAccount,
    tabValue: data.tabValue,
    setTabValue: data.setTabValue,
    selectedAppId: data.selectedAppId,
    setSelectedAppId: data.setSelectedAppId,
    selectedAssetId: data.selectedAssetId,
    setSelectedAssetId: data.setSelectedAssetId,
    analysisExpanded: data.analysisExpanded,
    setAnalysisExpanded: data.setAnalysisExpanded,
    scoreOptions: data.scoreOptions,
    setScoreOptions: data.setScoreOptions,
    onChainAppId: data.onChainAppId,
    onChainProfiles: data.onChainProfiles,
    isLoadingOnChainProfiles: data.isLoadingOnChainProfiles,
    onChainError: data.onChainError,
    mutationAppIdInput,
    setMutationAppIdInput,
    mutationAsaIdInput,
    setMutationAsaIdInput,
    mutationPeerInput,
    setMutationPeerInput,
    isMutatingProfile: mutations.isMutatingProfile,
    seedAccounts: data.seedAccounts,
    appTargets: data.appTargets,
    assetTargets: data.assetTargets,
    appScores: data.appScores,
    assetScores: data.assetScores,
    activeTargetLabel: data.activeTargetLabel,
    activeAnalysis: data.activeAnalysis,
    peerInviteLink: data.peerInviteLink,
    peerInviteQrUrl: data.peerInviteQrUrl,
    loadOnChainProfiles: async () => {
      await data.loadOnChainProfiles()
    },
    initProfile: mutations.initProfile,
    addTrustedApp: mutations.addTrustedApp,
    removeTrustedApp: mutations.removeTrustedApp,
    addTrustedAsa: mutations.addTrustedAsa,
    removeTrustedAsa: mutations.removeTrustedAsa,
    addTrustedPeer: mutations.addTrustedPeer,
    removeTrustedPeer: mutations.removeTrustedPeer,
    copyShareLink,
    copyPeerInviteLink,
  }
}

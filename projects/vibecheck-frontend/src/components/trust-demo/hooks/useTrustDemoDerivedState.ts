import { useEffect, useMemo } from 'react'
import {
  analyzeAppTrust,
  analyzeAssetTrust,
  scoreAppTrust,
  scoreAssetTrust,
  TrustProfile,
  TrustScoreOptions,
} from '../../../utils/trustScores'
import { buildScoreEntries, buildScoreTargets } from '../utils/resourceHelpers'
import { ScoreEntry, ScoreTab, ScoreTarget } from '../types'

interface UseTrustDemoDerivedStateArgs {
  onChainProfiles: TrustProfile[]
  seedAccount: string
  tabValue: ScoreTab
  selectedAppId: bigint
  setSelectedAppId: (value: bigint) => void
  selectedAssetId: bigint
  setSelectedAssetId: (value: bigint) => void
  scoreOptions: Required<TrustScoreOptions>
}

export interface TrustDemoDerivedState {
  seedAccounts: string[]
  appTargets: ScoreTarget[]
  assetTargets: ScoreTarget[]
  appScores: ScoreEntry[]
  assetScores: ScoreEntry[]
  activeTargetLabel: string
  activeAnalysis: ReturnType<typeof analyzeAppTrust>
}

export function useTrustDemoDerivedState({
  onChainProfiles,
  seedAccount,
  tabValue,
  selectedAppId,
  setSelectedAppId,
  selectedAssetId,
  setSelectedAssetId,
  scoreOptions,
}: UseTrustDemoDerivedStateArgs): TrustDemoDerivedState {
  const seedAccounts = useMemo(() => onChainProfiles.map((profile) => profile.account), [onChainProfiles])

  const appTargets = useMemo<ScoreTarget[]>(
    () =>
      buildScoreTargets({
        profiles: onChainProfiles,
        selectedId: selectedAppId,
        labelPrefix: 'APP',
        selectIds: (profile) => profile.trustedApps,
      }),
    [onChainProfiles, selectedAppId],
  )

  const assetTargets = useMemo<ScoreTarget[]>(
    () =>
      buildScoreTargets({
        profiles: onChainProfiles,
        selectedId: selectedAssetId,
        labelPrefix: 'ASA',
        selectIds: (profile) => profile.trustedAsas,
      }),
    [onChainProfiles, selectedAssetId],
  )

  useEffect(() => {
    if (!appTargets.some((target) => target.id === selectedAppId)) {
      setSelectedAppId(appTargets[0]?.id ?? 1n)
    }
  }, [appTargets, selectedAppId, setSelectedAppId])

  useEffect(() => {
    if (!assetTargets.some((target) => target.id === selectedAssetId)) {
      setSelectedAssetId(assetTargets[0]?.id ?? 1n)
    }
  }, [assetTargets, selectedAssetId, setSelectedAssetId])

  const appScores = useMemo<ScoreEntry[]>(
    () =>
      buildScoreEntries({
        targets: appTargets,
        getScore: (target) =>
          scoreAppTrust({
            seedAccount,
            targetAppId: target.id,
            profiles: onChainProfiles,
            options: scoreOptions,
          }),
      }),
    [appTargets, onChainProfiles, scoreOptions, seedAccount],
  )

  const assetScores = useMemo<ScoreEntry[]>(
    () =>
      buildScoreEntries({
        targets: assetTargets,
        getScore: (target) =>
          scoreAssetTrust({
            seedAccount,
            targetAssetId: target.id,
            profiles: onChainProfiles,
            options: scoreOptions,
          }),
      }),
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

  return {
    seedAccounts,
    appTargets,
    assetTargets,
    appScores,
    assetScores,
    activeTargetLabel,
    activeAnalysis: tabValue === 'apps' ? appNetworkAnalysis : assetNetworkAnalysis,
  }
}

import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TrustScoreOptions } from '../../../utils/trustScores'
import { DEFAULT_OPTIONS } from '../constants'
import { ScoreTab } from '../types'
import { mergeTrustDemoSearchParams, readTrustDemoSearchState } from '../utils/urls'

export interface TrustDemoQueryState {
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
  invitePeerPrefill: string
}

function getInitialSearchState(searchParams: URLSearchParams) {
  return readTrustDemoSearchState(searchParams, DEFAULT_OPTIONS)
}

export function useTrustDemoQueryState(): TrustDemoQueryState {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialState = getInitialSearchState(searchParams)

  const [seedAccount, setSeedAccount] = useState<string>(initialState.seedAccount)
  const [tabValue, setTabValue] = useState<ScoreTab>(initialState.tabValue)
  const [selectedAppId, setSelectedAppId] = useState<bigint>(initialState.selectedAppId)
  const [selectedAssetId, setSelectedAssetId] = useState<bigint>(initialState.selectedAssetId)
  const [analysisExpanded, setAnalysisExpanded] = useState<boolean>(initialState.analysisExpanded)
  const [scoreOptions, setScoreOptions] = useState<Required<TrustScoreOptions>>(initialState.scoreOptions)

  useEffect(() => {
    const next = mergeTrustDemoSearchParams(searchParams, {
      seedAccount,
      tabValue,
      selectedAppId,
      selectedAssetId,
      analysisExpanded,
      scoreOptions,
    })

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [analysisExpanded, scoreOptions, searchParams, seedAccount, selectedAppId, selectedAssetId, setSearchParams, tabValue])

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
    invitePeerPrefill: searchParams.get('invitePeer') ?? '',
  }
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { VibecheckClient } from '../../../contracts/Vibecheck'
import { TRUST_DEMO_ALGOD_CONFIG, TRUST_DEMO_INDEXER_CONFIG } from '../data/client'
import { fetchAsaOptInCount, fetchNfdData } from '../data/profileLookup'
import { readProfileSnapshot } from '../data/readProfileSnapshot'

interface UseTrustProfileSummaryArgs {
  activeAddress: string | null
  onChainAppId: string
  onChainAppClient: VibecheckClient | null
}

export interface TrustProfileSummaryState {
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
  refreshProfileSummary: () => Promise<void>
  markProfileSummaryStale: () => void
}

export function useTrustProfileSummary({
  activeAddress,
  onChainAppId,
  onChainAppClient,
}: UseTrustProfileSummaryArgs): TrustProfileSummaryState {
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
  const requestIdRef = useRef(0)

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

  const markProfileSummaryStale = useCallback(() => {
    setIsProfileSummaryStale(true)
  }, [])

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

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

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
          indexerServer: TRUST_DEMO_INDEXER_CONFIG.server,
          indexerPort: TRUST_DEMO_INDEXER_CONFIG.port,
          indexerToken: TRUST_DEMO_INDEXER_CONFIG.token,
          address: activeAddress,
        }),
        fetchNfdData(TRUST_DEMO_ALGOD_CONFIG.network, activeAddress),
      ])

      if (requestId !== requestIdRef.current) {
        return
      }

      setIsProfileInitialized(trustedAppsBoxValue !== undefined)
      setTrustedAppCount(profileSnapshot.trustedApps.length)
      setTrustedAsaCount(profileSnapshot.trustedAsas.length)
      setTrustedPeerCount(profileSnapshot.trustedPeers.length)
      setAsaOptInCount(nextAsaOptInCount)
      setNfdName(nfdIdentity?.name ?? '')
      setNfdAvatarUrl(nfdIdentity?.avatarUrl ?? '')
      setIsProfileSummaryStale(false)
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to load profile overview'
      resetProfileSummary()
      setProfileSummaryError(message)
      setIsProfileSummaryStale(true)
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingProfileSummary(false)
      }
    }
  }, [activeAddress, onChainAppClient, resetProfileSummary])

  useEffect(() => {
    requestIdRef.current += 1
    resetProfileSummary()

    if (!activeAddress) {
      setIsProfileSummaryStale(false)
      return
    }

    setIsProfileSummaryStale(true)
  }, [activeAddress, onChainAppId, resetProfileSummary])

  return {
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
    refreshProfileSummary,
    markProfileSummaryStale,
  }
}

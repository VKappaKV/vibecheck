import { isValidAddress } from 'algosdk'
import { useCallback, useEffect, useRef, useState } from 'react'
import { VibecheckClient } from '../../../contracts/Vibecheck'
import { TrustProfile } from '../../../utils/trustScores'
import { collectProfilesFromChain } from '../data/collectProfilesFromChain'

type EnqueueSnackbar = (message: string, options?: { variant?: 'default' | 'error' | 'success' | 'warning' | 'info' }) => void

interface UseTrustOnChainProfilesArgs {
  activeAddress: string | null
  seedAccount: string
  onChainAppId: string
  onChainAppClient: VibecheckClient | null
  maxDepth: number
  enqueueSnackbar: EnqueueSnackbar
}

export interface TrustOnChainProfilesState {
  onChainProfiles: TrustProfile[]
  isLoadingOnChainProfiles: boolean
  isOnChainProfilesStale: boolean
  onChainError: string | null
  refreshOnChainProfiles: () => Promise<void>
  markOnChainProfilesStale: () => void
}

export function useTrustOnChainProfiles({
  activeAddress,
  seedAccount,
  onChainAppId,
  onChainAppClient,
  maxDepth,
  enqueueSnackbar,
}: UseTrustOnChainProfilesArgs): TrustOnChainProfilesState {
  const [onChainProfiles, setOnChainProfiles] = useState<TrustProfile[]>([])
  const [isLoadingOnChainProfiles, setIsLoadingOnChainProfiles] = useState<boolean>(false)
  const [isOnChainProfilesStale, setIsOnChainProfilesStale] = useState<boolean>(true)
  const [onChainError, setOnChainError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const markOnChainProfilesStale = useCallback(() => {
    setIsOnChainProfilesStale(true)
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

    if (!onChainAppId || !onChainAppClient) {
      setOnChainError('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.')
      enqueueSnackbar('Vibecheck app id is not configured. Set VITE_VIBECHECK_APP_ID in the frontend env.', {
        variant: 'error',
      })
      setIsOnChainProfilesStale(true)
      return
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setIsLoadingOnChainProfiles(true)
    setOnChainError(null)

    try {
      const profiles = await collectProfilesFromChain(onChainAppClient, trimmedSeed, maxDepth)

      if (requestId !== requestIdRef.current) {
        return
      }

      setOnChainProfiles(profiles)
      setIsOnChainProfilesStale(false)
      enqueueSnackbar(`Loaded ${profiles.length} profiles from app ${onChainAppId}`, { variant: 'success' })
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to load on-chain profiles'
      setOnChainError(message)
      setIsOnChainProfilesStale(true)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingOnChainProfiles(false)
      }
    }
  }, [activeAddress, enqueueSnackbar, maxDepth, onChainAppClient, onChainAppId, seedAccount])

  useEffect(() => {
    requestIdRef.current += 1
    setIsOnChainProfilesStale(true)
  }, [activeAddress, maxDepth, onChainAppId, seedAccount])

  return {
    onChainProfiles,
    isLoadingOnChainProfiles,
    isOnChainProfilesStale,
    onChainError,
    refreshOnChainProfiles,
    markOnChainProfilesStale,
  }
}
